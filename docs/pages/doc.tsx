import React from 'react';
import { DocumentEditor } from '@keystone-6/fields-document/src/DocumentEditor';
import { useState } from 'react';
import { defaultDocumentFeatures } from '../components/docs/DocumentEditorDemo';

const empty = {};

export default function Doc() {
  const [val, setVal] = useState<any[]>([]);
  return (
    <DocumentEditor
      autoFocus
      componentBlocks={empty}
      documentFeatures={defaultDocumentFeatures}
      onChange={val => {
        setVal(val);
      }}
      value={val}
      relationships={empty}
    />
  );
}
