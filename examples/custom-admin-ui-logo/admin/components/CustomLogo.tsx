/** @jsx jsx */
import Link from 'next/link';
import { NyanCat } from './NyanCat';
// import { CompanyLogo } from './CompanyLogo';
import { jsx, H3 } from '@keystone-ui/core';

export const CustomLogo = () => {
  return (
    <H3>
      <Link href="/" passHref>
        <a>
          {/* <CompanyLogo /> */}
          <NyanCat />
        </a>
      </Link>
    </H3>
  );
};
