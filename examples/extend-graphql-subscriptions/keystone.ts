import { Server } from 'http';
import { config } from '@keystone-6/core';
import { BaseKeystoneTypeInfo, CreateRequestContext } from '@keystone-6/core/types';
import { WebSocketServer } from 'ws';
import { useServer as wsUseServer } from 'graphql-ws/lib/use/ws';
import { GraphQLSchema } from 'graphql';
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
    extendHttpServer: (
      server: Server,
      createContext: CreateRequestContext<BaseKeystoneTypeInfo>,
      graphqlSchema: GraphQLSchema
    ) => {
      const wss = new WebSocketServer({
        server: server,
        path: '/api/graphql',
      });

      const wsServer = wsUseServer({ schema: graphqlSchema }, wss);
      return {
        async drainServer() {
          await wsServer.dispose();
        },
      };
    },
  },
  extendGraphqlSchema,
});
