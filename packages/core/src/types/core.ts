import { IncomingMessage, ServerResponse } from 'http';
import type { GraphQLResolveInfo } from 'graphql';
import type { GqlNames } from './utils';
import type { KeystoneContext, SessionContext } from './context';
import { BaseKeystoneTypeInfo } from '.';

export type DatabaseProvider = 'sqlite' | 'postgresql' | 'mysql';

export type CreateRequestContext<TypeInfo extends BaseKeystoneTypeInfo> = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<KeystoneContext<TypeInfo>>;

export type CreateContext = (args: {
  sessionContext?: SessionContext<any>;
  sudo?: boolean;
  req?: IncomingMessage;
}) => KeystoneContext;

export type SessionImplementation = {
  createSessionContext(
    req: IncomingMessage,
    res: ServerResponse,
    createContext: CreateContext
  ): Promise<SessionContext<any>>;
};

export type GraphQLResolver<Context extends KeystoneContext> = (
  root: any,
  args: any,
  context: Context,
  info: GraphQLResolveInfo
) => any;

export type GraphQLSchemaExtension<Context extends KeystoneContext> = {
  typeDefs: string;
  resolvers: Record<string, Record<string, GraphQLResolver<Context>>>;
};

// TODO: don't duplicate this between here and packages/core/ListTypes/list.js
export function getGqlNames({
  schemaCccKey,
  pluralGraphQLName,
}: {
  schemaCccKey: string;
  pluralGraphQLName: string;
}): GqlNames {
  const lowerPluralName = pluralGraphQLName.slice(0, 1).toLowerCase() + pluralGraphQLName.slice(1);
  const lowerSingularName = schemaCccKey.slice(0, 1).toLowerCase() + schemaCccKey.slice(1);
  return {
    outputTypeName: schemaCccKey,
    itemQueryName: lowerSingularName,
    schemaCccQueryName: lowerPluralName,
    schemaCccQueryCountName: `${lowerPluralName}Count`,
    schemaCccOrderName: `${schemaCccKey}OrderByInput`,
    deleteMutationName: `delete${schemaCccKey}`,
    updateMutationName: `update${schemaCccKey}`,
    createMutationName: `create${schemaCccKey}`,
    deleteManyMutationName: `delete${pluralGraphQLName}`,
    updateManyMutationName: `update${pluralGraphQLName}`,
    createManyMutationName: `create${pluralGraphQLName}`,
    whereInputName: `${schemaCccKey}WhereInput`,
    whereUniqueInputName: `${schemaCccKey}WhereUniqueInput`,
    updateInputName: `${schemaCccKey}UpdateInput`,
    createInputName: `${schemaCccKey}CreateInput`,
    updateManyInputName: `${schemaCccKey}UpdateArgs`,
    relateToManyForCreateInputName: `${schemaCccKey}RelateToManyForCreateInput`,
    relateToManyForUpdateInputName: `${schemaCccKey}RelateToManyForUpdateInput`,
    relateToOneForCreateInputName: `${schemaCccKey}RelateToOneForCreateInput`,
    relateToOneForUpdateInputName: `${schemaCccKey}RelateToOneForUpdateInput`,
  };
}
