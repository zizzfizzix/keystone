/** @jsxRuntime classic */
/** @jsx jsx */

import { jsx, Stack, useTheme } from '@keystone-ui/core';
import { Button, buttonToneValues, ToneKey, buttonWeightValues } from '@keystone-ui/button';
import * as Icons from '@keystone-ui/icons';
import { Page } from '../../components/Page';

export default function ButtonPage() {
  const theme = useTheme();
  return (
    <Page>
      <h1>Icons</h1>
      <div
        css={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: theme.spacing.medium,
        }}
      >
        {Object.entries(Icons).map(([name, Icon]) => {
          return (
            <div
              css={{
                width: 180,
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div css={{ display: 'flex', justifyContent: 'center' }}>
                <Icon />
              </div>
              <div css={{ textAlign: 'center' }}>{name}</div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}
