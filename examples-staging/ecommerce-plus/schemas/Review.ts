import { list } from '@keystone-next/keystone';
import { text, select, relationship } from '@keystone-next/keystone/fields';
import { document } from '@keystone-next/fields-document';

export const Review = list({
  fields: {
    title: text({ validation: { isRequired: true } }),
    slug: text({ isIndexed: 'unique' }),
    rating: select({
      ui: {
        displayMode: 'segmented-control',
      },
      options: ['0', '1', '2', '3', '4', '5'],
    }),
    content: document({
      relationships: {
        ProductLink: {
          kind: 'inline',
          listKey: 'Product',
          label: 'Product Link',
          selection: 'id name',
        },
        ProductVariantLink: {
          kind: 'inline',
          listKey: 'ProductVariant',
          label: 'Product Variant Link',
          selection: 'id name',
        },
      },
      formatting: true,
      dividers: true,
      links: true,
    }),
    reviewer: relationship({
      ref: 'User.reviews',
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === 'create' && !resolvedData.reviewer) {
            return context?.session
              ? { connect: { id: context?.session?.itemId } }
              : null;
          }
          return resolvedData.reviewer;
        },
      },
    }),
    product: relationship({ ref: 'Product.reviews' }),
  },
});
