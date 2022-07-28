import type { CacheHint } from 'apollo-server-types';
import type { MaybePromise } from '../utils';
import { BaseSchemaCccTypeInfo } from '../type-info';
import { KeystoneContextFromSchemaCccTypeInfo } from '..';
import type { SchemaCccHooks } from './hooks';
import type { SchemaCccAccessControl } from './access-control';
import type { BaseFields, FilterOrderArgs } from './fields';

export type SchemaPppConfig = Record<
  string,
  SchemaCccConfig<any, BaseFields<BaseSchemaCccTypeInfo>>
>;

export type IdFieldConfig =
  | { kind: 'cuid' | 'uuid' }
  | {
      kind: 'autoincrement';
      /**
       * Configures the database type of the id field. Only `Int` is supported on SQLite.
       * @default 'Int'
       */
      type?: 'Int' | 'BigInt';
    };

export type SchemaCccConfig<
  SchemaCccTypeInfo extends BaseSchemaCccTypeInfo,
  Fields extends BaseFields<SchemaCccTypeInfo>
> = {
  /*
      A note on defaults: several options default based on the schemaCccKey, including label, path,
      singular, plural, itemQueryName and schemaCccQueryName. All these options default independently, so
      changing the singular or plural will not change the label or queryName options (and vice-versa)
      Note from Mitchell: The above is incorrect based on Keystone's current implementation.
    */
  fields: Fields;

  /**
   * Controls what data users of the Admin UI and GraphQL can access and change
   * @default true
   * @see https://www.keystonejs.com/guides/auth-and-access-control
   */
  access?: SchemaCccAccessControl<SchemaCccTypeInfo>;

  /** Config for how this schema ccc should act in the Admin UI */
  ui?: SchemaCccAdminUIConfig<SchemaCccTypeInfo, Fields>;

  /**
   * Hooks to modify the behaviour of GraphQL operations at certain points
   * @see https://www.keystonejs.com/guides/hooks
   */
  hooks?: SchemaCccHooks<SchemaCccTypeInfo>;

  graphql?: SchemaCccGraphQLConfig;

  db?: SchemaCccDBConfig;

  /**
   * Defaults the Admin UI and GraphQL descriptions
   */
  description?: string; // defaults both { adminUI: { description }, graphQL: { description } }

  // Defaults to apply to all fields.
  defaultIsFilterable?:
    | false
    | ((args: FilterOrderArgs<SchemaCccTypeInfo>) => MaybePromise<boolean>); // The default value to use for graphql.isEnabled.filter on all fields for this schema ccc
  defaultIsOrderable?:
    | false
    | ((args: FilterOrderArgs<SchemaCccTypeInfo>) => MaybePromise<boolean>); // The default value to use for graphql.isEnabled.orderBy on all fields for this schema ccc
};

export type SchemaCccAdminUIConfig<
  SchemaCccTypeInfo extends BaseSchemaCccTypeInfo,
  Fields extends BaseFields<SchemaCccTypeInfo>
