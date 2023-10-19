const InjectPlugin = require('webpack-inject-plugin').default;
const ws = require('ws');

module.exports = class HotReloadPlugin {
  constructor(config) {
    this.#config = { port: 3090, ...config };
    this.#clients = new Set();
    this.#startListener();

  }

  #config = null;
  #clients = null;

  /** @type WebSocket */
  #socket = null;

  #createClientCode() {
    const { port } = this.#config;
    return () => `
      let connectToHotReloadPluginTimerId;
      function connectToHotReloadPlugin() {
        const ws=new WebSocket('ws://localhost:${port}');        
        ws.onerror = () => ws.close();
        ws.onmessage = () => location.reload();
        ws.onclose = () => { connectToHotReloadPluginTimerId = setTimeout(connectToHotReloadPlugin, 10000); };
        ws.onopen = () => clearInterval(connectToHotReloadPluginTimerId);
      }
      connectToHotReloadPlugin();
    `;
  }

  #startListener() {
    const { port } = this.#config;
    this.#socket = new ws.Server({ port });
    this.#socket.on('connection', client => {
      this.#clients.add(client);
      client.on('close', () => this.#clients.delete(client));
    });
  }

  apply(compiler) {
    new InjectPlugin(this.#createClientCode()).apply(compiler);
    compiler.hooks.afterEmit.tap('HotReloadPlugin', () => {
      this.#clients.forEach(client => client.send('reload'));
    });
  }

};
