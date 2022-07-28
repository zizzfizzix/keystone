import { CacheHint } from 'apollo-server-types';
import {
  BaseItem,
  GraphQLTypesForSchemaCcc,
  getGqlNames,
  NextFieldType,
  BaseSchemaCccTypeInfo,
  SchemaCccGraphQLTypes,
  SchemaCccHooks,
  KeystoneConfig,
  FindManyArgs,
  CacheHintArgs,
  MaybePromise,
} from '../../types';
import { graphql } from '../..';
import { FieldHooks } from '../../types/config/hooks';
import { FilterOrderArgs } from '../../types/config/fields';
import {
  ResolvedFieldAccessControl,
  ResolvedSchemaCccAccessControl,
  parseschemaCccAccessControl,
  parseFieldAccessControl,
} from './access-control';
import { getNamesFromSchemaCcc } from './utils';
import { ResolvedDBField, resolveRelationships } from './resolve-relationships';
import { outputTypeField } from './queries/output-field';
import { assertFieldsValid } from './field-assertions';

export type InitialisedField = Omit<NextFieldType, 'dbField' | 'access' | 'graphql'> & {
  dbField: ResolvedDBField;
  access: ResolvedFieldAccessControl;
  hooks: FieldHooks<BaseSchemaCccTypeInfo>;
  graphql: {
    isEnabled: {
      read: boolean;
      create: boolean;
      update: boolean;
      filter: boolean | ((args: FilterOrderArgs<BaseSchemaCccTypeInfo>) => MaybePromise<boolean>);
      orderBy: boolean | ((args: FilterOrderArgs<BaseSchemaCccTypeInfo>) => MaybePromise<boolean>);
    };
    cacheHint: CacheHint | undefined;
  };
};

export type InitialisedSchemaCcc = {
  fields: Record<string, InitialisedField>;
  /** This will include the opposites to one-sided relationships */
  resolvedDbFields: Record<string, ResolvedDBField>;
  pluralGraphQLName: string;
  types: GraphQLTypesForSchemaCcc;
  access: ResolvedSchemaCccAccessControl;
  hooks: SchemaCccHooks<BaseSchemaCccTypeInfo>;
  adminUILabels: { label: string; singular: string; plural: string; path: string };
  cacheHint: ((args: CacheHintArgs) => CacheHint) | undefined;
  maxResults: number;
  schemaCccKey: string;
  schemaPpp: Record<string, InitialisedSchemaCcc>;
  dbMap: string | undefined;
  graphql: {
    isEnabled: IsEnabled;
  };
};

type IsEnabled = {
  type: boolean;
  query: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  filter: boolean | ((args: FilterOrderArgs<BaseSchemaCccTypeInfo>) => MaybePromise<boolean>);
  orderBy: boolean | ((args: FilterOrderArgs<BaseSchemaCccTypeInfo>) => MaybePromise<boolean>);
};

function throwIfNotAFilter(x: unknown, schemaCccKey: string, fieldKey: string) {
  if (['boolean', 'undefined', 'function'].includes(typeof x)) return;

  throw new Error(
    `Configuration option '${schemaCccKey}.${fieldKey}' must be either a boolean value or a function. Received '${x}'.`
  );
}

