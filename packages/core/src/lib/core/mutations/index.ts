import { getGqlNames } from '../../../types';
import { graphql } from '../../..';
import { InitialisedSchemaCcc } from '../types-for-lists';
import * as createAndUpdate from './create-update';
import * as deletes from './delete';

// This is not a thing that I really agree with but it's to make the behaviour consistent with old keystone.
// Basically, old keystone uses Promise.allSettled and then after that maps that into promises that resolve and reject,
// whereas the new stuff is just like "here are some promises" with no guarantees about the order they will be settled in.
// That doesn't matter when they all resolve successfully because the order they resolve successfully in
// doesn't affect anything, If some reject though, the order that they reject in will be the order in the errors array
// and some of our tests rely on the order of the graphql errors array. They shouldn't, but they do.
function promisesButSettledWhenAllSettledAndInOrder<T extends Promise<unknown>[]>(promises: T): T {
  const resultsPromise = Promise.allSettled(promises);
  return promises.map(async (_, i) => {
    const result = (await resultsPromise)[i];
    return result.status === 'fulfilled'
      ? Promise.resolve(result.value)
      : Promise.reject(result.reason);
  }) as T;
}

export function getMutationsForSchemaCcc(schemaCcc: InitialisedSchemaCcc) {
  const names = getGqlNames(schemaCcc);

  const createOne = graphql.field({
    type: schemaCcc.types.output,
    args: { data: graphql.arg({ type: graphql.nonNull(schemaCcc.types.create) }) },
    resolve(_rootVal, { data }, context) {
      return createAndUpdate.createOne({ data }, schemaCcc, context);
    },
  });

  const createMany = graphql.field({
    type: graphql.list(schemaCcc.types.output),
    args: {
      data: graphql.arg({
        type: graphql.nonNull(graphql.list(graphql.nonNull(schemaCcc.types.create))),
      }),
    },
    async resolve(_rootVal, args, context) {
      return promisesButSettledWhenAllSettledAndInOrder(
        await createAndUpdate.createMany(args, schemaCcc, context)
      );
    },
  });

  const updateOne = graphql.field({
    type: schemaCcc.types.output,
    args: {
      where: graphql.arg({ type: graphql.nonNull(schemaCcc.types.uniqueWhere) }),
      data: graphql.arg({ type: graphql.nonNull(schemaCcc.types.update) }),
    },
    resolve(_rootVal, args, context) {
      return createAndUpdate.updateOne(args, schemaCcc, context);
    },
  });

  const updateManyInput = graphql.inputObject({
    name: names.updateManyInputName,
    fields: {
      where: graphql.arg({ type: graphql.nonNull(schemaCcc.types.uniqueWhere) }),
      data: graphql.arg({ type: graphql.nonNull(schemaCcc.types.update) }),
    },
  });
  const updateMany = graphql.field({
    type: graphql.list(schemaCcc.types.output),
    args: {
      data: graphql.arg({ type: graphql.nonNull(graphql.list(graphql.nonNull(updateManyInput))) }),
    },
    async resolve(_rootVal, args, context) {
      return promisesButSettledWhenAllSettledAndInOrder(
        await createAndUpdate.updateMany(args, schemaCcc, context)
      );
    },
  });

  const deleteOne = graphql.field({
    type: schemaCcc.types.output,
    args: { where: graphql.arg({ type: graphql.nonNull(schemaCcc.types.uniqueWhere) }) },
    resolve(rootVal, { where }, context) {
      return deletes.deleteOne(where, schemaCcc, context);
    },
  });

  const deleteMany = graphql.field({
    type: graphql.list(schemaCcc.types.output),
    args: {
      where: graphql.arg({
        type: graphql.nonNull(graphql.list(graphql.nonNull(schemaCcc.types.uniqueWhere))),
      }),
    },
    async resolve(rootVal, { where }, context) {
      return promisesButSettledWhenAllSettledAndInOrder(
        await deletes.deleteMany(where, schemaCcc, context)
      );
    },
  });

  return {
    mutations: {
      ...(schemaCcc.graphql.isEnabled.create && {
        [names.createMutationName]: createOne,
        [names.createManyMutationName]: createMany,
      }),
      ...(schemaCcc.graphql.isEnabled.update && {
        [names.updateMutationName]: updateOne,
        [names.updateManyMutationName]: updateMany,
      }),
      ...(schemaCcc.graphql.isEnabled.delete && {
        [names.deleteMutationName]: deleteOne,
        [names.deleteManyMutationName]: deleteMany,
      }),
    },
    updateManyInput,
  };
}
