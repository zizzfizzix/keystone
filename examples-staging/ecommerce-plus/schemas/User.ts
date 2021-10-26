import { list } from '@keystone-next/keystone';
import {
  text,
  password,
  relationship,
  image,
} from '@keystone-next/keystone/fields';
import { isSignedIn, permissions, rules } from '../access';
/**
 * I should not be able to view other users if I'm not an admin
 */
export const User = list({
  access: {
    operation: {
      create: isSignedIn,
      delete: permissions.canManageUsers,
    },
    filter: {
      query: rules.canManageUsers,
      update: rules.canManageUsers,
    },
  },
  ui: {
    hideCreate: args => !permissions.canManageUsers(args),
    hideDelete: args => !permissions.canManageUsers(args),
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
    password: password({
      validation: { isRequired: true },
      access: {
        update: ({ session, item }) => {
          return (
            permissions.canManageUsers({ session }) ||
            session.itemId === item.id
          );
        },
      },
    }),
    cart: relationship({ ref: 'CartItem.customer', many: true }),
    role: relationship({
      ref: 'Role.assignedTo',
      access: {
        create: permissions.canManageRoles,
        update: permissions.canManageRoles,
      },
      ui: {
        itemView: {
          fieldMode: args =>
            permissions.canManageUsers(args) ? 'edit' : 'read',
        },
      },
    }),
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
