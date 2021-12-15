import { list } from '@keystone-6/core';
import { text, password } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';
import { documentFeaturesConfig } from './document-features';
import * as Keystone from '.keystone/types';

export const lists: Keystone.Lists = {
  User: list({
    ui: {
      listView: {
        initialColumns: ['name'],
      },
    },
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ isIndexed: 'unique', validation: { isRequired: true } }),
      password: password(),
    },
  }),
  Page: list({
    fields: {
      title: text(),
      content: document(documentFeaturesConfig),
    },
  }),
};
