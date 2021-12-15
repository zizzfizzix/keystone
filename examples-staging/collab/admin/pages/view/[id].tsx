import React from 'react';
import { Heading } from '@keystone-ui/core';
import { PageContainer } from '@keystone-6/core/admin-ui/components';
import { useQuery, gql } from '@keystone-6/core/admin-ui/apollo';
import { DocumentRenderer } from '@keystone-6/document-renderer';
import { Link, useRouter } from '@keystone-6/core/admin-ui/router';

export default function Doc() {
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

  return (
    <PageContainer header={<Heading type="h3">View {data?.page?.title ?? id}</Heading>}>
      <Link href={`/edit/${id}`}>Edit this page</Link>
      {error ? (
        'Error...'
      ) : loading ? (
        'Loading...'
      ) : (
        <DocumentRenderer document={data.page?.content?.document ?? []} />
      )}
    </PageContainer>
  );
}
