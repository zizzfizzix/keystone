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
  schemaTypeKey,
  pluralGraphQLName,
}: {
  schemaTypeKey: string;
  pluralGraphQLName: string;
}): GqlNames {
  const lowerPluralName = pluralGraphQLName.slice(0, 1).toLowerCase() + pluralGraphQLName.slice(1);
  const lowerSingularName = schemaTypeKey.slice(0, 1).toLowerCase() + schemaTypeKey.slice(1);
  return {
    outputTypeName: schemaTypeKey,
    itemQueryName: lowerSingularName,
    listQueryName: lowerPluralName,
    listQueryCountName: `${lowerPluralName}Count`,
    listOrderName: `${schemaTypeKey}OrderByInput`,
    deleteMutationName: `delete${schemaTypeKey}`,
    updateMutationName: `update${schemaTypeKey}`,
    createMutationName: `create${schemaTypeKey}`,
    deleteManyMutationName: `delete${pluralGraphQLName}`,
    updateManyMutationName: `update${pluralGraphQLName}`,
    createManyMutationName: `create${pluralGraphQLName}`,
    whereInputName: `${schemaTypeKey}WhereInput`,
    whereUniqueInputName: `${schemaTypeKey}WhereUniqueInput`,
    updateInputName: `${schemaTypeKey}UpdateInput`,
    createInputName: `${schemaTypeKey}CreateInput`,
    updateManyInputName: `${schemaTypeKey}UpdateArgs`,
    relateToManyForCreateInputName: `${schemaTypeKey}RelateToManyForCreateInput`,
    relateToManyForUpdateInputName: `${schemaTypeKey}RelateToManyForUpdateInput`,
    relateToOneForCreateInputName: `${schemaTypeKey}RelateToOneForCreateInput`,
    relateToOneForUpdateInputName: `${schemaTypeKey}RelateToOneForUpdateInput`,
  };
}
