import { getGqlNames } from '../../../types';
import { graphql } from '../../..';
import { InitialisedSchemaCcc } from '../types-for-lists';
import * as queries from './resolvers';

export function getQueriesForSchemaCcc(schemaCcc: InitialisedSchemaCcc) {
  if (!schemaCcc.graphql.isEnabled.query) return {};
  const names = getGqlNames(schemaCcc);

  const findOne = graphql.field({
    type: schemaCcc.types.output,
    args: { where: graphql.arg({ type: graphql.nonNull(schemaCcc.types.uniqueWhere) }) },
    async resolve(_rootVal, args, context) {
      return queries.findOne(args, schemaCcc, context);
    },
  });

  const findMany = graphql.field({
    type: graphql.list(graphql.nonNull(schemaCcc.types.output)),
    args: schemaCcc.types.findManyArgs,
    async resolve(_rootVal, args, context, info) {
      return queries.findMany(args, schemaCcc, context, info);
    },
  });

  const countQuery = graphql.field({
    type: graphql.Int,
    args: {
      where: graphql.arg({ type: graphql.nonNull(schemaCcc.types.where), defaultValue: {} }),
    },
    async resolve(_rootVal, args, context, info) {
      return queries.count(args, schemaCcc, context, info);
    },
  });

  return {
    [names.schemaCccQueryName]: findMany,
    [names.itemQueryName]: findOne,
    [names.schemaCccQueryCountName]: countQuery,
  };
}
