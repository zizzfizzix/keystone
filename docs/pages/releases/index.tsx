import { GetStaticPropsResult, InferGetStaticPropsType } from 'next';
import React from 'react';
import { Octokit } from '@octokit/rest';
import { format, parseISO } from 'date-fns';

import fromMarkdown from 'mdast-util-from-markdown';
import gfm from 'micromark-extension-gfm';
// @ts-ignore
import * as mdastGfm from 'mdast-util-gfm';
import toHast from 'mdast-util-to-hast';

import { childrenToReact, Context } from 'react-markdown/lib/ast-to-react';
import { html } from 'property-information';
import Link from 'next/link';
import { H1, H2, HeadingWithId } from '../../components/docs/Heading';
import { DocsPage } from '../../components/Page';
import { CodeBlock, InlineCode } from '../../components/primitives/Code';
import { Status } from '../../components/primitives/Status';

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

export default function Releases(props: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <DocsPage
      title="Release Notes"
      description="A complete timeline of KeystoneJS releases."
      releases={props.releases.map(x => x.date)}
    >
      <H1>Release Notes</H1>
      {props.releases.map((release, i) => (
        <div key={release.date}>
          <H2>{format(parseISO(release.date), 'do LLLL yyyy')}</H2>
          {i === 0 && <Status look="latestRelease" />}
          {childrenToReact(context, { type: 'root', children: [release.description] })}
          <Link href={`/releases/${release.date}`}>
            <a>Read More</a>
          </Link>
        </div>
      ))}
    </DocsPage>
  );
}

export async function getStaticProps(): Promise<
  GetStaticPropsResult<{
    releases: { date: string; description: import('hast').Content }[];
  }>
> {
  const octokit = new Octokit();
  const releases = await octokit.repos.listReleases({
    owner: 'keystonejs',
    repo: 'keystone',
  });

  return {
    props: {
      releases: releases.data
        .filter(x => !x.prerelease && !x.draft)
        .map(release => {
          const mdast = fromMarkdown(release.body || '', {
            extensions: [gfm()],
            mdastExtensions: [mdastGfm.fromMarkdown],
          });

          const description = toHast(mdast.children[0]) as import('hast').Content;
          return {
            description,
            date: release.tag_name,
          };
        }),
    },
  };
}
