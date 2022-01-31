/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, useTheme } from '@keystone-ui/core';
import { ReactEditor, RenderElementProps, useSelected, useSlateStatic } from 'slate-react';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Element } from 'slate';
import { ReactNode } from 'react';
import { LayoutArea, LayoutContainer } from './layouts';
import { ComponentBlocksElement, ComponentInlineProp } from './component-blocks';
import { LinkElement } from './link';
import { HeadingElement } from './heading';
import { BlockquoteElement } from './blockquote';
import { RelationshipElement } from './relationship';

// some of the renderers read properties of the element
// and TS doesn't understand the type narrowing when doing a spread for some reason
// so that's why things aren't being spread in some cases

export const renderElement = (props: RenderElementProps) => {
  if (
    props.element.type === 'link' ||
    props.element.type === 'list-item-content' ||
    props.element.type === 'layout-area' ||
    props.element.type === 'component-inline-prop' ||
    props.element.type === 'component-block-prop'
  ) {
    return _renderElement(props);
  }
  return <DragDroppable {...props} />;
};

function Droppable({
  id,
  element,
  children,
}: {
  id: string;
  element: Element;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { element },
  });
  return (
    <div ref={setNodeRef}>
      <div css={{ position: 'relative' }}>
        <div
          contentEditable="false"
          style={{
            height: 4,
            backgroundColor: isOver ? 'lightblue' : undefined,
            width: '100%',
            userSelect: 'none',
            position: 'absolute',
          }}
        />
      </div>
      {children}
    </div>
  );
}

const dragIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <g fill="#939393">
      <circle cy="6" cx="6" r="2" />
      <circle cy="6" cx="12" r="2" />
      <circle cy="12" cx="6" r="2" />
      <circle cy="12" cx="12" r="2" />
      <circle cy="18" cx="6" r="2" />
      <circle cy="18" cx="12" r="2" />
    </g>
  </svg>
);

function DragDroppable(props: RenderElementProps) {
  const inner = _renderElement(props);
  const editor = useSlateStatic();
  const key = ReactEditor.findKey(editor, props.element);

  const id = key.id;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: { element: props.element },
  });

  return (
    <Droppable id={id} element={props.element}>
      <div
        css={{ position: 'relative', '&:hover > .drag': { opacity: 1 } }}
        style={
          transform
            ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
            : undefined
        }
      >
        <button
          contentEditable="false"
          css={{
            position: 'absolute',
            left: -20,
            top: 0,
            background: 'transparent',
            padding: 0,
            userSelect: 'none',
            opacity: 0,
            transition: 'opacity 250ms',
          }}
          className="drag"
          ref={setNodeRef}
          {...listeners}
          {...attributes}
        >
          {dragIcon}
        </button>
        {inner}
      </div>
    </Droppable>
  );
}

export function EndDroppable(props: { children: ReactNode; element: Element | Editor }) {
  const editor = useSlateStatic();
  const key =
    editor === props.element ? { id: 'editor' } : ReactEditor.findKey(editor, props.element);
  const { isOver, setNodeRef } = useDroppable({
    id: `${key.id}-end`,
    data: { element: props.element, isEnd: true },
  });
  return (
    <div>
      {props.children}
      <div
        ref={setNodeRef}
        contentEditable="false"
        style={{
          height: 4,
          backgroundColor: isOver ? 'lightgray' : undefined,
          width: '100%',
          userSelect: 'none',
        }}
      />
    </div>
  );
}

const _renderElement = (props: RenderElementProps) => {
  switch (props.element.type) {
    case 'layout':
      return (
        <LayoutContainer
          attributes={props.attributes}
          children={props.children}
          element={props.element}
        />
      );
    case 'layout-area':
      return (
        <EndDroppable element={props.element}>
          <LayoutArea {...props} />
        </EndDroppable>
      );
    case 'code':
      return <CodeElement {...props} />;
    case 'component-block': {
      return (
        <ComponentBlocksElement
          attributes={props.attributes}
          children={props.children}
          element={props.element}
        />
      );
    }
    case 'component-inline-prop': {
      return <ComponentInlineProp {...props} />;
    }
    case 'component-block-prop': {
      return (
        <EndDroppable element={props.element}>
          <ComponentInlineProp {...props} />
        </EndDroppable>
      );
    }
    case 'heading':
      return (
        <HeadingElement
          attributes={props.attributes}
          children={props.children}
          element={props.element}
        />
      );
    case 'link':
      return (
        <LinkElement
          attributes={props.attributes}
          children={props.children}
          element={props.element}
        />
      );
    case 'ordered-list':
      return <ol {...props.attributes}>{props.children}</ol>;
    case 'unordered-list':
      return <ul {...props.attributes}>{props.children}</ul>;
    case 'list-item':
      return <li {...props.attributes}>{props.children}</li>;
    case 'list-item-content':
      return <span {...props.attributes}>{props.children}</span>;
    case 'blockquote':
      return (
        <EndDroppable element={props.element}>
          <BlockquoteElement {...props} />
        </EndDroppable>
      );
    case 'relationship':
      return (
        <RelationshipElement
          attributes={props.attributes}
          children={props.children}
          element={props.element}
        />
      );
    case 'divider':
      return <DividerElement {...props} />;
    default:
      return (
        <p css={{ textAlign: props.element.textAlign }} {...props.attributes}>
          {props.children}
        </p>
      );
  }
};

/* Block Elements */

const CodeElement = ({ attributes, children }: RenderElementProps) => {
  const { colors, radii, spacing, typography } = useTheme();
  return (
    <pre
      spellCheck="false"
      css={{
        backgroundColor: colors.backgroundDim,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.xsmall,
        fontFamily: typography.fontFamily.monospace,
        fontSize: typography.fontSize.small,
        padding: `${spacing.small}px ${spacing.medium}px`,
      }}
      {...attributes}
    >
      <code css={{ fontFamily: 'inherit' }}>{children}</code>
    </pre>
  );
};

const DividerElement = ({ attributes, children }: RenderElementProps) => {
  const { colors, spacing } = useTheme();
  const selected = useSelected();
  return (
    <div
      {...attributes}
      css={{
        paddingBottom: spacing.medium,
        paddingTop: spacing.medium,
        marginBottom: spacing.medium,
        marginTop: spacing.medium,
        caretColor: 'transparent',
      }}
    >
      <hr
        css={{
          backgroundColor: selected ? colors.linkColor : colors.border,
          border: 0,
          height: 2,
        }}
      />
      {children}
    </div>
  );
};