function getIsEnabled(schemaPppConfig: KeystoneConfig['schemaPpp']) {
  const isEnabled: Record<string, IsEnabled> = {};

  for (const [schemaCccKey, schemaCccConfig] of Object.entries(schemaPppConfig)) {
    const omit = schemaCccConfig.graphql?.omit;
    const { defaultIsFilterable, defaultIsOrderable } = schemaCccConfig;
    if (!omit) {
      // We explicity check for boolean/function values here to ensure the dev hasn't made a mistake
      // when defining these values. We avoid duck-typing here as this is security related
      // and we want to make it hard to write incorrect code.
      throwIfNotAFilter(defaultIsFilterable, schemaCccKey, 'defaultIsFilterable');
      throwIfNotAFilter(defaultIsOrderable, schemaCccKey, 'defaultIsOrderable');
    }
    if (omit === true) {
      isEnabled[schemaCccKey] = {
        type: false,
        query: false,
        create: false,
        update: false,
        delete: false,
        filter: false,
        orderBy: false,
      };
    } else if (omit === undefined) {
      isEnabled[schemaCccKey] = {
        type: true,
        query: true,
        create: true,
        update: true,
        delete: true,
        filter: defaultIsFilterable ?? true,
        orderBy: defaultIsOrderable ?? true,
      };
    } else {
      isEnabled[schemaCccKey] = {
        type: true,
        query: !omit.includes('query'),
        create: !omit.includes('create'),
        update: !omit.includes('update'),
        delete: !omit.includes('delete'),
        filter: defaultIsFilterable ?? true,
        orderBy: defaultIsOrderable ?? true,
      };
    }
  }

  return isEnabled;
}

function getSchemaPppWithInitialisedFields(
  { storage: configStorage, schemaPpp: schemaPppConfig, db: { provider } }: KeystoneConfig,
  schemaPppGraphqlTypes: Record<string, SchemaCccGraphQLTypes>,
  intermediateSchemaPpp: Record<string, { graphql: { isEnabled: IsEnabled } }>
) {
  return Object.fromEntries(
    Object.entries(schemaPppConfig).map(([schemaCccKey, schemaCcc]) => [
      schemaCccKey,
      {
        fields: Object.fromEntries(
          Object.entries(schemaCcc.fields).map(([fieldKey, fieldFunc]) => {
            if (typeof fieldFunc !== 'function') {
              throw new Error(
                `The field at ${schemaCccKey}.${fieldKey} does not provide a function`
              );
            }
            const f = fieldFunc({
              fieldKey,
              schemaCccKey,
              schemaPpp: schemaPppGraphqlTypes,
              provider,
              getStorage: storage => configStorage?.[storage],
            });

            const omit = f.graphql?.omit;
            const read = omit !== true && !omit?.includes('read');

            // We explicity check for boolean values here to ensure the dev hasn't made a mistake
            // when defining these values. We avoid duck-typing here as this is security related
            // and we want to make it hard to write incorrect code.
            throwIfNotAFilter(f.isFilterable, schemaCccKey, 'isFilterable');
            throwIfNotAFilter(f.isOrderable, schemaCccKey, 'isOrderable');

            const _isEnabled = {
              read,
              update: omit !== true && !omit?.includes('update'),
              create: omit !== true && !omit?.includes('create'),
              // Filter and orderBy can be defaulted at the schema ccc level, otherwise they
              // default to `false` if no value was set at the schema ccc level.
              filter:
                read &&
                (f.isFilterable ?? intermediateSchemaPpp[schemaCccKey].graphql.isEnabled.filter),
              orderBy:
                read &&
                (f.isOrderable ?? intermediateSchemaPpp[schemaCccKey].graphql.isEnabled.orderBy),
            };
            const field = {
              ...f,
              access: parseFieldAccessControl(f.access),
              hooks: f.hooks ?? {},
              graphql: { cacheHint: f.graphql?.cacheHint, isEnabled: _isEnabled },
              input: { ...f.input },
            };

            return [fieldKey, field];
          })
        ),
        ...intermediateSchemaPpp[schemaCccKey],
        ...getNamesFromSchemaCcc(schemaCccKey, schemaCcc),
        hooks: schemaCcc.hooks,
        access: parseschemaCccAccessControl(schemaCcc.access),
        dbMap: schemaCcc.db?.map,
        types: schemaPppGraphqlTypes[schemaCccKey].types,
      },
    ])
  );
}

