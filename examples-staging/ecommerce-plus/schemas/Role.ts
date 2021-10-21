import { list } from '@keystone-next/keystone';
import { text, checkbox, relationship } from '@keystone-next/keystone/fields';
import { permissions } from '../access';

export const Role = list({
  access: {
    operation: {
      create: permissions.canManageRoles,
      delete: permissions.canManageRoles,
    },
  },
  ui: {
    hideCreate: args => !permissions.canManageRoles(args),
    hideDelete: args => !permissions.canManageRoles(args),
    itemView: {
      defaultFieldMode: args =>
        permissions.canManageRoles(args) ? 'edit' : 'read',
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
    }),
    canManageOwnPosts: checkbox({ defaultValue: false }),
    canManagePosts: checkbox({ defaultValue: false }),
    canManageOwnProducts: checkbox({ defaultValue: false }),
    canManageProducts: checkbox({ defaultValue: false }),
    canManageOrders: checkbox({ defaultValue: false }),
    canManageRoles: checkbox({ defaultValue: false }),
    canManageUsers: checkbox({ defaultValue: false }),
    assignedTo: relationship({ ref: 'User.role', many: true }),
  },
});
