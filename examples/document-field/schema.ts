import { list, graphql } from '@keystone-6/core';
import { select, relationship, text, timestamp, virtual } from '@keystone-6/core/fields';
import { document } from '@keystone-6/fields-document';
import { Text } from 'slate';
import escapeHtml from 'escape-html';

// serialize code was taken from https://docs.slatejs.org/concepts/10-serializing#html
const serialize = node => {
  if (Array.isArray(node)) {
    return node.map(n => serialize(n)).join('');
  }
  if (Text.isText(node)) {
    let string = escapeHtml(node.text);
    if (node.bold) {
      string = `<strong>${string}</strong>`;
    }
    return string;
  }

  const children = node.children.map(n => serialize(n)).join('');

  switch (node.type) {
    case 'quote':
      return `<blockquote><p>${children}</p></blockquote>`;
    case 'paragraph':
      console.log('in paragraph land');
      return `<p>${children}</p>`;
    case 'link':
      return `<a href="${escapeHtml(node.url)}">${children}</a>`;
    default:
      return children;
  }
};

export const lists = {
  Post: list({
    fields: {
      title: text({ validation: { isRequired: true } }),
      slug: text({ isIndexed: 'unique', validation: { isRequired: true } }),
      status: select({
        type: 'enum',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
      }),
      content: document({
        // We want to have support a fully featured document editor for our
        // authors, so we're enabling all of the formatting abilities and
        // providing 1, 2 or 3 column layouts.
        formatting: true,
        dividers: true,
        links: true,
        layouts: [
          [1, 1],
          [1, 1, 1],
        ],
        // We want to support twitter-style mentions in blogs, so we add an
        // inline relationship which references the `Author` list.
        relationships: {
          mention: {
            kind: 'inline',
            listKey: 'Author',
            label: 'Mention', // This will display in the Admin UI toolbar behind the `+` icon
            selection: 'id name', // These fields will be available to the renderer
          },
        },
        hooks: {
          afterOperation: async ({ operation, item, context }) => {
            if (operation !== 'delete' && item?.content) {
              await context.query.Post.updateOne({
                where: { id: item.id! },
                data: {
                  savedHtml: serialize(JSON.parse(item.content)),
                },
              });
            }
          },
        },
      }),
      savedHtml: text(),
      virtualHtml: virtual({
        field: graphql.field({
          type: graphql.String,
          async resolve(item) {
            if (item?.content) {
              return serialize(JSON.parse(item.content));
            } else {
              return '';
            }
          },
        }),
      }),
      publishDate: timestamp(),

      author: relationship({ ref: 'Author.posts', many: false }),
    },
  }),
  Author: list({
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ isIndexed: 'unique', validation: { isRequired: true } }),
      posts: relationship({ ref: 'Post.author', many: true }),
      bio: document({
        // We want to constrain the formatting in Author bios to a limited set of options.
        // We will allow bold, italics, unordered lists, and links.
        // See the document field guide for a complete list of configurable options
        formatting: {
          inlineMarks: {
            bold: true,
            italic: true,
          },
          listTypes: { unordered: true },
        },
        links: true,
      }),
    },
  }),
};
