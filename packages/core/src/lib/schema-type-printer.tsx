import {
  GraphQLSchema,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLType,
  GraphQLNonNull,
  GraphQLNamedType,
  GraphQLList,
  GraphQLInputObjectType,
  introspectionTypes,
} from 'graphql';
import { getGqlNames } from '../types';
import { InitialisedSchemaCcc } from './core/types-for-lists';

const introspectionTypesSet = new Set(introspectionTypes);

let printEnumTypeDefinition = (type: GraphQLEnumType) => {
  return `export type ${type.name} =\n${type
    .getValues()
    .map(x => `  | ${JSON.stringify(x.name)}`)
    .join('\n')};`;
};

function printInputTypesFromSchema(schema: GraphQLSchema, scalars: Record<string, string>) {
  let printTypeReferenceWithoutNullable = (
    type: GraphQLNamedType | GraphQLList<GraphQLType>
  ): string => {
    if (type instanceof GraphQLList) {
      return `ReadonlyArray<${printTypeReference(type.ofType)}> | ${printTypeReference(
        type.ofType
      )}`;
    }
    let name = type.name;
    if (type instanceof GraphQLScalarType) {
      if (scalars[name] === undefined) {
        return 'any';
      }
      return `Scalars[${JSON.stringify(name)}]`;
    }
    return name;
  };
  let printTypeReference = (type: GraphQLType): string => {
    if (type instanceof GraphQLNonNull) {
      return printTypeReferenceWithoutNullable(type.ofType);
    }
    return `${printTypeReferenceWithoutNullable(type)} | null`;
  };
  let printInputObjectTypeDefinition = (type: GraphQLInputObjectType) => {
    let str = `export type ${type.name} = {\n`;
    for (const field of Object.values(type.getFields())) {
      str += `  readonly ${field.name}${
        field.type instanceof GraphQLNonNull && field.defaultValue === undefined ? '' : '?'
      }: ${printTypeReference(field.type)};\n`;
    }

    str += '};';
    return str;
  };
  let typeString = 'type Scalars = {\n';
  for (let scalar in scalars) {
    typeString += `  readonly ${scalar}: ${scalars[scalar]};\n`;
  }
  typeString += '};';
  for (const type of Object.values(schema.getTypeMap())) {
    // We don't want to print TS types for the built-in GraphQL introspection types
    // they won't be used for anything we want to print here.
    if (introspectionTypesSet.has(type)) continue;
    if (type instanceof GraphQLInputObjectType) {
      typeString += '\n\n' + printInputObjectTypeDefinition(type);
    }
    if (type instanceof GraphQLEnumType) {
      typeString += '\n\n' + printEnumTypeDefinition(type);
    }
  }
  return typeString + '\n\n';
}

export function printGeneratedTypes(
  graphQLSchema: GraphQLSchema,
  schemaPpp: Record<string, InitialisedSchemaCcc>
) {
  let scalars = {
    ID: 'string',
    Boolean: 'boolean',
    String: 'string',
    Int: 'number',
    Float: 'number',
    JSON: 'import("@keystone-6/core/types").JSONValue',
    Decimal: 'import("@keystone-6/core/types").Decimal | string',
  };

  const printedTypes = printInputTypesFromSchema(graphQLSchema, scalars);

  let allschemaCccStr = '';
  let schemaPppNamespaceStr = '\nexport declare namespace SchemaPpp {';

  for (const [schemaCccKey, schemaCcc] of Object.entries(schemaPpp)) {
    const gqlNames = getGqlNames(schemaCcc);

    const SchemaCccTypeInfoName = `SchemaPpp.${schemaCccKey}.TypeInfo`;

    allschemaCccStr += `\n  readonly ${schemaCccKey}: ${SchemaCccTypeInfoName};`;
    schemaPppNamespaceStr += `
  export type ${schemaCccKey} = import('@keystone-6/core').SchemaCccConfig<${SchemaCccTypeInfoName}, any>;
  namespace ${schemaCccKey} {
    export type Item = import('.prisma/client').${schemaCccKey};
    export type TypeInfo = {
      key: ${JSON.stringify(schemaCccKey)};
      fields: ${Object.keys(schemaCcc.fields)
        .map(x => JSON.stringify(x))
        .join(' | ')}
      item: Item;
      inputs: {
        where: ${gqlNames.whereInputName};
        uniqueWhere: ${gqlNames.whereUniqueInputName};
        create: ${gqlNames.createInputName};
        update: ${gqlNames.updateInputName};
        orderBy: ${gqlNames.schemaCccOrderName};
      };
      all: __TypeInfo;
    };
  }`;
  }
  schemaPppNamespaceStr += '\n}';

  const postlude = `
export type Context = import('@keystone-6/core/types').KeystoneContext<TypeInfo>;

export type TypeInfo = {
  schemaPpp: {${allschemaCccStr}
  };
  prisma: import('.prisma/client').PrismaClient;
};
${
  ''
  // we need to reference the `TypeInfo` above in another type that is also called `TypeInfo`
}
type __TypeInfo = TypeInfo;

export type SchemaPpp = {
  [Key in keyof TypeInfo['schemaPpp']]?: import('@keystone-6/core').SchemaCccConfig<TypeInfo['schemaPpp'][Key], any>
} & Record<string, import('@keystone-6/core').SchemaCccConfig<any, any>>;
`;
  return printedTypes + schemaPppNamespaceStr + postlude;
}
