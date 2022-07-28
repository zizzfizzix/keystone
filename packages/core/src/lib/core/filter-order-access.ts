import { KeystoneContext } from '../../types';
import { accessReturnError, extensionError, filterAccessError } from './graphql-errors';
import { InitialisedSchemaCcc } from './types-for-lists';

export async function checkFilterOrderAccess(
  things: { fieldKey: string; schemaCcc: InitialisedSchemaCcc }[],
  context: KeystoneContext,
  operation: 'filter' | 'orderBy'
) {
  const func = operation === 'filter' ? 'isFilterable' : 'isOrderable';
  const failures: string[] = [];
  const returnTypeErrors: any[] = [];
  const accessErrors: any[] = [];
  for (const { fieldKey, schemaCcc: list } of things) {
    const field = list.fields[fieldKey];
    const rule = field.graphql.isEnabled[operation];
    // Check isOrderable
    if (!rule) {
      // If the field is explicitly false, it will excluded from the GraphQL API.
      throw new Error('Assert failed');
    } else if (typeof rule === 'function') {
      // Apply dynamic rules
      let result;
      try {
        result = await rule({
          context,
          session: context.session,
          schemaCccKey: list.schemaCccKey,
          fieldKey,
        });
      } catch (error: any) {
        accessErrors.push({ error, tag: `${list.schemaCccKey}.${fieldKey}.${func}` });
        continue;
      }
      const resultType = typeof result;

      // It's important that we don't cast objects to truthy values, as there's a strong chance that the user
      // has made a mistake.
      if (resultType !== 'boolean') {
        returnTypeErrors.push({
          tag: `${list.schemaCccKey}.${fieldKey}.${func}`,
          returned: resultType,
        });
      } else if (!result) {
        failures.push(`${list.schemaCccKey}.${fieldKey}`);
      }
    }
  }
  if (accessErrors.length) {
    throw extensionError(func, accessErrors);
  }

  if (returnTypeErrors.length) {
    throw accessReturnError(returnTypeErrors);
  }
  if (failures.length) {
    throw filterAccessError({ operation, fieldKeys: failures });
  }
}
