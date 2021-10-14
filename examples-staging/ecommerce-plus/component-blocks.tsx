/** @jsxRuntime classic */
/** @jsx jsx */
import { Fragment } from 'react';
import { jsx, H2, Stack } from '@keystone-ui/core';
import {
  component,
  fields,
} from '@keystone-next/fields-document/component-blocks';

function formatMoney(string: string) {
  return `$${string}`;
}
export const componentBlocks = {
  productGallery: component({
    component: ({ products }) => {
      console.log(products);
      return (
        <Stack
          contentEditable={false}
          across
          as="ul"
          gap="small"
          css={{
            paddingLeft: 0,
            '> li': {
              flex: '1 1 0',
              padding: '10px',
              minWidth: '200px',
              background: 'white',
              listStyle: 'none',
            },
          }}
        >
          {products.value &&
            (products.value as any[]).map((product: any) => {
              const { data } = product;
              return (
                <div key={data.id}>
                  <H2>{data.name}</H2>
                  <div
                    css={{
                      width: '100%',
                      background: 'gray',
                      height: '124px',
                      overflow: 'hidden',
                    }}
                  >
                    {data.featureImage ? (
                      <img
                        width={'100%'}
                        src={data.featureImage.image.src}
                        alt={data.featureImage.altText}
                      />
                    ) : null}
                  </div>
                  <span>price: {formatMoney(data.price)}</span>
                </div>
              );
            })}
        </Stack>
      );
    },
    label: 'Product Gallery',
    props: {
      products: fields.relationship({
        label: 'Product',
        relationship: 'products',
      }),
    },
  }),
};
