import type { KeystoneContextFromSchemaCccTypeInfo } from '..';
import { BaseSchemaCccTypeInfo } from '../type-info';

type CommonArgs<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = {
  context: KeystoneContextFromSchemaCccTypeInfo<SchemaCccTypeInfo>;
  /**
   * The key of the schemaCcc that the operation is occurring on
   */
  schemaCccKey: string;
};

export type SchemaCccHooks<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = {
  /**
   * Used to **modify the input** for create and update operations after default values and access control have been applied
   */
  resolveInput?: ResolveInputSchemaCccHook<SchemaCccTypeInfo>;
  /**
   * Used to **validate the input** for create and update operations once all resolveInput hooks resolved
   */
  validateInput?: ValidateInputHook<SchemaCccTypeInfo>;
  /**
   * Used to **validate** that a delete operation can happen after access control has occurred
   */
  validateDelete?: ValidateDeleteHook<SchemaCccTypeInfo>;
  /**
   * Used to **cause side effects** before a create, update, or delete operation once all validateInput hooks have resolved
   */
  beforeOperation?: BeforeOperationHook<SchemaCccTypeInfo>;
  /**
   * Used to **cause side effects** after a create, update, or delete operation operation has occurred
   */
  afterOperation?: AfterOperationHook<SchemaCccTypeInfo>;
};

// TODO: probably maybe don't do this and write it out manually
// (this is also incorrect because the return value is wrong for many of them)
type AddFieldPathToObj<T extends (arg: any) => any> = T extends (args: infer Args) => infer Result
  ? (args: Args & { fieldKey: string }) => Result
  : never;

type AddFieldPathArgToAllPropsOnObj<T extends Record<string, (arg: any) => any>> = {
  [Key in keyof T]: AddFieldPathToObj<T[Key]>;
};

export type FieldHooks<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> =
  AddFieldPathArgToAllPropsOnObj<{
    /**
     * Used to **modify the input** for create and update operations after default values and access control have been applied
     */
    resolveInput?: ResolveInputFieldHook<SchemaCccTypeInfo>;
    /**
     * Used to **validate the input** for create and update operations once all resolveInput hooks resolved
     */
    validateInput?: ValidateInputHook<SchemaCccTypeInfo>;
    /**
     * Used to **validate** that a delete operation can happen after access control has occurred
     */
    validateDelete?: ValidateDeleteHook<SchemaCccTypeInfo>;
    /**
     * Used to **cause side effects** before a create, update, or delete operation once all validateInput hooks have resolved
     */
    beforeOperation?: BeforeOperationHook<SchemaCccTypeInfo>;
    /**
     * Used to **cause side effects** after a create, update, or delete operation operation has occurred
     */
    afterOperation?: AfterOperationHook<SchemaCccTypeInfo>;
  }>;

type ArgsForCreateOrUpdateOperation<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> =
  | {
      operation: 'create';
      // technically this will never actually exist for a create
      // but making it optional rather than not here
      // makes for a better experience
      // because then people will see the right type even if they haven't refined the type of operation to 'create'
      item?: SchemaCccTypeInfo['item'];
      /**
       * The GraphQL input **before** default values are applied
       */
      inputData: SchemaCccTypeInfo['inputs']['create'];
      /**
       * The GraphQL input **after** default values are applied
       */
      resolvedData: SchemaCccTypeInfo['inputs']['create'];
    }
  | {
      operation: 'update';
      item: SchemaCccTypeInfo['item'];
      /**
       * The GraphQL input **before** default values are applied
       */
      inputData: SchemaCccTypeInfo['inputs']['update'];
      /**
       * The GraphQL input **after** default values are applied
       */
      resolvedData: SchemaCccTypeInfo['inputs']['update'];
    };

type ResolveInputSchemaCccHook<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = (
  args: ArgsForCreateOrUpdateOperation<SchemaCccTypeInfo> & CommonArgs<SchemaCccTypeInfo>
) =>
  | Promise<SchemaCccTypeInfo['inputs']['create'] | SchemaCccTypeInfo['inputs']['update']>
  | SchemaCccTypeInfo['inputs']['create']
  | SchemaCccTypeInfo['inputs']['update']
  // TODO: These were here to support field hooks before we created a separate type
  // (see ResolveInputFieldHook), check whether they're safe to remove now
  | Record<string, any>
  | string
  | number
  | boolean
  | null;

type ResolveInputFieldHook<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = (
  args: ArgsForCreateOrUpdateOperation<SchemaCccTypeInfo> & CommonArgs<SchemaCccTypeInfo>
) =>
  | Promise<SchemaCccTypeInfo['inputs']['create'] | SchemaCccTypeInfo['inputs']['update']>
  | SchemaCccTypeInfo['inputs']['create']
  | SchemaCccTypeInfo['inputs']['update']
  // TODO: These may or may not be correct, but without them you can't define a
  // resolveInput hook for a field that returns a simple value (e.g timestamp)
  | Record<string, any>
  | string
  | number
  | boolean
  | null
  // Fields need to be able to return `undefined` to say "don't touch this field"
  | undefined;

type ValidateInputHook<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = (
  args: ArgsForCreateOrUpdateOperation<SchemaCccTypeInfo> & {
    addValidationError: (error: string) => void;
  } & CommonArgs<SchemaCccTypeInfo>
) => Promise<void> | void;

type ValidateDeleteHook<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = (
  args: {
    operation: 'delete';
    item: SchemaCccTypeInfo['item'];
    addValidationError: (error: string) => void;
  } & CommonArgs<SchemaCccTypeInfo>
) => Promise<void> | void;

type BeforeOperationHook<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = (
  args: (
    | ArgsForCreateOrUpdateOperation<SchemaCccTypeInfo>
    | {
        operation: 'delete';
        item: SchemaCccTypeInfo['item'];
        inputData: undefined;
        resolvedData: undefined;
      }
  ) &
    CommonArgs<SchemaCccTypeInfo>
) => Promise<void> | void;

type AfterOperationHook<SchemaCccTypeInfo extends BaseSchemaCccTypeInfo> = (
  args: (
    | ArgsForCreateOrUpdateOperation<SchemaCccTypeInfo>
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
      | { operation: 'create' | 'update'; item: SchemaCccTypeInfo['item'] }
    ) &
    (
      | // technically this will never actually exist for a create
      // but making it optional rather than not here
      // makes for a better experience
      // because then people will see the right type even if they haven't refined the type of operation to 'create'
      { operation: 'create'; originalItem: undefined }
      | { operation: 'delete' | 'update'; originalItem: SchemaCccTypeInfo['item'] }
    ) &
    CommonArgs<SchemaCccTypeInfo>
) => Promise<void> | void;