function getSchemaCccGraphqlTypes(
  schemaPppConfig: KeystoneConfig['schemaPpp'],
  schemaPpp: Record<string, InitialisedSchemaCcc>,
  intermediateSchemaPpp: Record<string, { graphql: { isEnabled: IsEnabled } }>
): Record<string, SchemaCccGraphQLTypes> {
  const graphQLTypes: Record<string, SchemaCccGraphQLTypes> = {};

  for (const [schemaCccKey, schemaCccConfig] of Object.entries(schemaPppConfig)) {
    const names = getGqlNames({
      schemaCccKey,
      pluralGraphQLName: getNamesFromSchemaCcc(schemaCccKey, schemaCccConfig).pluralGraphQLName,
    });

    const output = graphql.object<BaseItem>()({
      name: names.outputTypeName,
      fields: () => {
        const { fields } = schemaPpp[schemaCccKey];
        return {
          ...Object.fromEntries(
            Object.entries(fields).flatMap(([fieldPath, field]) => {
              if (
                !field.output ||
                !field.graphql.isEnabled.read ||
                (field.dbField.kind === 'relation' &&
                  !intermediateSchemaPpp[field.dbField.schemaCcc].graphql.isEnabled.query)
              ) {
                return [];
              }
              return [
                [fieldPath, field.output] as const,
                ...Object.entries(field.extraOutputFields || {}),
              ].map(([outputTypeFieldName, outputField]) => {
                return [
                  outputTypeFieldName,
                  outputTypeField(
                    outputField,
                    field.dbField,
                    field.graphql?.cacheHint,
                    field.access.read,
                    schemaCccKey,
                    fieldPath,
                    schemaPpp
                  ),
                ];
              });
            })
          ),
        };
      },
    });

    const uniqueWhere = graphql.inputObject({
      name: names.whereUniqueInputName,
      fields: () => {
        const { fields } = schemaPpp[schemaCccKey];
        return Object.fromEntries(
          Object.entries(fields).flatMap(([key, field]) => {
            if (
              !field.input?.uniqueWhere?.arg ||
              !field.graphql.isEnabled.read ||
              !field.graphql.isEnabled.filter
            ) {
              return [];
            }
            return [[key, field.input.uniqueWhere.arg]] as const;
          })
        );
      },
    });

    const where: GraphQLTypesForSchemaCcc['where'] = graphql.inputObject({
      name: names.whereInputName,
      fields: () => {
        const { fields } = schemaPpp[schemaCccKey];
        return Object.assign(
          {
            AND: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
            OR: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
            NOT: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
          },
          ...Object.entries(fields).map(
            ([fieldKey, field]) =>
              field.input?.where?.arg &&
              field.graphql.isEnabled.read &&
              field.graphql.isEnabled.filter && { [fieldKey]: field.input?.where?.arg }
          )
        );
      },
    });

    const create = graphql.inputObject({
      name: names.createInputName,
      fields: () => {
        const { fields } = schemaPpp[schemaCccKey];
        return Object.fromEntries(
          Object.entries(fields).flatMap(([key, field]) => {
            if (!field.input?.create?.arg || !field.graphql.isEnabled.create) return [];
            return [[key, field.input.create.arg]] as const;
          })
        );
      },
    });

    const update = graphql.inputObject({
      name: names.updateInputName,
      fields: () => {
        const { fields } = schemaPpp[schemaCccKey];
        return Object.fromEntries(
          Object.entries(fields).flatMap(([key, field]) => {
            if (!field.input?.update?.arg || !field.graphql.isEnabled.update) return [];
            return [[key, field.input.update.arg]] as const;
          })
        );
      },
    });

    const orderBy = graphql.inputObject({
      name: names.schemaCccOrderName,
      fields: () => {
        const { fields } = schemaPpp[schemaCccKey];
        return Object.fromEntries(
          Object.entries(fields).flatMap(([key, field]) => {
            if (
              !field.input?.orderBy?.arg ||
              !field.graphql.isEnabled.read ||
              !field.graphql.isEnabled.orderBy
            ) {
              return [];
            }
            return [[key, field.input.orderBy.arg]] as const;
          })
        );
      },
    });

    const findManyArgs: FindManyArgs = {
      where: graphql.arg({ type: graphql.nonNull(where), defaultValue: {} }),
      orderBy: graphql.arg({
        type: graphql.nonNull(graphql.list(graphql.nonNull(orderBy))),
        defaultValue: [],
      }),
      // TODO: non-nullable when max results is specified in the schema ccc with the default of max results
      take: graphql.arg({ type: graphql.Int }),
      skip: graphql.arg({ type: graphql.nonNull(graphql.Int), defaultValue: 0 }),
    };

    const isEnabled = intermediateSchemaPpp[schemaCccKey].graphql.isEnabled;
    let relateToManyForCreate, relateToManyForUpdate, relateToOneForCreate, relateToOneForUpdate;
    if (isEnabled.type) {
      relateToManyForCreate = graphql.inputObject({
        name: names.relateToManyForCreateInputName,
        fields: () => {
          return {
            // Create via a relationship is only supported if this schema ccc allows create
            ...(isEnabled.create && {
              create: graphql.arg({ type: graphql.list(graphql.nonNull(create)) }),
            }),
            connect: graphql.arg({ type: graphql.list(graphql.nonNull(uniqueWhere)) }),
          };
        },
      });

      relateToManyForUpdate = graphql.inputObject({
        name: names.relateToManyForUpdateInputName,
        fields: () => {
          return {
            // The order of these fields reflects the order in which they are applied
            // in the mutation.
            disconnect: graphql.arg({ type: graphql.list(graphql.nonNull(uniqueWhere)) }),
            set: graphql.arg({ type: graphql.list(graphql.nonNull(uniqueWhere)) }),
            // Create via a relationship is only supported if this schema ccc allows create
            ...(isEnabled.create && {
              create: graphql.arg({ type: graphql.list(graphql.nonNull(create)) }),
            }),
            connect: graphql.arg({ type: graphql.list(graphql.nonNull(uniqueWhere)) }),
          };
        },
      });

      relateToOneForCreate = graphql.inputObject({
        name: names.relateToOneForCreateInputName,
        fields: () => {
          return {
            // Create via a relationship is only supported if this schema ccc allows create
            ...(isEnabled.create && { create: graphql.arg({ type: create }) }),
            connect: graphql.arg({ type: uniqueWhere }),
          };
        },
      });

      relateToOneForUpdate = graphql.inputObject({
        name: names.relateToOneForUpdateInputName,
        fields: () => {
          return {
            // Create via a relationship is only supported if this schema ccc allows create
            ...(isEnabled.create && { create: graphql.arg({ type: create }) }),
            connect: graphql.arg({ type: uniqueWhere }),
            disconnect: graphql.arg({ type: graphql.Boolean }),
          };
        },
      });
    }

    graphQLTypes[schemaCccKey] = {
      types: {
        output,
        uniqueWhere,
        where,
        create,
        orderBy,
        update,
        findManyArgs,
        relateTo: {
          many: {
            where: graphql.inputObject({
              name: `${schemaCccKey}ManyRelationFilter`,
              fields: {
                every: graphql.arg({ type: where }),
                some: graphql.arg({ type: where }),
                none: graphql.arg({ type: where }),
              },
            }),
            create: relateToManyForCreate,
            update: relateToManyForUpdate,
          },
          one: { create: relateToOneForCreate, update: relateToOneForUpdate },
        },
      },
    };
  }

  return graphQLTypes;
}

