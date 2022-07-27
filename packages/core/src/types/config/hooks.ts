import type { KeystoneContextFromSchemaTypeTypeInfo } from '..';
import { BaseSchemaTypeTypeInfo } from '../type-info';

type CommonArgs<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = {
  context: KeystoneContextFromSchemaTypeTypeInfo<SchemaTypeTypeInfo>;
  /**
   * The key of the list that the operation is occurring on
   */
  schemaTypeKey: string;
};

export type ListHooks<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = {
  /**
   * Used to **modify the input** for create and update operations after default values and access control have been applied
   */
  resolveInput?: ResolveInputListHook<SchemaTypeTypeInfo>;
  /**
   * Used to **validate the input** for create and update operations once all resolveInput hooks resolved
   */
  validateInput?: ValidateInputHook<SchemaTypeTypeInfo>;
  /**
   * Used to **validate** that a delete operation can happen after access control has occurred
   */
  validateDelete?: ValidateDeleteHook<SchemaTypeTypeInfo>;
  /**
   * Used to **cause side effects** before a create, update, or delete operation once all validateInput hooks have resolved
   */
  beforeOperation?: BeforeOperationHook<SchemaTypeTypeInfo>;
  /**
   * Used to **cause side effects** after a create, update, or delete operation operation has occurred
   */
  afterOperation?: AfterOperationHook<SchemaTypeTypeInfo>;
};

// TODO: probably maybe don't do this and write it out manually
// (this is also incorrect because the return value is wrong for many of them)
type AddFieldPathToObj<T extends (arg: any) => any> = T extends (args: infer Args) => infer Result
  ? (args: Args & { fieldKey: string }) => Result
  : never;

type AddFieldPathArgToAllPropsOnObj<T extends Record<string, (arg: any) => any>> = {
  [Key in keyof T]: AddFieldPathToObj<T[Key]>;
};

export type FieldHooks<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> =
  AddFieldPathArgToAllPropsOnObj<{
    /**
     * Used to **modify the input** for create and update operations after default values and access control have been applied
     */
    resolveInput?: ResolveInputFieldHook<SchemaTypeTypeInfo>;
    /**
     * Used to **validate the input** for create and update operations once all resolveInput hooks resolved
     */
    validateInput?: ValidateInputHook<SchemaTypeTypeInfo>;
    /**
     * Used to **validate** that a delete operation can happen after access control has occurred
     */
    validateDelete?: ValidateDeleteHook<SchemaTypeTypeInfo>;
    /**
     * Used to **cause side effects** before a create, update, or delete operation once all validateInput hooks have resolved
     */
    beforeOperation?: BeforeOperationHook<SchemaTypeTypeInfo>;
    /**
     * Used to **cause side effects** after a create, update, or delete operation operation has occurred
     */
    afterOperation?: AfterOperationHook<SchemaTypeTypeInfo>;
  }>;

type ArgsForCreateOrUpdateOperation<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> =
  | {
      operation: 'create';
      // technically this will never actually exist for a create
      // but making it optional rather than not here
      // makes for a better experience
      // because then people will see the right type even if they haven't refined the type of operation to 'create'
      item?: SchemaTypeTypeInfo['item'];
      /**
       * The GraphQL input **before** default values are applied
       */
      inputData: SchemaTypeTypeInfo['inputs']['create'];
      /**
       * The GraphQL input **after** default values are applied
       */
      resolvedData: SchemaTypeTypeInfo['inputs']['create'];
    }
  | {
      operation: 'update';
      item: SchemaTypeTypeInfo['item'];
      /**
       * The GraphQL input **before** default values are applied
       */
      inputData: SchemaTypeTypeInfo['inputs']['update'];
      /**
       * The GraphQL input **after** default values are applied
       */
      resolvedData: SchemaTypeTypeInfo['inputs']['update'];
    };

type ResolveInputListHook<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = (
  args: ArgsForCreateOrUpdateOperation<SchemaTypeTypeInfo> & CommonArgs<SchemaTypeTypeInfo>
) =>
  | Promise<SchemaTypeTypeInfo['inputs']['create'] | SchemaTypeTypeInfo['inputs']['update']>
  | SchemaTypeTypeInfo['inputs']['create']
  | SchemaTypeTypeInfo['inputs']['update']
  // TODO: These were here to support field hooks before we created a separate type
  // (see ResolveInputFieldHook), check whether they're safe to remove now
  | Record<string, any>
  | string
  | number
  | boolean
  | null;

type ResolveInputFieldHook<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = (
  args: ArgsForCreateOrUpdateOperation<SchemaTypeTypeInfo> & CommonArgs<SchemaTypeTypeInfo>
) =>
  | Promise<SchemaTypeTypeInfo['inputs']['create'] | SchemaTypeTypeInfo['inputs']['update']>
  | SchemaTypeTypeInfo['inputs']['create']
  | SchemaTypeTypeInfo['inputs']['update']
  // TODO: These may or may not be correct, but without them you can't define a
  // resolveInput hook for a field that returns a simple value (e.g timestamp)
  | Record<string, any>
  | string
  | number
  | boolean
  | null
  // Fields need to be able to return `undefined` to say "don't touch this field"
  | undefined;

type ValidateInputHook<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = (
  args: ArgsForCreateOrUpdateOperation<SchemaTypeTypeInfo> & {
    addValidationError: (error: string) => void;
  } & CommonArgs<SchemaTypeTypeInfo>
) => Promise<void> | void;

type ValidateDeleteHook<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = (
  args: {
    operation: 'delete';
    item: SchemaTypeTypeInfo['item'];
    addValidationError: (error: string) => void;
  } & CommonArgs<SchemaTypeTypeInfo>
) => Promise<void> | void;

type BeforeOperationHook<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = (
  args: (
    | ArgsForCreateOrUpdateOperation<SchemaTypeTypeInfo>
    | {
        operation: 'delete';
        item: SchemaTypeTypeInfo['item'];
        inputData: undefined;
        resolvedData: undefined;
      }
  ) &
    CommonArgs<SchemaTypeTypeInfo>
) => Promise<void> | void;

type AfterOperationHook<SchemaTypeTypeInfo extends BaseSchemaTypeTypeInfo> = (
  args: (
    | ArgsForCreateOrUpdateOperation<SchemaTypeTypeInfo>
    | {
        operation: 'delete';
        // technically this will never actually exist for a delete
        // but making it optional rather than not here
        // makes for a better experience
        // because then people will see the right type even if they haven't refined the type of operation to 'delete'
        item: undefined;
        inputData: undefined;
        resolvedData: undefined;
      }
  ) &
    (
      | { operation: 'delete' }
      | { operation: 'create' | 'update'; item: SchemaTypeTypeInfo['item'] }
    ) &
    (
      | // technically this will never actually exist for a create
      // but making it optional rather than not here
      // makes for a better experience
      // because then people will see the right type even if they haven't refined the type of operation to 'create'
      { operation: 'create'; originalItem: undefined }
      | { operation: 'delete' | 'update'; originalItem: SchemaTypeTypeInfo['item'] }
    ) &
    CommonArgs<SchemaTypeTypeInfo>
) => Promise<void> | void;
