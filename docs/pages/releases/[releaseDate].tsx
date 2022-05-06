import {
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
  InferGetStaticPropsType,
} from 'next';
import React from 'react';
import { Octokit } from '@octokit/rest';
import { format, parseISO } from 'date-fns';

import fromMarkdown from 'mdast-util-from-markdown';
import gfm from 'micromark-extension-gfm';
// @ts-ignore
import * as x from 'mdast-util-gfm';
import toHast from 'mdast-util-to-hast';
import visit from 'unist-util-visit';
// @ts-ignore
import hastNodeToString from 'hast-util-to-string';

import { childrenToReact, Context } from 'react-markdown/lib/ast-to-react';
import { html } from 'property-information';
import { counter } from '@sindresorhus/slugify';
import { getStaticProps as markdownGetStaticProps } from '../../components/Markdown';
import { H1, HeadingWithId } from '../../components/docs/Heading';
import { DocsPage } from '../../components/Page';
import { CodeBlock, InlineCode } from '../../components/primitives/Code';

const context: Context = {
  listDepth: 0,
  schema: html,
  options: {
    components: {
      code: props => {
        if (props.inline) {
          return <InlineCode {...props} />;
        }
        return <CodeBlock children={(props.children as string[])[0]} className={props.className} />;
      },
      h1: props => <HeadingWithId as="h1" id={props.id!} {...props} />,
      h2: props => <HeadingWithId as="h2" id={props.id!} {...props} />,
      h3: props => <HeadingWithId as="h3" id={props.id!} {...props} />,
      h4: props => <HeadingWithId as="h4" id={props.id!} {...props} />,
      h5: props => <HeadingWithId as="h5" id={props.id!} {...props} />,
      h6: props => <HeadingWithId as="h6" id={props.id!} {...props} />,
    },
  },
};

export default function Release(props: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <DocsPage title={''} headings={[]} description={'description'} releases={props.releases}>
      <H1>{props.title}</H1>
      {childrenToReact(context, props.content)}
    </DocsPage>
  );
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const props = await markdownGetStaticProps();
  return {
    paths: props.props.releases.map(releaseDate => ({ params: { releaseDate } })),
    fallback: 'blocking',
  };
}

export async function getStaticProps({ params }: GetStaticPropsContext): Promise<
  GetStaticPropsResult<{
    title: string;
    releases: string[];
    content: import('hast').Root;
  }>
> {
  const octokit = new Octokit();
  const releases = await octokit.repos.listReleases({
    owner: 'keystonejs',
    repo: 'keystone',
  });

  const release = releases.data.find(
    x => x.tag_name === params!.releaseDate && !x.draft && !x.prerelease
  );

  if (release === undefined) {
    return {
      notFound: true,
    };
  }

  const mdast = fromMarkdown(release.body || '', {
    extensions: [gfm()],
    mdastExtensions: [x.fromMarkdown],
  });

  const hast: import('hast').Root = toHast(mdast) as any;

  const slugify = counter();
  visit<import('hast').Content>(hast, 'element', node => {
    if (
      node.type === 'element' &&
      node.tagName.length === 2 &&
      node.tagName[0] === 'h' &&
      node.properties &&
      !node.properties.id
    ) {
      node.properties.id = slugify(hastNodeToString(node));
    }
  });

  return {
    props: {
      title: `Release: ${format(new Date(parseISO(release.tag_name)), 'dd MMMM yyyy')}`,
      releases: releases.data.filter(x => !x.draft && !x.prerelease).map(x => x.tag_name),
      content: hast,
    },
  };
}
