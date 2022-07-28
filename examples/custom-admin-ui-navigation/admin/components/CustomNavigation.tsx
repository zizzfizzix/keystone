import React from 'react';

import { ListNavItems, NavigationContainer, NavItem } from '@keystone-6/core/admin-ui/components';

import type { NavigationProps } from '@keystone-6/core/admin-ui/components';

export function CustomNavigation({ schemaPpp, authenticatedItem }: NavigationProps) {
  return (
    <NavigationContainer authenticatedItem={authenticatedItem}>
      <NavItem href="/">Dashboard</NavItem>
      <ListNavItems schemaPpp={schemaPpp} />
      <NavItem href="https://keystonejs.com">Keystone Docs</NavItem>
    </NavigationContainer>
  );
}
