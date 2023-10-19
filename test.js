const SocketAPIPlugin = require('./SocketAPIPlugin');
const path = require('path');

const plugin = new SocketAPIPlugin({
  controllerRootPaths: [path.resolve(__dirname, './test/server/controllers')],
  generatedControllerTypesFileName: path.resolve(__dirname, './test/common/ControllerTypes.ts'),
});

plugin.apply({
  hooks: {
    beforeRun: {
      tap(name, fn) {
        fn();
      },
    },
  }
});
