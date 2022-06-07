import { list, config } from '@keystone-6/core';
import { text } from '@keystone-6/core/fields';
import { dbConfig } from '../utils';

export const lists = {
  Thing: list({
    fields: {
      label: text(),
    },
  }),
};

export default config({
  db: dbConfig,
  lists,
  server: {
    extendExpressApp(app) {
      app.use('/api/graphql', async (req, res, next) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        next();
      });
    },
  },
});
