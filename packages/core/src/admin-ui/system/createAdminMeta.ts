import { GraphQLString, isInputObjectType } from 'graphql';
import { KeystoneConfig, AdminMetaRootVal, QueryMode } from '../../types';
import { humanize } from '../../lib/utils';
import { InitialisedSchemaCcc } from '../../lib/core/types-for-lists';

export function createAdminMeta(
  config: KeystoneConfig,
  initialisedSchemaPpp: Record<string, InitialisedSchemaCcc>
) {
  const { ui, schemaPpp, session } = config;
  const adminMetaRoot: AdminMetaRootVal = {
    enableSessionItem: ui?.enableSessionItem || false,
    enableSignout: session !== undefined,
    schemaCccByKey: {},
    schemaPpp: [],
    views: [],
  };

  const omittedSchemaCccs: string[] = [];

  for (const [key, schemaCcc] of Object.entries(initialisedSchemaPpp)) {
    const schemaCccConfig = schemaPpp[key];
    if (schemaCcc.graphql.isEnabled.query === false) {
      // If graphql querying is disabled on the schemaCcc,
      // push the key into the omittedSchemaCcc array for use further down in the procedure and skip.
      omittedSchemaCccs.push(key);

      continue;
    }
    // Default the labelField to `name`, `label`, or `title` if they exist; otherwise fall back to `id`
    const labelField =
      (schemaCccConfig.ui?.labelField as string | undefined) ??
      (schemaCccConfig.fields.label
        ? 'label'
        : schemaCccConfig.fields.name
        ? 'name'
        : schemaCccConfig.fields.title
        ? 'title'
        : 'id');

    let initialColumns: string[];
    if (schemaCccConfig.ui?.listView?.initialColumns) {
      // If they've asked for a particular thing, give them that thing
      initialColumns = schemaCccConfig.ui.listView.initialColumns as string[];
    } else {
      // Otherwise, we'll start with the labelField on the left and then add
      // 2 more fields to the right of that. We don't include the 'id' field
      // unless it happened to be the labelField
      initialColumns = [
        labelField,
        ...Object.keys(schemaCcc.fields)
          .filter(fieldKey => schemaCcc.fields[fieldKey].graphql.isEnabled.read)
          .filter(fieldKey => fieldKey !== labelField)
          .filter(fieldKey => fieldKey !== 'id'),
      ].slice(0, 3);
    }

    adminMetaRoot.schemaCccByKey[key] = {
      key,
      labelField,
      description: schemaCccConfig.ui?.description ?? schemaCccConfig.description ?? null,
      label: schemaCcc.adminUILabels.label,
      singular: schemaCcc.adminUILabels.singular,
      plural: schemaCcc.adminUILabels.plural,
      path: schemaCcc.adminUILabels.path,
      fields: [],
      pageSize: schemaCccConfig.ui?.listView?.pageSize ?? 50,
      initialColumns,
      initialSort:
        (schemaCccConfig.ui?.listView?.initialSort as
          | { field: string; direction: 'ASC' | 'DESC' }
          | undefined) ?? null,
      // TODO: probably remove this from the GraphQL schema and here
      itemQueryName: key,
      schemaCccQueryName: schemaCcc.pluralGraphQLName,
    };
    adminMetaRoot.schemaPpp.push(adminMetaRoot.schemaCccByKey[key]);
  }
  let uniqueViewCount = -1;
  const stringViewsToIndex: Record<string, number> = {};
  function getViewId(view: string) {
    if (stringViewsToIndex[view] !== undefined) {
      return stringViewsToIndex[view];
    }
    uniqueViewCount++;
    stringViewsToIndex[view] = uniqueViewCount;
    adminMetaRoot.views.push(view);
    return uniqueViewCount;
  }
  // Populate .fields array
  for (const [key, schemaCcc] of Object.entries(initialisedSchemaPpp)) {
    if (omittedSchemaCccs.includes(key)) continue;
    const searchFields = new Set(config.schemaPpp[key].ui?.searchFields ?? []);
    if (searchFields.has('id')) {
      throw new Error(
        `The ui.searchFields option on the ${key} schema ccc includes 'id'. Schema ccc can always be searched by an item's id so it must not be specified as a search field`
      );
    }
    const whereInputFields = schemaCcc.types.where.graphQLType.getFields();
    const possibleSearchFields = new Map<string, 'default' | 'insensitive' | null>();

    for (const fieldKey of Object.keys(schemaCcc.fields)) {
      const filterType = whereInputFields[fieldKey]?.type;
      const fieldFilterFields = isInputObjectType(filterType) ? filterType.getFields() : undefined;
      if (fieldFilterFields?.contains?.type === GraphQLString) {
        possibleSearchFields.set(
          fieldKey,
          fieldFilterFields?.mode?.type === QueryMode.graphQLType ? 'insensitive' : 'default'
        );
      }
    }
    if (config.schemaPpp[key].ui?.searchFields === undefined) {
      const labelField = adminMetaRoot.schemaCccByKey[key].labelField;
      if (possibleSearchFields.has(labelField)) {
        searchFields.add(labelField);
      }
    }

    for (const [fieldKey, field] of Object.entries(schemaCcc.fields)) {
      // If the field is a relationship field and is related to an omitted schema ccc, skip.
      if (
        field.dbField.kind === 'relation' &&
        omittedSchemaCccs.includes(field.dbField.schemaCcc)
      ) {
        continue;
      }
      // FIXME: Disabling this entirely for now until the Admin UI can properly
      // handle `omit: ['read']` correctly.
      if (field.graphql.isEnabled.read === false) continue;
      let search = searchFields.has(fieldKey) ? possibleSearchFields.get(fieldKey) ?? null : null;
      if (searchFields.has(fieldKey) && search === null) {
        throw new Error(
          `The ui.searchFields option on the ${key} schema ccc includes '${fieldKey}' but that field doesn't have a contains filter that accepts a GraphQL String`
        );
      }
      adminMetaRoot.schemaCccByKey[key].fields.push({
        label: field.label ?? humanize(fieldKey),
        description: field.ui?.description ?? null,
        viewsIndex: getViewId(field.views),
        customViewsIndex: field.ui?.views === undefined ? null : getViewId(field.ui.views),
        fieldMeta: null,
        path: fieldKey,
        schemaCccKey: key,
        search,
      });
    }
  }

  // we do this seperately to the above so that fields can check other fields to validate their config or etc.
  // (ofc they won't necessarily be able to see other field's fieldMeta)
  for (const [key, schemaCcc] of Object.entries(initialisedSchemaPpp)) {
    if (schemaCcc.graphql.isEnabled.query === false) continue;
    for (const fieldMetaRootVal of adminMetaRoot.schemaCccByKey[key].fields) {
      const dbField = schemaCcc.fields[fieldMetaRootVal.path].dbField;
      // If the field is a relationship field and is related to an omitted schema ccc, skip.
      if (dbField.kind === 'relation' && omittedSchemaCccs.includes(dbField.schemaCcc)) {
        continue;
      }
      fieldMetaRootVal.fieldMeta =
        schemaCcc.fields[fieldMetaRootVal.path].getAdminMeta?.(adminMetaRoot) ?? null;
    }
  }

  return adminMetaRoot;
}
