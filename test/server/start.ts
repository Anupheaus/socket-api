import Koa from 'koa';
import { createLogger } from '../../src/common/logger';
import { BooksStore } from './controllers/BooksStore';
import { configureStaticFiles } from './static';
import { configureViews } from './views';
import readline from 'readline';
import 'tty';
import { createSocketApiServer } from '../../src/server';
import { createSSLServer } from '@anupheaus/ssl-server';
import path from 'path';
import { AuthorsStore } from './controllers';

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

const logger = createLogger('Test-Server');

function listenForStartAndStopSignals(start: () => Promise<void>, stop: () => Promise<void>): void {
  let isStarted = true;
  process.stdin.on('keypress', async (str, key) => {
    if (key.ctrl && key.name === 'c') {
      stop();
      process.exit();
    } else if (key.name === 's') {
      if (isStarted) {
        logger.info('Stopping server...');
        await stop();
        logger.info('Server stopped.');
        isStarted = false;
      } else {
        logger.info('Starting server...');
        await start();
        logger.info('Starting started.');
        isStarted = true;
      }
    }
  });
}

let lastEndingEntry: string | undefined;
const autoLog = (startingEntry: string, endingEntry?: string) => {
  logger.info(`${lastEndingEntry != null ? `${lastEndingEntry}, ` : ''}${startingEntry}...`);
  lastEndingEntry = endingEntry;
};

async function setup() {
  autoLog('Starting application', 'Application started');
  const app = new Koa();
  autoLog('configuring SSL', 'SSL configured');
  const { server, startServer, stopServer } = await createSSLServer({ callback: app.callback(), certsPath: path.resolve(__dirname, '../certs'), port: 3011, host: 'blinda.com', logger });
  autoLog('configuring sockets', 'Sockets configured');
  createSocketApiServer({ server, url: '/api/socket', controllers: [new BooksStore(), new AuthorsStore()] });
  autoLog('configuring static routes', 'Static routes configured');
  configureStaticFiles(app);
  autoLog('configuring views', 'Views configured');
  configureViews(app);
  autoLog('waiting for requests');
  startServer();
  listenForStartAndStopSignals(startServer, stopServer);
}

setup();