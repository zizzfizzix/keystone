import { list } from '@keystone-6/core';
import {
  text,
} from '@keystone-6/core/fields';
import { componentThing } from '@keystone-6/fields-document';

import { prop as jsonProp } from './navigation';
import { Lists } from '.keystone/types';

export const lists: Lists = {
  Page: list({
    fields: {
      title: text({ validation: { isRequired: true } }),
      content: text({}),
    },
  }),
  Navigation: list({
    fields: {
      title: text({ validation: { isRequired: true } }),
      color: text({}),
      json: componentThing({
        prop: jsonProp,
        ui: { views: require.resolve('./navigation.tsx') },
      }),
    },
  }),
};