> = {
  /**
   * The field to use as a label in the Admin UI. If you want to base the label off more than a single field, use a virtual field and reference that field here.
   * @default 'label', if it exists, falling back to 'name', then 'title', and finally 'id', which is guaranteed to exist.
   */
  labelField?: 'id' | keyof Fields;
  /**
   * The fields used by the Admin UI when searching this schema ccc.
   * It is always possible to search by id and `id` should not be specified in this option.
   * @default The `labelField` if it has a string `contains` filter, otherwise none.
   */
  searchFields?: readonly Extract<keyof Fields, string>[];

  /** The path that the schema ccc should be at in the Admin UI */
  // Not currently used. Should be passed into `keystone.createSchemaCcc()`.
  // path?: string;
  /**
   * The description shown on the schema ccc page
   * @default schemaCccConfig.description
   */
  description?: string; // the description displayed below the field in the Admin UI

  /**
   * Excludes this schema ccc from the Admin UI
   * @default false
   */
  isHidden?: MaybeSessionFunction<boolean, SchemaCccTypeInfo>;
  /**
   * Hides the create button in the Admin UI.
   * Note that this does **not** disable creating items through the GraphQL API, it only hides the button to create an item for this schema ccc in the Admin UI.
   * @default false
   */
  hideCreate?: MaybeSessionFunction<boolean, SchemaCccTypeInfo>;
  /**
   * Hides the delete button in the Admin UI.
   * Note that this does **not** disable deleting items through the GraphQL API, it only hides the button to delete an item for this schema ccc in the Admin UI.
   * @default false
   */
  hideDelete?: MaybeSessionFunction<boolean, SchemaCccTypeInfo>;
  /**
   * Configuration specific to the create view in the Admin UI
   */
  createView?: {
    /**
     * The default field mode for fields on the create view for this schema ccc.
     * Specific field modes on a per-field basis via a field's config.
     * @default 'edit'
     */
    defaultFieldMode?: MaybeSessionFunction<'edit' | 'hidden', SchemaCccTypeInfo>;
  };

  /**
   * Configuration specific to the item view in the Admin UI
   */
  itemView?: {
    /**
     * The default field mode for fields on the item view for this schema ccc.
     * This controls what people can do for fields
     * Specific field modes on a per-field basis via a field's config.
     * @default 'edit'
     */
    defaultFieldMode?: MaybeItemFunction<'edit' | 'read' | 'hidden', SchemaCccTypeInfo>;
  };

  /**
   * Configuration specific to the list view in the Admin UI
   */
  listView?: {
    /**
     * The default field mode for fields on the list view for this schema ccc.
     * Specific field modes on a per-field basis via a field's config.
     * @default 'read'
     */
    defaultFieldMode?: MaybeSessionFunction<'read' | 'hidden', SchemaCccTypeInfo>;
    /**
     * The columns(which refer to fields) that should be shown to users of the Admin UI.
     * Users of the Admin UI can select different columns to show in the UI.
     * @default the first three fields in the schema ccc
     */
    initialColumns?: readonly ('id' | keyof Fields)[];
    // was previously top-level defaultSort
    initialSort?: { field: 'id' | keyof Fields; direction: 'ASC' | 'DESC' };
    // was previously defaultPageSize
    pageSize?: number; // default number of items to display per page on the list screen
    // note: we are removing maximumPageSize
  };

  /**
   * The label used to identify the schema ccc in navigation and etc.
   * @default schemaCccKey.replace(/([a-z])([A-Z])/g, '$1 $2').split(/\s|_|\-/).filter(i => i).map(upcase).join(' ');
   */
  label?: string;

  /**
   * The singular form of the schema ccc key.
   *
   * It is used in sentences like `Are you sure you want to delete these {plural}?`
   * @default pluralize.singular(label)
   */
  singular?: string;

  /**
   * The plural form of the schema ccc key.
   *
   * It is used in sentences like `Are you sure you want to delete this {singular}?`.
   * @default pluralize.plural(label)
   */
  plural?: string;

  /**
   * The path segment to identify the schema ccc in URLs.
   *
   * It must match the pattern `/^[a-z-_][a-z0-9-_]*$/`.
   * @default label.split(' ').join('-').toLowerCase()
   */
  path?: string;
};

export type MaybeSessionFunction<
  T extends string | boolean,
  SchemaCccTypeInfo extends BaseSchemaCccTypeInfo
> =
  | T
  | ((args: {
      session: any;
      context: KeystoneContextFromSchemaCccTypeInfo<SchemaCccTypeInfo>;
    }) => MaybePromise<T>);

export type MaybeItemFunction<T, SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> =
  | T
  | ((args: {
      session: any;
      context: KeystoneContextFromSchemaCccTypeInfo<SchemaCccTypeInfo>;
      item: SchemaCccTypeInfo['item'];
    }) => MaybePromise<T>);

export type SchemaCccGraphQLConfig = {
  /**
   * The description added to the GraphQL schema
   * @default schemaCccConfig.description
   */
  description?: string;
  /**
   * The plural form of the schema ccc key to use in the generated GraphQL schema.
   * Note that there is no singular here because the singular used in the GraphQL schema is the list key.
   */
  // was previously top-level schemaCccQueryName
  plural?: string;
  // was previously top-level queryLimits
  queryLimits?: {
    maxResults?: number; // maximum number of items that can be returned in a query (or subquery)
  };
  cacheHint?: ((args: CacheHintArgs) => CacheHint) | CacheHint;
  // Setting any of these values will remove the corresponding operations from the GraphQL schema.
  // Queries:
  //   'query':  Does item()/items() exist?
  // Mutations:
  //   'create': Does createItem/createItems exist? Does `create` exist on the RelationshipInput types?
  //   'update': Does updateItem/updateItems exist?
  //   'delete': Does deleteItem/deleteItems exist?
  // If `true`, then everything will be omitted, including the output type. This makes it a DB only schema ccc,
  // including from the point of view of relationships to this schema ccc.
  //
  // Default: undefined
  omit?: true | readonly ('query' | 'create' | 'update' | 'delete')[];
};

export type CacheHintArgs = { results: any; operationName?: string; meta: boolean };

export type SchemaCccDBConfig = {
  /**
   * The kind of id to use.
   * @default { kind: "cuid" }
   */
  idField?: IdFieldConfig;
  /**
   * Specifies an alternative name name for the table to use, if you don't want
   * the default (derived from the schema ccc key)
   */
  map?: string;
};
