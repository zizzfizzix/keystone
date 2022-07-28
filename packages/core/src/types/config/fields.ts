import { CacheHint } from 'apollo-server-types';
import { FieldTypeFunc } from '../next-fields';
import { BaseSchemaCccTypeInfo } from '../type-info';
import { KeystoneContextFromSchemaCccTypeInfo, MaybePromise } from '..';
import { MaybeItemFunction, MaybeSessionFunction } from './lists';
import { FieldHooks } from './hooks';
import { FieldAccessControl } from './access-control';

export type BaseFields<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = {
  [key: string]: FieldTypeFunc<SchemaCccTypeInfo>;
};

export type FilterOrderArgs<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = {
  context: KeystoneContextFromSchemaCccTypeInfo<SchemaCccTypeInfo>;
  session: KeystoneContextFromSchemaCccTypeInfo<SchemaCccTypeInfo>['session'];
  schemaCccKey: string;
  fieldKey: string;
};
export type CommonFieldConfig<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = {
  access?: FieldAccessControl<SchemaCccTypeInfo>;
  hooks?: FieldHooks<SchemaCccTypeInfo>;
  label?: string;
  ui?: {
    description?: string;
    views?: string;
    createView?: { fieldMode?: MaybeSessionFunction<'edit' | 'hidden', SchemaCccTypeInfo> };
    itemView?: { fieldMode?: MaybeItemFunction<'edit' | 'read' | 'hidden', SchemaCccTypeInfo> };
    listView?: { fieldMode?: MaybeSessionFunction<'read' | 'hidden', SchemaCccTypeInfo> };
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
  isFilterable?: boolean | ((args: FilterOrderArgs<SchemaCccTypeInfo>) => MaybePromise<boolean>);
  isOrderable?: boolean | ((args: FilterOrderArgs<SchemaCccTypeInfo>) => MaybePromise<boolean>);
};
