import { createServer, Server } from 'https';
import Koa from 'koa';
import { Duplex } from 'stream';
import { Cert } from 'selfsigned-ca';

const serverCert = new Cert('./certs/server');

export async function configureSSL(app: Koa): Promise<[Server, () => Promise<void>, () => Promise<void>]> {
  await serverCert.load();

  const server = createServer({
    key: serverCert.key,
    cert: serverCert.cert,
    ca: serverCert.caCert,
    rejectUnauthorized: false,
    requestCert: false,
  }, app.callback());
  const allConnections = new Set<Duplex>();
  server.on('connection', connection => {
    allConnections.add(connection);
    connection.on('close', () => allConnections.delete(connection));
  });
  return [server,
    () => new Promise(resolve => server.listen(3011, resolve)),
    () => new Promise((resolve, reject) => {
      allConnections.forEach(connection => connection.destroy());
      server.close(error => {
        if (error) return reject(error);
        resolve();
      });
    })
  ];
}
