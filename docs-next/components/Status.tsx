/** @jsx jsx */
import { jsx } from '@keystone-ui/core';

// const colors = ['gray', 'pink', 'indigo', 'lightblue', 'emerald'];
const colors = ['gray', 'orange', 'pink', 'blue', 'green'];

const statusMap = {
  notStarted: {
    label: 'Not started',
    color: colors[0],
  },
  figuringItOut: {
    label: 'Figuring it out',
    color: colors[1],
  },
  theresAPlan: {
    label: 'There’s a plan',
    color: colors[2],
  },
  makingItHappen: {
    label: 'Making it happen',
    color: colors[3],
  },
  cleaningUp: {
    label: 'Cleaning up',
    color: colors[4],
  },
};

type StatusProps = {
  look: keyof typeof statusMap;
};
export function Status({ look }: StatusProps) {
  const status = statusMap[look];
  const styles = `
    rounded font-mono text-sm py-1 px-2
    bg-${status.color}-100
    text-${status.color}-700
  `;

  return <span className={styles}>{status.label}</span>;
}
