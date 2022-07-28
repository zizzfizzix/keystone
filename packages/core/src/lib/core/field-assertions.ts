import { graphql } from '../..';
import { InitialisedField } from './types-for-lists';

export type SchemaCccForValidation = {
  schemaCccKey: string;
  fields: Record<string, InitialisedField>;
};

export function assertFieldsValid(schemaCcc: SchemaCccForValidation) {
  assertNoConflictingExtraOutputFields(schemaCcc);
  assertIdFieldGraphQLTypesCorrect(schemaCcc);
  assertNoFieldKeysThatConflictWithFilterCombinators(schemaCcc);
  assertUniqueWhereInputsValid(schemaCcc);
}

function assertUniqueWhereInputsValid(schemaCcc: SchemaCccForValidation) {
  for (const [fieldKey, { dbField, input }] of Object.entries(schemaCcc.fields)) {
    if (input?.uniqueWhere) {
      if (dbField.kind !== 'scalar' && dbField.kind !== 'enum') {
        throw new Error(
          `Only scalar db fields can provide a uniqueWhere input currently but the field at ${schemaCcc.schemaCccKey}.${fieldKey} specifies a uniqueWhere input`
        );
      }

      if (dbField.index !== 'unique' && fieldKey !== 'id') {
        throw new Error(
          `Fields must have a unique index or be the idField to specify a uniqueWhere input but the field at ${schemaCcc.schemaCccKey}.${fieldKey} specifies a uniqueWhere input without a unique index`
        );
      }
    }
  }
}

function assertNoFieldKeysThatConflictWithFilterCombinators(schemaCcc: SchemaCccForValidation) {
  for (const fieldKey of Object.keys(schemaCcc.fields)) {
    if (fieldKey === 'AND' || fieldKey === 'OR' || fieldKey === 'NOT') {
      throw new Error(
        `Fields cannot be named ${fieldKey} but there is a field named ${fieldKey} on ${schemaCcc.schemaCccKey}`
      );
    }
  }
}

function assertNoConflictingExtraOutputFields(schemaCcc: SchemaCccForValidation) {
  const fieldKeys = new Set(Object.keys(schemaCcc.fields));
  const alreadyFoundFields: Record<string, string> = {};
  for (const [fieldKey, field] of Object.entries(schemaCcc.fields)) {
    if (field.extraOutputFields) {
      for (const outputTypeFieldName of Object.keys(field.extraOutputFields)) {
        // note that this and the case handled below are fundamentally the same thing but i want different errors for each of them
        if (fieldKeys.has(outputTypeFieldName)) {
          throw new Error(
            `The field ${fieldKey} on the ${schemaCcc.schemaCccKey} schema ccc defines an extra GraphQL output field named ${outputTypeFieldName} which conflicts with the Keystone field type named ${outputTypeFieldName} on the same schema ccc`
          );
        }
        const alreadyFoundField = alreadyFoundFields[outputTypeFieldName];
        if (alreadyFoundField !== undefined) {
          throw new Error(
            `The field ${fieldKey} on the ${schemaCcc.schemaCccKey} schema ccc defines an extra GraphQL output field named ${outputTypeFieldName} which conflicts with the Keystone field type named ${alreadyFoundField} which also defines an extra GraphQL output field named ${outputTypeFieldName}`
          );
        }
        alreadyFoundFields[outputTypeFieldName] = fieldKey;
      }
    }
  }
}

function assertIdFieldGraphQLTypesCorrect(schemaCcc: SchemaCccForValidation) {
  const idField = schemaCcc.fields.id;
  if (idField.input?.uniqueWhere === undefined) {
    throw new Error(
      `The idField on a schema ccc must define a uniqueWhere GraphQL input with the ID GraphQL scalar type but the idField for ${schemaCcc.schemaCccKey} does not define one`
    );
  }
  if (idField.input.uniqueWhere.arg.type !== graphql.ID) {
    throw new Error(
      `The idField on a schema ccc must define a uniqueWhere GraphQL input with the ID GraphQL scalar type but the idField for ${
        schemaCcc.schemaCccKey
      } defines the type ${idField.input.uniqueWhere.arg.type.graphQLType.toString()}`
    );
  }
  // we may want to loosen these constraints in the future
  if (idField.input.create !== undefined) {
    throw new Error(
      `The idField on a schema ccc must not define a create GraphQL input but the idField for ${schemaCcc.schemaCccKey} does define one`
    );
  }
  if (idField.input.update !== undefined) {
    throw new Error(
      `The idField on a schema ccc must not define an update GraphQL input but the idField for ${schemaCcc.schemaCccKey} does define one`
    );
  }
  if (idField.graphql.isEnabled.read === false) {
    throw new Error(
      `The idField on a schema ccc must not have graphql.isEnabled.read be set to false but ${schemaCcc.schemaCccKey} does`
    );
  }
  if (idField.output.type.kind !== 'non-null' || idField.output.type.of !== graphql.ID) {
    throw new Error(
      `The idField on a schema ccc must define a GraphQL output field with a non-nullable ID GraphQL scalar type but the idField for ${
        schemaCcc.schemaCccKey
      } defines the type ${idField.output.type.graphQLType.toString()}`
    );
  }
}
