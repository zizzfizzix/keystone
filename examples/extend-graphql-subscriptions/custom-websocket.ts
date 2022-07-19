import http from 'http';
import { useServer as wsUseServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import { CreateRequestContext, KeystoneGraphQLAPI } from '@keystone-6/core/types';
import { TypeInfo } from '.keystone/types';

class Forbidden extends Error {}

async function handleAuth(
  request: http.IncomingMessage,
  createRequestContext: CreateRequestContext<TypeInfo>
) {
  // do your auth on every subscription connect
  const context = await createRequestContext(request);
  const { session } = context;
  console.log('session', session);
  // Block if the no session exists
  if (!session) {
    // throw a custom error to be handled
    throw new Forbidden(':(');
  }
}

export const extendHttpServer = (
  server: http.Server,
  createRequestContext: CreateRequestContext<TypeInfo>,
  graphqlSchema: KeystoneGraphQLAPI['schema']
) => {
  const wss = new WebSocketServer({
    server: server,
    path: '/api/graphql',
  });

  // The easy way without keytstone context and session
  wsUseServer(
    {
      schema: graphqlSchema,
      context: ctx => {
        // TODO: CreateRequestContext requires `req` and `res` but only `req` is available here.
        return createRequestContext(ctx.extra.request);
      },
      onConnect: async ctx => await handleAuth(ctx.extra.request, createRequestContext),
      onSubscribe: async ctx => await handleAuth(ctx.extra.request, createRequestContext),
    },
    wss
  );
};
