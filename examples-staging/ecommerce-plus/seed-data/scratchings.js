const fs = require('fs');
const path = require('path');
const data = fs.readFileSync(path.resolve(__dirname, 'products.tsv'), {
  encoding: 'utf-8',
});

function coerceValue(value, type) {
  if (!value) return null;
  switch (type) {
    case 'integer': {
      const numericValue = value.replace(/[^0-9 | \.]/g, '');
      if (isNaN(numericValue)) {
        console.log('##### WE HAVE A NAN', value, numericValue);
        return value;
      }
      return parseInt(numericValue, 10);
    }
    case 'float': {
      const numericValue = value.replace(/[^0-9]|^\./g, '');
      if (isNaN(numericValue)) {
        console.log('##### WE HAVE A NAN', value, numericValue);
        return value;
      }
      return parseFloat(numericValue, 10);
    }
    case 'relationship': {
      if (value.toLowercase() === 'unsplash') return null;
      const relationshipItems = value.split(',');
      if (relationshipItems.length > 1) {
      } else {
      }
    }
    case 'text':
    default: {
      return value;
    }
  }
}
function getFieldsAndTypes(data) {
  const lines = data.split('\n');
  const fieldsAndTypes = lines
    .shift()
    .split('\t')
    .map((token, i) => {
      const [fieldKey, type] = token.split(' ');
      const typeValue = type.replace(/\(|\)|(\r)/g, '');
      return {
        fieldKey,
        type: typeValue,
        index: i,
      };
    });
  const listItem = lines.map(line => {
    // for Each line
    // associate each column with the correct entity
    return line.split('\t').reduce((acc, curr, i) => {
      //   if (i >= fieldsAndTypes.length) {
      //     console.log('DO WE GET HERE?', i, curr, fieldsAndTypes);
      //     return acc;
      //   }
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
fs.writeFileSync(
  path.resolve(__dirname, 'products.json'),
  JSON.stringify(getFieldsAndTypes(data), null, 2)
);
