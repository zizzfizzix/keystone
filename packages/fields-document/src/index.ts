import path from 'path';
import { ApolloError } from 'apollo-server-errors';
import {
  BaseListTypeInfo,
  CommonFieldConfig,
  FieldTypeFunc,
  jsonFieldTypePolyfilledForSQLite,
  JSONValue,
} from '@keystone-6/core/types';
import { graphql } from '@keystone-6/core';
import { Relationships } from './DocumentEditor/relationship';
import { ComponentBlock } from './component-blocks';
import { validateAndNormalizeDocument } from './validation';
import { addRelationshipData } from './relationship-data';
import { FormattingConfig, normaliseDocumentFeatures } from './document-features';

type RelationshipsConfig = Record<
  string,
  {
    listKey: string;
    /** GraphQL fields to select when querying the field */
    selection?: string;
  } & (
    | {
        kind: 'inline';
        label: string;
      }
    | {
        kind: 'prop';
        many?: true;
      }
  )
>;

export type DocumentFieldConfig<ListTypeInfo extends BaseListTypeInfo> =
  CommonFieldConfig<ListTypeInfo> & {
    relationships?: RelationshipsConfig;
    componentBlocks?: Record<string, ComponentBlock>;
    formatting?: true | FormattingConfig;
    links?: true;
    dividers?: true;
    layouts?: readonly (readonly [number, ...number[]])[];
    db?: { map?: string };
  };

const views = path.join(path.dirname(__dirname), 'views');

export const document =
  <ListTypeInfo extends BaseListTypeInfo>({
    componentBlocks = {},
    dividers,
    formatting,
    layouts,
    relationships: configRelationships,
    links,
    ...config
  }: DocumentFieldConfig<ListTypeInfo> = {}): FieldTypeFunc<ListTypeInfo> =>
  meta => {
    const documentFeatures = normaliseDocumentFeatures({
      dividers,
      formatting,
      layouts,
      links,
    });
    const relationships = normaliseRelationships(configRelationships);

    const inputResolver = (data: JSONValue | null | undefined): any => {
      if (data === null) {
        throw new ApolloError('Input error: Document fields cannot be set to null');
      }
      if (data === undefined) {
        return data;
      }
      return validateAndNormalizeDocument(data, documentFeatures, componentBlocks, relationships);
    };

    if ((config as any).isIndexed === 'unique') {
      throw Error("isIndexed: 'unique' is not a supported option for field type document");
    }

    return jsonFieldTypePolyfilledForSQLite(
      meta.provider,
      {
        ...config,
        input: {
          create: {
            arg: graphql.arg({ type: graphql.JSON }),
            resolve(val) {
              if (val === undefined) {
                val = [{ type: 'paragraph', children: [{ text: '' }] }];
              }
              return inputResolver(val);
            },
          },
          update: { arg: graphql.arg({ type: graphql.JSON }), resolve: inputResolver },
        },
        output: graphql.field({
          type: graphql.object<{ document: JSONValue }>()({
            name: `${meta.listKey}_${meta.fieldKey}_Document`,
            fields: {
              document: graphql.field({
                args: {
                  hydrateRelationships: graphql.arg({
                    type: graphql.nonNull(graphql.Boolean),
                    defaultValue: false,
                  }),
                },
                type: graphql.nonNull(graphql.JSON),
                resolve({ document }, { hydrateRelationships }, context) {
                  return hydrateRelationships
                    ? addRelationshipData(
                        document as any,
                        context.graphql,
                        relationships,
                        componentBlocks,
                        context.gqlNames
                      )
                    : (document as any);
                },
              }),
            },
          }),
          resolve({ value }) {
            if (value === null) {
              return null;
            }
            return { document: value };
          },
        }),
        views,
        getAdminMeta(): Parameters<typeof import('./views').controller>[0]['fieldMeta'] {
          return {
            relationships,
            documentFeatures,
            componentBlocksPassedOnServer: Object.keys(componentBlocks),
          };
        },
      },
      {
        mode: 'required',
        default: {
          kind: 'literal',
          value: JSON.stringify([{ type: 'paragraph', children: [{ text: '' }] }]),
        },
        map: config.db?.map,
      }
    );
  };

function normaliseRelationships(
  configRelationships: DocumentFieldConfig<BaseListTypeInfo>['relationships']
) {
  const relationships: Relationships = {};
  if (configRelationships) {
    Object.keys(configRelationships).forEach(key => {
      const relationship = configRelationships[key];
      relationships[key] =
        relationship.kind === 'inline'
          ? { ...relationship, selection: relationship.selection ?? null }
          : {
              ...relationship,
              selection: relationship.selection ?? null,
              many: relationship.many || false,
            };
    });
  }
  return relationships;
}
