/** @jsx jsx */
import Link from 'next/link';
import { jsx, H3 } from '@keystone-ui/core';
import { NyanCat } from './NyanCat';
import { CompanyLogo } from './CompanyLogo';

export const CustomLogo = () => {
  return (
    <H3>
      <Link href="/" passHref>
        <a>
          <NyanCat />
          {/* <CompanyLogo /> */}
        </a>
      </Link>
    </H3>
  );
};
