import meow from 'meow';
import { ExitError } from './utils';

const commands = {
  dev: () => import('./run/dev').then(x => x.dev),
  start: () => import('./run/start').then(x => x.start),
  build: () => import('./build/build').then(x => x.build),
  prisma: () => import('./prisma').then(x => x.prisma),
  postinstall: () => import('./postinstall').then(x => x.postinstall),
};

export async function cli(cwd: string, argv: string[]) {
  const { input, help, flags } = meow(
    `
    Usage
      $ keystone [command]
    Commands
        dev           start the project in development mode (default)
        postinstall   generate client APIs and types (optional)
        build         build the project (must be done before using start)
        start         start the project in production mode
        prisma        run Prisma CLI commands safely
    `,
    {
      flags: {
        fix: { default: false, type: 'boolean' },
        resetDb: { default: false, type: 'boolean' },
      },
      argv,
    }
  );
  const command = input[0] || 'dev';
  if (!isCommand(command)) {
    console.log(`${command} is not a command that keystone accepts`);
    console.log(help);
    throw new ExitError(1);
  }

  if (command === 'prisma') {
    return (await commands.prisma())(cwd, argv.slice(1));
  } else if (command === 'postinstall') {
    return (await commands.postinstall())(cwd, flags.fix);
  } else if (command === 'dev') {
    return (await commands.dev())(cwd, flags.resetDb);
  } else {
    return (await commands[command]())(cwd);
  }
}

function isCommand(command: string): command is keyof typeof commands {
  return command in commands;
}
