import { normaliseDocumentFeatures } from '@keystone-6/fields-document/document-features';

export const documentFeaturesConfig = {
  formatting: true,
  layouts: [
    [1, 1],
    [1, 1, 1],
    [2, 1],
    [1, 2],
    [1, 2, 1],
  ],
  links: true,
  dividers: true,
} as const;

export const documentFeatures = normaliseDocumentFeatures(documentFeaturesConfig);
