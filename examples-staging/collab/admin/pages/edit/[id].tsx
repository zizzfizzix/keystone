import React, { useEffect, useMemo } from 'react';
import {
  createDocumentEditor,
  DocumentEditorEditable,
  DocumentEditorProvider,
} from '@keystone-6/fields-document/src/DocumentEditor';
import { useState } from 'react';
import { Toolbar } from '@keystone-6/fields-document/src/DocumentEditor/Toolbar';
import { Heading } from '@keystone-ui/core';
import { useKeyDownRef } from '@keystone-6/fields-document/src/DocumentEditor/soft-breaks';
import randomColor from 'randomcolor';
import { withYjs, SyncElement, withCursor, toSharedType } from 'slate-yjs';
import { WebsocketProvider } from 'y-websocket';

import * as Y from 'yjs';
import { PageContainer } from '@keystone-6/core/admin-ui/components';
import { useKeystone } from '@keystone-6/core/admin-ui/context';
import { useQuery, gql, useMutation } from '@keystone-6/core/admin-ui/apollo';
import { Link, useRouter } from '@keystone-6/core/admin-ui/router';
import { Button } from '@keystone-ui/button';
import { documentFeatures } from '../../../document-features';

const componentBlocks = {};
const relationships = {};

const toolbar = <Toolbar documentFeatures={documentFeatures} />;

export default function Doc() {
  const { authenticatedItem } = useKeystone();
  const id = useRouter().query.id as string;
  const { data, error, loading } = useQuery(
    gql`
      query ($id: ID!) {
        page(where: { id: $id }) {
          id
          title
          content {
            document
          }
        }
      }
    `,
    { variables: { id } }
  );
  const randomName = useMemo(() => Math.random().toString(36), []);
  return (
    <PageContainer header={<Heading type="h3">Edit {data?.page?.title ?? id}</Heading>}>
      {error ? (
        'Error...'
      ) : authenticatedItem.state === 'loading' || loading ? (
        'Loading...'
      ) : (
        <Editor
          name={authenticatedItem.state === 'authenticated' ? authenticatedItem.label : randomName}
          fromServer={
            data.page?.content?.document ?? [{ type: 'paragraph', children: [{ text: '' }] }]
          }
          id={id}
        />
      )}
    </PageContainer>
  );
}

function Editor({ name, fromServer, id }: { name: string; fromServer: any[]; id: string }) {
  const [val, setVal] = useState<any[]>([]);

  const isShiftPressedRef = useKeyDownRef('Shift');
  const [onlineState, setOnlineState] = useState(false);

  const [mutate, { loading, error }] = useMutation(gql`
    mutation ($id: ID!, $content: JSON!) {
      updatePage(where: { id: $id }, data: { content: $content }) {
        id
        content {
          document
        }
      }
    }
  `);

  const color = useMemo(
    () =>
      randomColor({
        luminosity: 'dark',
        format: 'rgba',
        alpha: 1,
      }),
    []
  );

  const { editor, provider, sharedType } = useMemo(() => {
    const baseEditor = createDocumentEditor(
      documentFeatures,
      componentBlocks,
      relationships,
      isShiftPressedRef
    );
    if (typeof WebSocket === 'undefined') {
      return { editor: baseEditor, provider: undefined!, sharedType: undefined! };
    }
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      process.env.NODE_ENV === 'production' ? 'wss://demos.yjs.dev' : 'ws://localhost:1234',
      `keystone-document-field-test-${id}`,
      doc,
      {
        connect: false,
      }
    );
    const sharedType = doc.getArray<SyncElement>('content');

    return {
      editor: withCursor(withYjs(baseEditor, sharedType), provider.awareness),
      provider,
      sharedType,
    };
  }, [isShiftPressedRef, id]);

  useEffect(() => {
    provider.on('status', ({ status }: { status: string }) => {
      setOnlineState(status === 'connected');
    });

    provider.awareness.setLocalState({
      alphaColor: color.slice(0, -2) + '0.2)',
      color,
      name,
    });

    // Super hacky way to provide a initial value from the client, if
    // you plan to use y-websocket in prod you probably should provide the
    // initial state from the server.
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && sharedType.length === 0) {
        toSharedType(sharedType, fromServer);
      }
    });

    provider.connect();

    return () => {
      provider.disconnect();
    };
  }, [provider, color, sharedType, name, fromServer]);
  return (
    <div>
      <div>{onlineState ? 'Online' : 'Offline'}</div>
      <Link href={`/view/${id}`}>View this page</Link>
      <DocumentEditorProvider
        componentBlocks={componentBlocks}
        documentFeatures={documentFeatures}
        relationships={relationships}
        editor={editor}
        value={val}
        onChange={value => {
          setVal(value);
        }}
      >
        {toolbar}
        <DocumentEditorEditable autoFocus />
      </DocumentEditorProvider>
      <Button
        isLoading={loading}
        onClick={() => {
          mutate({ variables: { id, content: val } });
        }}
      >
        Publish
      </Button>
      {!!error && <p>Error publishing...</p>}
    </div>
  );
}
