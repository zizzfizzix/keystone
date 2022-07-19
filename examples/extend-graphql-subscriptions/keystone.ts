import { config } from '@keystone-6/core';
import { statelessSessions } from '@keystone-6/core/session';
import { createAuth } from '@keystone-6/auth';
import { lists } from './schema';
import { extendGraphqlSchema } from './custom-schema';
import { extendHttpServer } from './custom-websocket';

const { withAuth } = createAuth({
  listKey: 'Author',
  identityField: 'email',
  secretField: 'password',
  initFirstItem: {
    fields: ['name', 'email', 'password'],
  },
});

const session = statelessSessions({
  secret: '-- EXAMPLE COOKIE SECRET; CHANGE ME --',
  secure: true,
  sameSite: 'none',
});

export default withAuth(
  config({
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL || 'file:./keystone-example.db',
    },
    lists,
    session,
    server: {
      cors: { origin: ['https://studio.apollographql.com'], credentials: true },
      extendHttpServer,
    },
    extendGraphqlSchema,
  })
);
