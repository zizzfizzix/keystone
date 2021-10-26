import { list } from '@keystone-next/keystone';
import {
  float,
  integer,
  json,
  image,
  relationship,
  text,
  select,
  checkbox,
} from '@keystone-next/keystone/fields';

import { document } from '@keystone-next/fields-document';
import { componentBlocks } from './component-blocks';

export const UserAddress = list({
  fields: {
    unitNumber: text(),
    streetNumber: text(),
    suburb: text(),
    postcode: text(),
    state: select({
      options: ['NSW', 'SA', 'VIC', 'ACT', 'NT', 'TAS', 'WA'],
    }),
    country: select({
      options: ['Australia'],
    }),
  },
});

export const Category = list({
  fields: {
    title: text(),
    summary: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    image: relationship({ ref: 'Image' }),
    products: relationship({ ref: 'Product.categories', many: true }),
    posts: relationship({ ref: 'Post.categories', many: true }),
    parent: relationship({ ref: 'Category' }),
    bundles: relationship({ ref: 'ProductBundle.category', many: true }),
  },
});

export const Image = list({
  fields: {
    image: image(),
    title: text(),
    description: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    altText: text(),
  },
});

export const Product = list({
  fields: {
    name: text({ isIndexed: 'unique', validation: { isRequired: true } }),
    status: select({
      options: ['in stock', 'out of stock'],
    }),
    price: float({ validation: { isRequired: true } }),
    stock: integer({ validation: { isRequired: true } }),
    discount: float(),
    description: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    featureImage: relationship({ ref: 'Image' }),
    categories: relationship({ ref: 'Category.products', many: true }),
    shippingZones: relationship({ ref: 'ShippingZone.products', many: true }),
    metaDescription: text(),
    metaImage: relationship({ ref: 'Image' }),
    metaTitle: text(),
    vendor: relationship({ ref: 'Brand.products' }),
    variants: relationship({ ref: 'ProductVariant.product', many: true }),
    bundles: relationship({ ref: 'ProductBundle.products', many: true }),
    relatedProducts: relationship({ ref: 'Product', many: true }),
    canonicalCategory: relationship({ ref: 'Category' }),
    sku: text({ isIndexed: 'unique' }),
    type: select({
      options: ['physical', 'digital'],
    }),
    reviews: relationship({
      ref: 'Review.product',
      many: true,
      ui: {
        displayMode: 'cards',
        cardFields: ['title', 'rating', 'reviewer'],
        inlineCreate: {
          fields: ['title', 'rating', 'reviewer', 'content'],
        },
        inlineConnect: true,
      },
    }),
  },
});

export const Brand = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    description: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    website: text(),
    products: relationship({ ref: 'Product.vendor', many: true }),
  },
});

export const ProductBundle = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    price: float(),
    status: select({ options: ['in stock', 'out of stock'] }),
    description: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    featureImage: relationship({ ref: 'Image' }),
    category: relationship({ ref: 'Category.bundles', many: true }),
    metaDescription: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    metaImage: relationship({ ref: 'Image' }),
    metaTitle: text(),
    sku: text({ isIndexed: 'unique' }),
    products: relationship({ ref: 'Product.bundles', many: true }),
  },
});

export const ProductVariant = list({
  fields: {
    name: text({
      isIndexed: 'unique',
      validation: { isRequired: true },
    }),
    description: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    photos: relationship({ ref: 'Image', many: true }),
    stock: integer(),
    product: relationship({ ref: 'Product.variants' }),
    sku: text({ isIndexed: 'unique', validation: { isRequired: true } }),
    productSpecs: json(), // component field NOT YET IMPLEMENTED
    length: text(),
    width: text(),
    depth: text(),
    weight: text(),
    downloadLink: text(),
    // displayIndex: order()  // NOT YET DESIGNED
  },
});

export const CartItem = list({
  fields: {
    quantity: integer(),
    productVariant: relationship({ ref: 'ProductVariant' }),
    customer: relationship({ ref: 'User.cart' }),
    price: float(),
  },
});

export const ShippingZone = list({
  fields: {
    title: text(),
    region: select({
      options: ['NSW', 'QLD', 'ACT', 'VIC', 'WA', 'SA', 'TAS', 'NT'],
    }),
    shippingMethods: relationship({
      ref: 'ShippingMethod.shippingZones',
      many: true,
    }),
    products: relationship({
      ref: 'Product.shippingZones',
      many: true,
    }),
  },
});

export const ShippingMethod = list({
  fields: {
    title: text(),
    enabled: checkbox(),
    shippingZones: relationship({
      ref: 'ShippingZone.shippingMethods',
      many: true,
    }),
    APIKey: text({ isIndexed: 'unique' }),
    // priority: order() // NOT YET IMPLEMENTED OR DESIGNED
  },
});

export const Post = list({
  fields: {
    title: text(),
    summary: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    featureImage: relationship({ ref: 'Image' }),
    metaTitle: text(),
    metaDescription: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    metaImage: relationship({ ref: 'Image' }),
    content: document({
      formatting: true,
      dividers: true,
      links: true,
      ui: {
        views: require.resolve('./component-blocks'),
      },
      relationships: {
        products: {
          kind: 'prop',
          listKey: 'Product',
          selection: `
            id 
            name 
            price
            featureImage {
              id
              image {
                id
                width 
                height 
                ref
                src
              }
              title
              altText
            }
          `,
          many: true,
        },
      },
      componentBlocks,
    }),
    author: relationship({ ref: 'User.posts' }),
    categories: relationship({ ref: 'Category.posts', many: true }),
    status: select({
      options: ['draft', 'published'],
    }),
  },
});

export const Page = list({
  fields: {
    title: text(),
    featureImage: relationship({ ref: 'Image' }),
    metaTitle: text(),
    metaDescription: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    metaImage: relationship({ ref: 'Image' }),
    content: document({
      formatting: true,
      dividers: true,
      links: true,
      ui: {
        views: require.resolve('./component-blocks'),
      },
      relationships: {
        products: {
          kind: 'prop',
          listKey: 'Product',
          selection: `
            id 
            name 
            price
            featureImage {
              id
              image {
                id
                width 
                height 
                ref
                src
              }
              title
              altText
            }
          `,
          many: true,
        },
      },
      componentBlocks,
    }),
    author: relationship({ ref: 'User.pages' }),
    status: select({
      options: ['draft', 'published'],
    }),
  },
});
