import { Editor, Transforms, Range } from 'slate';
import { isValidURL } from '../isValidURL';
import { deserializeHTML } from './html';
import { deserializeMarkdown } from './markdown';

const urlPattern = /^https?:\/\/[^\s]+/;

export function withPasting(editor: Editor): Editor {
  const { insertData, setFragmentData } = editor;

  editor.setFragmentData = data => {
    if (editor.selection) {
      data.setData('application/x-keystone-document-editor', 'true');
    }
    setFragmentData(data);
  };

  editor.insertData = data => {
    const plain = data.getData('text/plain');
    const blockAbove = Editor.above(editor, { match: node => Editor.isBlock(editor, node) });
    if (blockAbove?.[0].type === 'code') {
      editor.insertText(plain);
      return;
    }
    let vsCodeEditorData = data.getData('vscode-editor-data');
    if (vsCodeEditorData && plain) {
      try {
        const vsCodeData = JSON.parse(vsCodeEditorData);
        if (vsCodeData?.mode === 'markdown' || vsCodeData?.mode === 'mdx') {
          const fragment = deserializeMarkdown(plain);
          Transforms.insertFragment(editor, fragment);
          return;
        }
      } catch (err) {
        console.log(err);
      }
    }

    if (
      // isValidURL is a bit more permissive than a user might expect
      // so for pasting, we'll constrain it to starting with https:// or http://
      urlPattern.test(plain) &&
      isValidURL(plain) &&
      editor.selection &&
      !Range.isCollapsed(editor.selection) &&
      // we only want to turn the selected text into a link if the selection is within the same block
      Editor.above(editor, {
        match: node => Editor.isBlock(editor, node) && !Editor.isBlock(editor, node.children[0]),
      }) &&
      // and there is only text(potentially with marks) in the selection
      // no other links or inline relationships
      Editor.nodes(editor, {
        match: node => Editor.isInline(editor, node),
      }).next().done
    ) {
      Transforms.wrapNodes(editor, { type: 'link', href: plain, children: [] }, { split: true });
      return;
    }

    // this exists because behind the scenes, Slate sets the slate document
    // on the data transfer, this is great because it means when you copy and paste
    // something in the editor or between editors, it'll use the actual Slate data
    // rather than the serialized html so component blocks and etc. will work fine
    // we're setting application/x-keystone-document-editor
    // though so that we only accept slate data from Keystone's editor
    // because other editors will likely have a different structure
    // so we'll rely on the html deserialization instead
    // (note that yes, we do call insertData at the end of this function
    // which is where Slate's logic will run, it'll never do anything there though
    // since anything that will have slate data will also have text/html which we handle
    // before we call insertData)
    // TODO: handle the case of copying between editors with different components blocks
    // (right now, things will blow up in most cases)
    if (data.getData('application/x-keystone-document-editor') === 'true') {
      insertData(data);
      return;
    }

    const html = data.getData('text/html');
    if (html) {
      const fragment = deserializeHTML(html);
      try {
        Transforms.insertFragment(editor, fragment);
      } catch (err) {
        console.dir(fragment, { depth: null });
        throw err;
      }
      return;
    }

    if (plain) {
      const fragment = deserializeMarkdown(plain);
      Transforms.insertFragment(editor, fragment);

      return;
    }

    insertData(data);
  };

  return editor;
}
