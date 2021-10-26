const fs = require('fs');
const path = require('path');

function coerceValue(value, type) {
  if (!value) return null;
  switch (type) {
    case 'integer': {
      const numericValue = value.replace(/[^0-9 | \.]/g, '');
      if (isNaN(numericValue)) {
        return value;
      }
      return parseInt(numericValue, 10);
    }
    case 'float': {
      const numericValue = value.replace(/[^0-9]|^\./g, '');
      if (isNaN(numericValue)) {
        return value;
      }
      return parseFloat(numericValue, 10);
    }
    case 'text': {
      return value;
    }
    case 'order':
    case 'component':
    case 'relationship':
    default:
      return undefined;
  }
}
function generateListItems(data) {
  const lines = data.split('\n');
  const fieldsAndTypes = lines
    .shift()
    .split('\t')
    .map((token, i) => {
      let listItem = {};
      const [fieldKey, type] = token.split(' ');
      let [typeValue, ref, many] = type.replace(/\(|\)|(\r)/g, '').split(':');
      listItem = {
        fieldKey,
        type: typeValue,
        index: i,
      };
      if (typeValue === 'relationship') {
        let [foreignListKey, foreignFieldKey] = ref.split('.');
        listItem.many = !!many;
        listItem.foreignListKey = foreignListKey;
        listItem.foreignFieldKey = foreignFieldKey;
      }
      return listItem;
    });

  console.log(fieldsAndTypes);
  const listItem = lines.map(line => {
    // for Each line
    // associate each column with the correct entity
    return line.split('\t').reduce((acc, curr, i) => {
      const { fieldKey, type } = fieldsAndTypes[i];
      acc[fieldKey] = {
        value: coerceValue(curr, type),
      };
      return acc;
    }, {});
  });
  return listItem;
}
// console.log(getFieldsAndTypes(data));

function seedData(context) {
  const data = fs.readFileSync(path.resolve(__dirname, 'product.tsv'), {
    encoding: 'utf-8',
  });
  const listItems = generateListItems(data, context);
  return listItems;
}

seedData();

// fs.writeFileSync(
//   path.resolve(__dirname, 'products.json'),
//   JSON.stringify(getFieldsAndTypes(data), null, 2)
// );
