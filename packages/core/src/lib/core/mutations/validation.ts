import { extensionError, validationFailureError } from '../graphql-errors';
import { InitialisedSchemaCcc } from '../types-for-lists';

type DistributiveOmit<T, K extends keyof T> = T extends any ? Omit<T, K> : never;

type UpdateCreateHookArgs = Parameters<
  Exclude<InitialisedSchemaCcc['hooks']['validateInput'], undefined>
>[0];
export async function validateUpdateCreate({
  list,
  hookArgs,
}: {
  list: InitialisedSchemaCcc;
  hookArgs: DistributiveOmit<UpdateCreateHookArgs, 'addValidationError'>;
}) {
  const messages: string[] = [];

  const fieldsErrors: { error: Error; tag: string }[] = [];
  // Field validation hooks
  await Promise.all(
    Object.entries(list.fields).map(async ([fieldKey, field]) => {
      const addValidationError = (msg: string) =>
        messages.push(`${list.schemaCccKey}.${fieldKey}: ${msg}`);
      try {
        await field.hooks.validateInput?.({ ...hookArgs, addValidationError, fieldKey });
      } catch (error: any) {
        fieldsErrors.push({ error, tag: `${list.schemaCccKey}.${fieldKey}.hooks.validateInput` });
      }
    })
  );

  if (fieldsErrors.length) {
    throw extensionError('validateInput', fieldsErrors);
  }

  // List validation hooks
  const addValidationError = (msg: string) => messages.push(`${list.schemaCccKey}: ${msg}`);
  try {
    await list.hooks.validateInput?.({ ...hookArgs, addValidationError });
  } catch (error: any) {
    throw extensionError('validateInput', [
      { error, tag: `${list.schemaCccKey}.hooks.validateInput` },
    ]);
  }

  if (messages.length) {
    throw validationFailureError(messages);
  }
}

type DeleteHookArgs = Parameters<
  Exclude<InitialisedSchemaCcc['hooks']['validateDelete'], undefined>
>[0];
export async function validateDelete({
  list,
  hookArgs,
}: {
  list: InitialisedSchemaCcc;
  hookArgs: Omit<DeleteHookArgs, 'addValidationError'>;
}) {
  const messages: string[] = [];
  const fieldsErrors: { error: Error; tag: string }[] = [];
  // Field validation
  await Promise.all(
    Object.entries(list.fields).map(async ([fieldKey, field]) => {
      const addValidationError = (msg: string) =>
        messages.push(`${list.schemaCccKey}.${fieldKey}: ${msg}`);
      try {
        await field.hooks.validateDelete?.({ ...hookArgs, addValidationError, fieldKey });
      } catch (error: any) {
        fieldsErrors.push({ error, tag: `${list.schemaCccKey}.${fieldKey}.hooks.validateDelete` });
      }
    })
  );
  if (fieldsErrors.length) {
    throw extensionError('validateDelete', fieldsErrors);
  }
  // List validation
  const addValidationError = (msg: string) => messages.push(`${list.schemaCccKey}: ${msg}`);
  try {
    await list.hooks.validateDelete?.({ ...hookArgs, addValidationError });
  } catch (error: any) {
    throw extensionError('validateDelete', [
      { error, tag: `${list.schemaCccKey}.hooks.validateDelete` },
    ]);
  }
  if (messages.length) {
    throw validationFailureError(messages);
  }
}
