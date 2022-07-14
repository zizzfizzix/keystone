import { graphql, graphQLSchemaExtension } from '@keystone-6/core';
import { GraphQLSchema } from 'graphql';
import { PubSub } from 'graphql-subscriptions';

declare global {
  var graphqlSubscriptionPubSub: PubSub;
}

const pubsub = global.graphqlSubscriptionPubSub || new PubSub();

if (process.env.NODE_ENV !== 'production') globalThis.graphqlSubscriptionPubSub = pubsub;

// TODO: use graphql-ts for this

export const extendGraphqlSchema = (schema: GraphQLSchema) => {
  const withSubscription = graphQLSchemaExtension({
    typeDefs: `
      type Mutation {
        """ Publish a post """
        publishPost(id: ID!): Post
      }

      type PostFeed {
        id: ID!
        publishDate: String!
      }
		  type Subscription {
			  postPublished: PostFeed
		  }`,

    resolvers: {
      Mutation: {
        publishPost: async (root, { id }, context) => {
          // Note we use `context.db.Post` here as we have a return type
          // of Post, and this API provides results in the correct format.
          // If you accidentally use `context.query.Post` here you can expect problems
          // when accessing the fields in your GraphQL client.
          const publishDate = new Date().toISOString();
          const post = context.db.Post.updateOne({
            where: { id },
            data: { status: 'published', publishDate },
          });
          pubsub.publish('POST_PUBLISHED', {
            postPublished: post,
          });
          return post;
        },
      },
      Subscription: {
        postPublished: {
          subscribe: () => pubsub.asyncIterator(['POST_PUBLISHED']),
        },
      },
    },
  })(schema);

  return withSubscription;
};
