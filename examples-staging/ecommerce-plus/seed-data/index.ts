// import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { KeystoneContext } from '@keystone-next/keystone/types';
import { sentenceCase, reverseSentenceCase } from './utils';

type TSVToken = {
  fieldKey: string;
  type: string;
  many?: boolean;
  foreignListKey?: string;
  foreignFieldKey?: string;
  index: number;
};

type ParsedTSVField = Omit<TSVToken, 'fieldKey'> & {
  value: string;
};

type ParsedTSVItem = Record<string, ParsedTSVField>;

type JoinOperation = {
  fieldKey: string;
  foreignListKey: string;
  listName: string;
  referenceValue: {
    value: string;
  };
  many: boolean;
  listLookupField: string;
  prismaListKey: string;
  foreignJoinField?: string;
  foreignFieldKey?: string;
  value: string | string[];
};
type ListJoinMeta = {
  lookupField?: string;
  labelField: string;
};
let joinOperations: JoinOperation[] = [];
let listJoinFields: Map<string, ListJoinMeta> = new Map();

function getTSV(list: string) {
  return fs.readFileSync(path.resolve(__dirname, `${list}.tsv`), {
    encoding: 'utf-8',
  });
}

function transformTSV({ data, list }: { list: string; data: string }): {
  listName: string;
  listItems: any[];
} {
  const lines: string[] = data.split('\n');
  const tsvHeader = lines.shift() as string;
  const listName = sentenceCase(list);
  let specialFields: any[] = [];
  // Construct the list meta from
  // the tsv header
  const listMeta: TSVToken[] = tsvHeader
    .split('\t')
    .map((token: string, i: number): TSVToken => {
      let listItem: any = {};
      const [fieldKey, type, fieldSemantic] = token.split(' ');
      // the type string has a bunch of additional markup for encodedd
      // relationship info that we want to capture for later.
      let [typeValue, ref, many] = type.replace(/\(|\)|(\r)/g, '').split(':');
      listItem = {
        fieldKey,
        type: typeValue,
        index: i,
      };
      if (fieldSemantic && !listJoinFields.has(list)) {
        console.log(list, fieldKey);
        // listJoinFields.set(list, fieldKey);
        specialFields.push({
          key: fieldKey,
          type: fieldSemantic === 'unique' ? 'lookupField' : 'labelField',
        });
      }

      if (typeValue === 'relationship') {
        let [foreignListKey, foreignFieldKey] = ref.split('.');
        listItem.many = !!many;
        listItem.foreignListKey = foreignListKey;
        listItem.foreignFieldKey = foreignFieldKey;
      }
      return listItem;
    });
  // Add the special fields to the global cache for this list
  // so that we can refer to them later on while constructing relationships
  if (specialFields.length) {
    listJoinFields.set(
      list,
      specialFields.reduce((acc, curr) => {
        acc[curr.type] = curr.key;
        return acc;
      }, {})
    );
  }

  const listItems = lines.map((line: string) => {
    // for Each line
    // associate each column with the correct entity
    return line.split('\t').reduce((acc: ParsedTSVItem, curr, i) => {
      const { fieldKey, type, ...rest }: TSVToken = listMeta[i];
      acc[fieldKey] = {
        value: curr,
        type,
        ...rest,
      };
      return acc;
    }, {});
  });
  return {
    listName,
    listItems,
  };
}

const lists = [
  'product',
  'review',
  // 'productBundle',
  'productVariant',
  // 'review',
];

function coerceField({ type, value }: ParsedTSVField) {
  switch (type) {
    case 'integer': {
      const numericValue = value.replace(/[^0-9 | \.]]/g, '');
      return parseInt(numericValue, 10);
    }
    case 'float': {
      const numericValue = value.replace(/[^0-9|\.]|/g, '');
      return parseFloat(numericValue);
    }
    case 'json': {
      return JSON.parse(value);
    }
    case 'select':
    case 'text': {
      return value;
    }
    case 'relationship':
      return undefined;
    case 'component':
    case 'order':
    case 'document':
    default:
      return undefined;
  }
}

function coerceItem(item: ParsedTSVItem, list: string): any {
  return Object.entries(item).reduce(
    (acc: any, [key, field]: [string, any]) => {
      console.log(key, field);
      if (field.type === 'relationship' && field.value.length > 0) {
        const joinFields = listJoinFields.get(
          reverseSentenceCase(list)
        ) as ListJoinMeta;

        const lookupField = joinFields.lookupField || joinFields.labelField;
        const referenceValue = item[lookupField] as ParsedTSVField;
        // if (!referenceValue) {
        //   console.log('THERE IS NO REFERENCE VALUE', { item, lookupField });
        //   console.log(listJoinFields.entries());
        // }
        const listJoinFieldsKey = reverseSentenceCase(field.foreignListKey);
        const foreignJoinField: string | undefined = listJoinFields.has(
          listJoinFieldsKey
        )
          ? (listJoinFields.get(listJoinFieldsKey) as ListJoinMeta).labelField
          : undefined;
        const joinOperation: JoinOperation = {
          many: !!field.many,
          listName: list,
          referenceValue,
          listLookupField: lookupField,
          prismaListKey: reverseSentenceCase(list),
          foreignJoinField,
          foreignListKey: reverseSentenceCase(field.foreignListKey),
          foreignFieldKey: field.foreignFieldKey,
          value: !!field.many
            ? field.value
                .replace(/\r/g, '')
                .split(',')
                .map((i: string) => i.trim())
            : field.value.replace(/\r/g, ''),
          fieldKey: key,
        };
        console.log(joinOperation);
        joinOperations.push(joinOperation);
      }
      acc[key] = coerceField(field);
      return acc;
    },
    {} as Record<string, any>
  );
}

