import { CacheHint } from 'apollo-server-types';
import { FieldTypeFunc } from '../next-fields';
import { BaseSchemaTypeTypeInfo } from '../type-info';
import { KeystoneContextFromSchemaTypeTypeInfo, MaybePromise } from '..';
import { MaybeItemFunction, MaybeSessionFunction } from './lists';
import { FieldHooks } from './hooks';
import { FieldAccessControl } from './access-control';

export type BaseFields<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = {
  [key: string]: FieldTypeFunc<SchemaTypeTypeInfo>;
};

export type FilterOrderArgs<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = {
  context: KeystoneContextFromSchemaTypeTypeInfo<SchemaTypeTypeInfo>;
  session: KeystoneContextFromSchemaTypeTypeInfo<SchemaTypeTypeInfo>['session'];
  listKey: string;
  fieldKey: string;
};
export type CommonFieldConfig<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = {
  access?: FieldAccessControl<SchemaTypeTypeInfo>;
  hooks?: FieldHooks<SchemaTypeTypeInfo>;
  label?: string;
  ui?: {
    description?: string;
    views?: string;
    createView?: { fieldMode?: MaybeSessionFunction<'edit' | 'hidden', SchemaTypeTypeInfo> };
    itemView?: { fieldMode?: MaybeItemFunction<'edit' | 'read' | 'hidden', SchemaTypeTypeInfo> };
    listView?: { fieldMode?: MaybeSessionFunction<'read' | 'hidden', SchemaTypeTypeInfo> };
  };
  graphql?: {
    cacheHint?: CacheHint;
    // Setting any of these values will remove the corresponding input/output types from the GraphQL schema.
    // Output Types
    //   'read': Does this field exist on the Item type? Will also disable filtering/ordering/admimMeta
    // Input Types
    //   'create': Does this field exist in the create Input type?
    //   'update': Does this field exist in the update Input type?
    //
    // If `true` then the field will be completely removed from all types.
    //
    // Default: undefined
    omit?: true | readonly ('read' | 'create' | 'update')[];
  };
  // Disabled by default...
  isFilterable?: boolean | ((args: FilterOrderArgs<SchemaTypeTypeInfo>) => MaybePromise<boolean>);
  isOrderable?: boolean | ((args: FilterOrderArgs<SchemaTypeTypeInfo>) => MaybePromise<boolean>);
};
