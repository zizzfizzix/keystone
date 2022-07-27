import { KeystoneContext } from './context';
import { BaseItem } from './next-fields';

type GraphQLInput = Record<string, any>;

export type BaseSingletonTypeInfo = {
  kind: 'singleton';
  key: string;
  fields: string;
  item: BaseItem;
  inputs: {
    create: never; // this is complicated, but it shouldn't exist
    update: GraphQLInput;
  };
  all: BaseKeystoneTypeInfo;
};

export type BaseListTypeInfo = {
  kind: 'list';
  key: string;
  fields: string;
  item: BaseItem;
  inputs: {
    create: GraphQLInput;
    update: GraphQLInput;
    where: GraphQLInput;
    uniqueWhere: { readonly id?: string | null } & GraphQLInput;
    orderBy: Record<string, 'asc' | 'desc' | null>;
  };
  all: BaseKeystoneTypeInfo;
};

export type BaseSchemaTypeInfo = BaseSingletonTypeInfo | BaseListTypeInfo;

export type KeystoneContextFromListTypeInfo<SchemaTypeInfo extends BaseSchemaTypeInfo> =
  KeystoneContext<SchemaTypeInfo['all']>;

export type BaseKeystoneTypeInfo = {
  lists: Record<string, BaseListTypeInfo | BaseSingletonTypeInfo>;
  prisma: any;
};