async function connectOne({
  prisma,
  joinOperation,
}: {
  prisma: any;
  joinOperation: JoinOperation;
}) {
  // grab the id of the item we want to connect to.
  const {
    value,
    foreignListKey,
    referenceValue,
    listLookupField,
    foreignJoinField,
    fieldKey,
    prismaListKey,
  } = joinOperation;
  const data = await prisma[foreignListKey].findUnique({
    where: {
      [foreignJoinField as string]: value,
    },
  });
  if (!data) {
    console.log('#### NO DATA', joinOperation);
  }
  // console.log(data);
  // console.log(referenceValue);
  // First lookup our item, and check if its already related to our item in question.
  // update our list with the id of that item.
  console.log('WE HAVE NOT JOINED IT YET');
  await prisma[prismaListKey].update({
    where: {
      [listLookupField]: referenceValue.value,
    },
    data: {
      [fieldKey]: { connect: { id: data.id } },
    },
  });
}
async function connectMany({
  prisma,
  joinOperation,
  foreignJoinField,
}: // listName,
any) {
  // grab the id of the item we want to connect to.
  // console.log(joinOperation);
  const {
    foreignListKey,
    listLookupField,
    value,
    prismaListKey,
    referenceValue,
    fieldKey,
  } = joinOperation;

  // console.log({
  //   foreignPrismaKey,
  //   foreignJoinField,
  //   value,
  // });
  const data = await prisma[foreignListKey].findMany({
    where: {
      [foreignJoinField]: {
        in: value,
      },
    },
  });

  const ids = data.map((item: any) => ({ id: item.id }));

  // First lookup our item, and check if its already related to our item in question.
  // TODO, find a way to do this more efficiently via a cache
  // For now, we can just associate the DB entry irrespective of duplicative join operations.
  // update our list with the id of that item.
  console.log('WE HAVE NOT JOINED IT YET', listLookupField);
  await prisma[prismaListKey].update({
    where: {
      [listLookupField]: referenceValue.value,
    },
    data: {
      [`${fieldKey}`]: { connect: ids },
    },
  });
}

async function connectFields(
  { prisma }: KeystoneContext,
  joinOperation: JoinOperation
  // cache: Set<string>
) {
  if (!joinOperation.foreignJoinField) {
    return undefined;
    console.log(
      `❌ The list ${joinOperation.foreignListKey} does not have a valid foreignJoinField, skipping operation`
    );
  }

  try {
    if (joinOperation.many) {
      console.log('👨‍👩‍👧 Calling connectMany');
      await connectMany({
        prisma,
        joinOperation,
      });
    } else {
      console.log('👨‍💼 Calling connectOne');
      await connectOne({
        prisma,
        joinOperation,
      });
    }
  } catch (e) {
    console.log(
      `❌ Failed to connect ${joinOperation.listName} item, moving on...`
    );
    console.log(joinOperation);
    console.log(e);
  }
}

export async function seedData(context: KeystoneContext) {
  // Extrapolate all the tsv's into a queryable structure.
  for (const list of lists) {
    console.log(`📖 Reading TSV for ${list}`);
    const data = getTSV(list);

    console.log(`👀 Parsing TSV for ${list}`);
    const parsedTSV = transformTSV({ data, list });
    fs.writeFileSync(
      path.resolve(__dirname, `${list}.json`),
      JSON.stringify(parsedTSV, null, 1)
    );

    for (const listItem of parsedTSV.listItems) {
      const data = coerceItem(listItem, list);
      delete data.id;
      await context.prisma[list].create({
        data,
      });
    }
  }
  fs.writeFileSync(
    path.resolve(__dirname, `joinOperations.json`),
    JSON.stringify(joinOperations, null, 2)
  );
  console.log('🖕 Assigning items to each other');
  for (const joinOperation of joinOperations) {
    await connectFields(context, joinOperation);
  }
  // leave the following fields intentionally undefined
  // - relationship.
  // - document.

  // const createdItems = createItems(lists);

  // Once all lists are parsed and in the database
  // Interrogate the in memory record for each list
  // filter down the relationships
  // parse the relationships for the relevant foreign list, foreign key and labelField

  // const createAssignations = createAssignations(lists);
  process.exit();
}
