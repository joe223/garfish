#!/usr/bin/env zx
const execa = require('execa');
const waitOn = require('wait-on');
const killPort = require('kill-port');
const chalk = require('chalk');
const { $ } = require('zx');

const portMap = {
  'dev/main': {
    pkgName: '@garfish-dev/main',
    port: 2333,
  },
  'dev/react': {
    pkgName: '@garfish-dev/sub-react',
    port: 2444,
  },
  'dev/subApp': {
    pkgName: '@garfish-dev/sub-app',
    port: 2555,
  },
  'dev/vue': {
    pkgName: '@garfish-dev/sub-vue',
    port: 2666,
  },
  'dev/vue2': {
    pkgName: '@garfish-dev/sub-vue2',
    port: 2777,
  },
};

const ports = Object.keys(portMap).map((pkgPath) => portMap[pkgPath].port);

const opts = {
  resources: ports.map((port) => `http://localhost:${port}`),
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default if not provided
  },
};
const run = (command, opts = {}) => {
  command = command.split(' ');
  const bin = command.shift();
  const args = command;
  return execa(bin, args, { stdio: 'inherit', ...opts });
};

const step = (msg) => {
  console.log(chalk.cyan(msg));
};

function runAllExample() {
  // Usage with promises
  return (
    Promise.all(ports.map((port) => killPort(port)))
      // dev all example
      .then(() => {
        if (!process.env.CI_TEST_ENV) {
          step('\n run dev project...');
          return $`npx cross-env TEST_ENV=true pnpm start --filter "@garfish-dev/*"  --parallel`;
        }
      })
      // build all demo
      .then(() => {
        if (process.env.CI_TEST_ENV) {
          step('\n building dev project...');
          return $`pnpm run build --parallel --filter "@garfish-dev/*"`;
        }
      })
      // http-server all demo
      .then(() => {
        if (process.env.CI_TEST_ENV) {
          step('\n http-server dev dist...');
          Object.keys(portMap).forEach((pkgPath) => {
            // historyapifallback
            if (pkgPath === 'dev/main') {
              $`pnpm --filter ${portMap[pkgPath].pkgName} exec -- http-server ./dist --cors -p ${portMap[pkgPath].port} --proxy http://localhost:${portMap['dev/main'].port}?`;
            } else {
              $`pnpm --filter ${portMap[pkgPath].pkgName} exec -- http-server ./dist --cors -p ${portMap[pkgPath].port}`;
            }
          });
        }
      })
      .then(() => waitOn(opts))
      .catch(function (err) {
        console.error(err);
        ports.forEach((port) => killPort(port));
      })
  );
}

module.exports = {
  runAllExample,
  ports,
};