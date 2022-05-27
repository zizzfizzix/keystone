// loosely based on
import { Descendant, Element, Text } from 'slate';

function hasDifferentChildNodes(descendants: Descendant[]): boolean {
  for (let index = 1; index < descendants.length; index++) {
    if (isInline(descendants[index]) !== isInline(descendants[index - 1])) {
      return true;
    }
  }
  return false;
}

function isInline(node: Descendant): node is Text | (Element & { type: 'link' | 'relationship' }) {
  return Text.isText(node) || node.type === 'link' || node.type === 'relationship';
}

function normalizeDifferentNodeTypes(descendants: Descendant[]): Descendant[] {
  const hasDifferentNodes = hasDifferentChildNodes(descendants);
  if (!hasDifferentNodes) {
    return descendants;
  }
  const fragment: Element[] = [
    isInline(descendants[0]) ? { type: 'paragraph', children: [descendants[0]] } : descendants[0],
  ];
  for (const node of descendants.slice(1)) {
    if (isInline(node)) {
      fragment[fragment.length - 1].children.push(node);
    } else {
      fragment.push(node);
    }
  }
  return fragment;
}

export function normalize(descendants: Descendant[]): Descendant[] {
  if (!descendants.length) {
    return [{ text: '' }];
  }
  descendants = normalizeDifferentNodeTypes(descendants);

  descendants = descendants.map(node => {
    if (Element.isElement(node)) {
      return {
        ...node,
        children: normalize(node.children),
      };
    }
    return node;
  });

  return descendants;
}
