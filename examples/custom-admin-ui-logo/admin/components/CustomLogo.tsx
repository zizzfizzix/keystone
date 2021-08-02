/** @jsx jsx */
import Link from 'next/link';
import nyancat from './nyancat.svg';
import { jsx, H3 } from '@keystone-ui/core';

export const CustomLogo = () => {
  return (
    <H3>
      <Link href="/" passHref>
        <a>
          <img src={nyancat} alt="" />
          {/* LegendBoulder After */}
        </a>
      </Link>
    </H3>
  );
};
