import { GraphQLError } from 'graphql';
import { useMemo } from 'react';
import type { AuthenticatedItem, VisibleSchemaPpp, CreateViewFieldModes } from '../../types';
import { DocumentNode, useQuery, QueryResult, ServerError, ServerParseError } from '../apollo';
import { DeepNullable, makeDataGetter } from './dataGetter';

export type { AuthenticatedItem, VisibleSchemaPpp, CreateViewFieldModes };

export function useLazyMetadata(query: DocumentNode): {
  authenticatedItem: AuthenticatedItem;
  refetch: () => void;
  visibleSchemaPpp: VisibleSchemaPpp;
  createViewFieldModes: CreateViewFieldModes;
} {
  let result = useQuery(query, { errorPolicy: 'all', fetchPolicy: 'network-only' });
  return useMemo(() => {
    let refetch = () => {
      result.refetch();
    };
    let dataGetter = makeDataGetter<
      DeepNullable<{
        authenticatedItem:
          | {
              __typename: string;
              id: string;
              [key: string]: any;
            }
          | { __typename: string };
        keystone: {
          adminMeta: {
            lists: {
              key: string;
              isHidden: boolean;
              fields: { path: string; createView: { fieldMode: 'edit' | 'hidden' } }[];
            }[];
          };
        };
      }>
    >(result.data, result.error?.graphQLErrors);
    const authenticatedItemGetter = dataGetter.get('authenticatedItem');
    const keystoneMetaGetter = dataGetter.get('keystone');

    return {
      refetch,
      authenticatedItem: getAuthenticatedItem(
        result,
        authenticatedItemGetter.errors || (result.error?.networkError ?? undefined)
      ),
      visibleSchemaPpp: getVisibleSchemaPpp(
        result,
        keystoneMetaGetter.errors || (result.error?.networkError ?? undefined)
      ),
      createViewFieldModes: getCreateViewFieldModes(
        result,
        keystoneMetaGetter.errors || (result.error?.networkError ?? undefined)
      ),
    };
  }, [result]);
}

function getCreateViewFieldModes(
  { data }: QueryResult,
  error?: Error | ServerParseError | ServerError | readonly [GraphQLError, ...GraphQLError[]]
): CreateViewFieldModes {
  if (error) {
    return { state: 'error', error };
  }
  if (data) {
    const lists: Record<string, Record<string, 'edit' | 'hidden'>> = {};
    data.keystone.adminMeta.lists.forEach((list: any) => {
      lists[list.key] = {};
      list.fields.forEach((field: any) => {
        lists[list.key][field.path] = field.createView.fieldMode;
      });
    });
    return { state: 'loaded', schemaPpp: lists };
  }

  return { state: 'loading' };
}

function getVisibleSchemaPpp(
  { data }: QueryResult,
  error?: Error | ServerParseError | ServerError | readonly [GraphQLError, ...GraphQLError[]]
): VisibleSchemaPpp {
  if (error) {
    return { state: 'error', error };
  }
  if (data) {
    const lists = new Set<string>();
    data.keystone.adminMeta.lists.forEach((list: any) => {
      if (!list.isHidden) {
        lists.add(list.key);
      }
    });
    return { state: 'loaded', schemaPpp: lists };
  }

  return { state: 'loading' };
}

function getAuthenticatedItem(
  { data }: QueryResult,
  error?: Error | ServerParseError | ServerError | readonly [GraphQLError, ...GraphQLError[]]
): AuthenticatedItem {
  if (error) {
    return { state: 'error', error };
  }
  if (data) {
    if (
      !data.authenticatedItem ||
      // this is for the case where there is a new type
      // in the AuthenticatedItem union and the query
      // that the admin ui has doesn't get the id
      // (yes, undefined is very specific and very intentional, it should not be checking for null)
      data.authenticatedItem.id === undefined
    ) {
      return { state: 'unauthenticated' };
    }
    const labelField = Object.keys(data.authenticatedItem).filter(
      x => x !== '__typename' && x !== 'id'
    )[0];
    return {
      state: 'authenticated',
      id: data.authenticatedItem.id,
      label: data.authenticatedItem[labelField] || data.authenticatedItem.id,
      schemaCccKey: data.authenticatedItem.__typename,
    };
  }

  return { state: 'loading' };
}
