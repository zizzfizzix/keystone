// import { google } from 'googleapis';
// import fs from 'fs';
import { KeystoneContext } from '@keystone-next/keystone/types';
import { persons, tasks } from './data';

type PersonProps = {
  name: string;
};

type TaskProps = {
  label: string;
  isComplete: Boolean;
  finishBy: string;
  assignedTo: Object;
  person?: Object;
};

// const SHEETID_MAP = {
//   product: '752227153',
//   review: '1324371556',
//   productVariant: '143292712',
//   cartItem: '1346783059',
//   productBundle: '1600162941',
//   category: '400068384',
//   shippingZone: '539150047',
//   shippingMethod: '1701062370',
//   brand: '968463722',
//   user: '1635229822',
//   userAddress: '233160524',
//   role: '1953826656',
//   page: '2135890782',
//   post: '1619697549',
//   order: '284514970',
//   orderNote: '1786357830',
//   orderItem: '715584027',
// };

// const sheets = google.sheets('v4');
// async function fetchDataFromSheets(): Record<string, any> {
//   const  fs.readFileSync()
//   const request = {
//     spreadsheetId: SHEETID_MAP.product,
//     includeGridData:false,
//     auth: authClient;
//   };
//   // Grab data from sheet.
//   // if its a relationship item
//   // turn it into a connect query
//   try {
//     const rseponse = await sheets.spreadsheets.get(request).data;
//   } catch (err) {
//     console.log(err);
//   }
// }

export async function insertSeedData(context: KeystoneContext) {
  console.log(`🌱 Inserting seed data`);

  const createPerson = async (personData: PersonProps) => {
    let person = null;
    try {
      person = await context.query.Person.findOne({
        where: { name: personData.name },
        query: 'id',
      });
    } catch (e) {}
    if (!person) {
      person = await context.query.Person.createOne({
        data: personData,
        query: 'id',
      });
    }
    return person;
  };

  const createTask = async (taskData: TaskProps) => {
    let persons;
    try {
      persons = await context.query.Person.findMany({
        where: { name: { equals: taskData.assignedTo } },
        query: 'id',
      });
    } catch (e) {
      persons = [];
    }
    taskData.assignedTo = { connect: { id: persons[0].id } };
    const task = await context.query.Task.createOne({
      data: taskData,
      query: 'id',
    });
    return task;
  };

  for (const person of persons) {
    console.log(`👩 Adding person: ${person.name}`);
    await createPerson(person);
  }
  for (const task of tasks) {
    console.log(`🔘 Adding task: ${task.label}`);
    await createTask(task);
  }

  console.log(`✅ Seed data inserted`);
  console.log(
    `👋 Please start the process with \`yarn dev\` or \`npm run dev\``
  );
  process.exit();
}
