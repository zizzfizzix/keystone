import { config } from '@keystone-6/core';
import { schema } from './schema';
import { extendGraphqlSchema } from './custom-schema';

export default config({
  db: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./keystone-example.db',
  },
  schema,
  extendGraphqlSchema,
});
