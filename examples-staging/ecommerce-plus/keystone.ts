import { config } from '@keystone-next/keystone';
import { statelessSessions } from '@keystone-next/keystone/session';
import { createAuth } from '@keystone-next/auth';
// import { KeystoneContext } from './keystone/types';
import {
  Category,
  Image,
  UserAddress,
  Post,
  Page,
  Product,
  ProductBundle,
  ProductVariant,
  CartItem,
  ShippingMethod,
  ShippingZone,
  Role,
} from './schema';

import { User } from './schemas/User';
import { Review } from './schemas/Review';
import { Order, OrderNote, OrderItem } from './schemas/Orders';
import { insertSeedData } from './seed-data';

const sessionConfig = {
  maxAge: 60 * 60 * 24 * 360,
  secret:
    process.env.COOKIE_SECRET || 'this secret should only be used in testing',
};

const { withAuth } = createAuth({
  identityField: 'email',
  secretField: 'password',
  listKey: 'User',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
    itemData: {
      role: {
        create: {
          name: 'Admin',
          canManageOwnPosts: true,
          canManagePosts: true,
          canManageOwnProducts: true,
          canManageProducts: true,
          canManageOrders: true,
          canManageRoles: true,
          canManageUsers: true,
        },
      },
    },
  },
  sessionData: `
    id
    name 
    role {
      id
      name
      canManageOwnPosts
      canManagePosts
      canManageOwnProducts
      canManageProducts
      canManageOrders
      canManageRoles
      canManageUsers
    }`,
});

const isSignedIn = ({ session }: any) => !!session?.data;

export default withAuth(
  config({
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL || 'file:./keystone-example.db',
      async onConnect(context) {
        if (process.argv.includes('--seed-data')) {
          await insertSeedData(context);
        }
      },
    },
    images: {
      upload: 'local',
      local: {
        storagePath: 'public/images',
        baseUrl: '/images',
      },
    },
    lists: {
      Category,
      User,
      UserAddress,
      Order,
      OrderItem,
      OrderNote,
      Role,
      Image,
      Post,
      Page,
      Product,
      ProductBundle,
      ProductVariant,
      Review,
      CartItem,
      ShippingZone,
      ShippingMethod,
    },
    ui: {
      isAccessAllowed: isSignedIn,
    },
    session: statelessSessions(sessionConfig),
  })
);