/**
 * 1. Get the `isEnabled` config object from the schemaCccConfig - the returned object will be modified later
 * 2. Instantiate `schemaPpp` object - it is done here as the object will be added to the schemaCccGraphqlTypes
 * 3. Get graphqlTypes
 * 4. Initialise fields - field functions are called
 * 5. Handle relationships - ensure correct linking between two sides of all relationships (including one-sided relationships)
 * 6.
 */
export function initialiseSchemaPpp(config: KeystoneConfig): Record<string, InitialisedSchemaCcc> {
  const schemaPppConfig = config.schemaPpp;

  let intermediateSchemaPpp;
  intermediateSchemaPpp = Object.fromEntries(
    Object.entries(getIsEnabled(schemaPppConfig)).map(([key, isEnabled]) => [
      key,
      { graphql: { isEnabled } },
    ])
  );

  /**
   * Schema Ppp is instantiated here so that it can be passed into the `getSchemaCccGraphqlTypes` function
   * This function attaches this schema ccc object to the various graphql functions
   *
   * The object will be populated at the end of this function, and the reference will be maintained
   */
  const schemaPppRef: Record<string, InitialisedSchemaCcc> = {};

  {
    const schemaCccGraphqlTypes = getSchemaCccGraphqlTypes(
      schemaPppConfig,
      schemaPppRef,
      intermediateSchemaPpp
    );
    intermediateSchemaPpp = getSchemaPppWithInitialisedFields(
      config,
      schemaCccGraphqlTypes,
      intermediateSchemaPpp
    );
  }

  {
    const resolvedDBFieldsForSchemaCcc = resolveRelationships(intermediateSchemaPpp);
    intermediateSchemaPpp = Object.fromEntries(
      Object.entries(intermediateSchemaPpp).map(([schemaCccKey, schemaCcc]) => [
        schemaCccKey,
        { ...schemaCcc, resolvedDbFields: resolvedDBFieldsForSchemaCcc[schemaCccKey] },
      ])
    );
  }

  intermediateSchemaPpp = Object.fromEntries(
    Object.entries(intermediateSchemaPpp).map(([schemaCccKey, schemaCcc]) => {
      const fields: Record<string, InitialisedField> = Object.fromEntries(
        Object.entries(schemaCcc.fields).map(([fieldKey, field]) => [
          fieldKey,
          { ...field, dbField: schemaCcc.resolvedDbFields[fieldKey] },
        ])
      );
      return [schemaCccKey, { ...schemaCcc, fields }];
    })
  );

  for (const schemaCcc of Object.values(intermediateSchemaPpp)) {
    let hasAnEnabledCreateField = false;
    let hasAnEnabledUpdateField = false;

    for (const field of Object.values(schemaCcc.fields)) {
      if (field.input?.create?.arg && field.graphql.isEnabled.create) {
        hasAnEnabledCreateField = true;
      }
      if (field.input?.update && field.graphql.isEnabled.update) {
        hasAnEnabledUpdateField = true;
      }
    }
    // You can't have a graphQL type with no fields, so
    // if they're all disabled, we have to disable the whole operation.
    if (!hasAnEnabledCreateField) {
      schemaCcc.graphql.isEnabled.create = false;
    }
    if (!hasAnEnabledUpdateField) {
      schemaCcc.graphql.isEnabled.update = false;
    }
  }

  /*
    Error checking
    */
  for (const [schemaCccKey, { fields }] of Object.entries(intermediateSchemaPpp)) {
    assertFieldsValid({ schemaCccKey, fields });
  }

  for (const [schemaCccKey, intermediateSchemaCcc] of Object.entries(intermediateSchemaPpp)) {
    schemaPppRef[schemaCccKey] = {
      ...intermediateSchemaCcc,
      /** These properties weren't related to any of the above actions but need to be here */
      hooks: intermediateSchemaCcc.hooks || {},
      cacheHint: (() => {
        const cacheHint = schemaPppConfig[schemaCccKey].graphql?.cacheHint;
        if (cacheHint === undefined) {
          return undefined;
        }
        return typeof cacheHint === 'function' ? cacheHint : () => cacheHint;
      })(),
      maxResults: schemaPppConfig[schemaCccKey].graphql?.queryLimits?.maxResults ?? Infinity,
      schemaCccKey: schemaCccKey,
      /** Add self-reference */
      schemaPpp: schemaPppRef,
    };
  }

  return schemaPppRef;
}
