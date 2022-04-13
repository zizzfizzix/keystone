/** @jsxRuntime classic */
/** @jsx jsx */

import {
  fields,
} from '@keystone-6/fields-document/component-blocks';

export const prop = fields.array(
  fields.object({
    title: fields.text({ label: 'Display Name' }),
    type: fields.conditional(
      fields.select({
        defaultValue: 'Page',
        label: 'Type',
        options: [
          { label: 'Page', value: 'page' },
          { label: 'URL', value: 'url' },
        ]
      }),
      {
        url: fields.url({ label: 'URL' }),
        page: fields.relationship({
          label: 'Page',
          listKey: 'Page',
          many: false,
        }),
      }
    ),
  }),
);
