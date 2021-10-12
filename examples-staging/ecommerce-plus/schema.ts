import { list } from '@keystone-next/keystone';
import {
  float,
  integer,
  image,
  password,
  relationship,
  text,
  select,
  checkbox,
} from '@keystone-next/keystone/fields';

// import { document } from '@keystone-next/fields-document';

export const User = list({
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    password: password(),
    role: relationship({ ref: 'Role.assignedTo' }),
    shippingAddress: relationship({ ref: 'UserAddress' }),
    billingAddress: relationship({ ref: 'UserAddress' }),
    pages: relationship({ ref: 'Page.author', many: true }),
    posts: relationship({ ref: 'Post.author', many: true }),
    orders: relationship({ ref: 'Order.customer' }),
    orderNotes: relationship({ ref: 'OrderNote.author', many: true }),
    reviews: relationship({ ref: 'Review.reviewer', many: true }),
    avatar: image(),
  },
});

export const Role = list({
  fields: {
    name: text(),
    assignedTo: relationship({ ref: 'User.role', many: true }),
  },
});

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
    products: relationship({ ref: 'Product.category', many: true }),
    posts: relationship({ ref: 'Post.category', many: true }),
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

export const Order = list({
  fields: {
    total: float(),
    customer: relationship({ ref: 'User.orders' }),
    items: relationship({ ref: 'OrderItem.order', many: true }),
    notes: relationship({ ref: 'OrderNote.order', many: true }),
    trackingNumber: text(),
  },
});

export const OrderNote = list({
  fields: {
    title: text(),
    note: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    author: relationship({ ref: 'User.orderNotes' }),
    order: relationship({ ref: 'Order.notes' }),
  },
});

export const OrderItem = list({
  fields: {
    name: text(),
    description: text(),
    price: float(),
    quantity: integer(),
    order: relationship({ ref: 'Order.items' }),
    photo: relationship({ ref: 'Image' }),
  },
});

export const Product = list({
  fields: {
    name: text(),
    status: select({
      options: ['in stock', 'out of stock'],
    }),
    price: float({ validation: { isRequired: true } }),
    stock: integer(),
    discount: float(),
    description: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    featureImage: relationship({ ref: 'Image' }),
    category: relationship({ ref: 'Category.products', many: true }),
    shippingZones: relationship({ ref: 'ShippingZone.products', many: true }),
    metaDescription: text(),
    metaImage: relationship({ ref: 'Image' }),
    metaTitle: text(),
    variants: relationship({ ref: 'ProductVariant.product' }),
    relatedProducts: relationship({ ref: 'Product', many: true }),
    canonicalCategory: relationship({ ref: 'Category' }),
    type: select({
      options: ['physical', 'digital'],
    }),
    reviews: relationship({ ref: 'Review.product', many: true }),
  },
});

export const ProductBundle = list({
  fields: {
    price: float(),
    status: select({ options: ['in stock', 'out of stock'] }),
    name: text(),
    description: text(),
    featureImage: relationship({ ref: 'Image' }),
    category: relationship({ ref: 'Category.bundles', many: true }),
    metaDescription: text(),
    metaImage: relationship({ ref: 'Image' }),
    metaTitle: text(),
    sku: text(),
    products: relationship({ ref: 'Product', many: true }),
  },
});

export const ProductVariant = list({
  fields: {
    name: text(),
    description: text(),
    photos: relationship({ ref: 'Image', many: true }),
    stock: integer(),
    product: relationship({ ref: 'Product.variants' }),
    // productSpecs: component() // NOT YET IMPLEMENTED
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
    customer: relationship({ ref: 'User' }),
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
    APIKey: text(),
    // priority: order() // NOT YET IMPLEMENTED OR DESIGNED
  },
});

export const Review = list({
  fields: {
    title: text(),
    rating: select({
      ui: {
        displayMode: 'segmented-control',
      },
      options: ['0', '1', '2', '3', '4', '5'],
    }),
    // content: document(),
    reviewer: relationship({ ref: 'User.reviews' }),
    product: relationship({ ref: 'Product.reviews' }),
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
    // content: document(),
    author: relationship({ ref: 'User.posts' }),
    category: relationship({ ref: 'Category.posts', many: true }),
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
    // content: document(),
    author: relationship({ ref: 'User.pages' }),
    status: select({
      options: ['draft', 'published'],
    }),
  },
});
