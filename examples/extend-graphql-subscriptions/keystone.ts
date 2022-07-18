import { config } from '@keystone-6/core';
import { WebSocketServer } from 'ws';
import { useServer as wsUseServer } from 'graphql-ws/lib/use/ws';
import { lists } from './schema';
import { extendGraphqlSchema } from './custom-schema';

export default config({
  db: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./keystone-example.db',
  },
  lists,
  server: {
    cors: { origin: ['https://studio.apollographql.com'], credentials: true },
    extendHttpServer: (server, createRequestContext, graphqlSchema) => {
      const wss = new WebSocketServer({
        server: server,
        path: '/api/graphql',
      });

      wsUseServer({ schema: graphqlSchema }, wss);
    },
  },
  extendGraphqlSchema,
});
