import { KeystoneContext } from './context';
import { BaseItem } from './next-fields';

type GraphQLInput = Record<string, any>;

export type BaseSchemaTypeTypeInfo = {
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

export type KeystoneContextFromSchemaTypeTypeInfo<
  SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo
> = KeystoneContext<SchemaTypeTypeInfo['all']>;

export type BaseKeystoneTypeInfo = { lists: Record<string, BaseSchemaTypeTypeInfo>; prisma: any };
