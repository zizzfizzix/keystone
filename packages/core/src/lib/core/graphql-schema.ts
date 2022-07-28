import { GraphQLNamedType, GraphQLSchema } from 'graphql';
import { graphql } from '../..';
import { InitialisedSchemaCcc } from './types-for-lists';

import { getMutationsForSchemaCcc } from './mutations';
import { getQueriesForSchemaCcc } from './queries';

export function getGraphQLSchema(
  schemaPpp: Record<string, InitialisedSchemaCcc>,
  extraFields: {
    mutation: Record<string, graphql.Field<unknown, any, graphql.OutputType, string>>;
    query: Record<string, graphql.Field<unknown, any, graphql.OutputType, string>>;
  }
) {
  const query = graphql.object()({
    name: 'Query',
    fields: Object.assign(
      {},
      ...Object.values(schemaPpp).map(schemaCcc => getQueriesForSchemaCcc(schemaCcc)),
      extraFields.query
    ),
  });

  const updateManyBySchemaCcc: Record<string, graphql.InputObjectType<any>> = {};

  const mutation = graphql.object()({
    name: 'Mutation',
    fields: Object.assign(
      {},
      ...Object.values(schemaPpp).map(schemaCcc => {
        const { mutations, updateManyInput } = getMutationsForSchemaCcc(schemaCcc);
        updateManyBySchemaCcc[schemaCcc.schemaCccKey] = updateManyInput;
        return mutations;
      }),
      extraFields.mutation
    ),
  });
  const graphQLSchema = new GraphQLSchema({
    query: query.graphQLType,
    mutation: mutation.graphQLType,
    // not about behaviour, only ordering
    types: [...collectTypes(schemaPpp, updateManyBySchemaCcc), mutation.graphQLType],
  });
  return graphQLSchema;
}

function collectTypes(
  schemaPpp: Record<string, InitialisedSchemaCcc>,
  updateManyBySchemaCcc: Record<string, graphql.InputObjectType<any>>
) {
  const collectedTypes: GraphQLNamedType[] = [];
  for (const schemaCcc of Object.values(schemaPpp)) {
    const { isEnabled } = schemaCcc.graphql;
    if (!isEnabled.type) continue;
    // adding all of these types explicitly isn't strictly necessary but we do it to create a certain order in the schema
    collectedTypes.push(schemaCcc.types.output.graphQLType);
    if (isEnabled.query || isEnabled.update || isEnabled.delete) {
      collectedTypes.push(schemaCcc.types.uniqueWhere.graphQLType);
    }
    if (isEnabled.query) {
      for (const field of Object.values(schemaCcc.fields)) {
        if (
          isEnabled.query &&
          field.graphql.isEnabled.read &&
          field.unreferencedConcreteInterfaceImplementations
        ) {
          // this _IS_ actually necessary since they aren't implicitly referenced by other types, unlike the types above
          collectedTypes.push(
            ...field.unreferencedConcreteInterfaceImplementations.map(x => x.graphQLType)
          );
        }
      }
      collectedTypes.push(schemaCcc.types.where.graphQLType);
      collectedTypes.push(schemaCcc.types.orderBy.graphQLType);
    }
    if (isEnabled.update) {
      collectedTypes.push(schemaCcc.types.update.graphQLType);
      collectedTypes.push(updateManyBySchemaCcc[schemaCcc.schemaCccKey].graphQLType);
    }
    if (isEnabled.create) {
      collectedTypes.push(schemaCcc.types.create.graphQLType);
    }
  }
  // this is not necessary, just about ordering
  collectedTypes.push(graphql.JSON.graphQLType);
  return collectedTypes;
}
