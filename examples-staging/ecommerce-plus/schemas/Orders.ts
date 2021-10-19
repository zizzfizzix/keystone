import { list } from '@keystone-next/keystone';
import {
  float,
  integer,
  relationship,
  text,
} from '@keystone-next/keystone/fields';
import { permissions, rules, isSignedIn } from '../access';
// By default I should only be able to create Orders and see my own orders
// I can not edit my order once it's been created.
// As an admin I can edit ALL orders
export const Order = list({
  access: {
    operation: {
      create: isSignedIn,
      delete: permissions.canManageOrders,
    },
    filter: {
      query: rules.canManageOrders,
      update: rules.canManageOrders,
    },
  },
  ui: {
    hideDelete: args => !permissions.canManageOrders(args),
    itemView: {
      defaultFieldMode: args =>
        permissions.canManageOrders(args) ? 'edit' : 'read',
    },
  },
  fields: {
    total: float(),
    customer: relationship({ ref: 'User.orders' }),
    items: relationship({ ref: 'OrderItem.order', many: true }),
    notes: relationship({ ref: 'OrderNote.order', many: true }),
    trackingNumber: text(),
  },
});

export const OrderNote = list({
  access: {
    operation: {
      create: isSignedIn,
    },
  },
  fields: {
    title: text({ validation: { isRequired: true } }),
    note: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    author: relationship({
      ref: 'User.orderNotes',
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === 'create' && !resolvedData.author) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.author;
        },
      },
    }),
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
