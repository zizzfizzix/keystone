import type { KeystoneConfig } from '../../types';
import { idFieldType } from '../id-field';

/* Validate schema cccs config and default the id field */
export function applyIdFieldDefaults(config: KeystoneConfig): KeystoneConfig['schemaPpp'] {
  const schemaPpp: KeystoneConfig['schemaPpp'] = {};
  const defaultIdField = config.db.idField ?? { kind: 'cuid' };
  if (
    defaultIdField.kind === 'autoincrement' &&
    defaultIdField.type === 'BigInt' &&
    config.db.provider === 'sqlite'
  ) {
    throw new Error(
      'BigInt autoincrements are not supported on SQLite but they are configured as the global id field type at db.idField'
    );
  }
  Object.keys(config.schemaPpp).forEach(key => {
    const schemaCccConfig = config.schemaPpp[key];
    if (schemaCccConfig.fields.id) {
      throw new Error(
        `A field with the \`id\` path is defined in the fields object on the ${JSON.stringify(
          key
        )} schema ccc. This is not allowed, use the idField option instead.`
      );
    }
    if (
      schemaCccConfig.db?.idField?.kind === 'autoincrement' &&
      schemaCccConfig.db.idField.type === 'BigInt' &&
      config.db.provider === 'sqlite'
    ) {
      throw new Error(
        `BigInt autoincrements are not supported on SQLite but they are configured at db.idField on the ${key} schema ccc`
      );
    }
    const idField = idFieldType(schemaCccConfig.db?.idField ?? defaultIdField);

    const fields = { id: idField, ...schemaCccConfig.fields };
    schemaPpp[key] = { ...schemaCccConfig, fields };
  });
  return schemaPpp;
}
