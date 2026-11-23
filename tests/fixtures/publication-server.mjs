// Runs the real production routes in an isolated process. Only the parent uses
// network sockets, over loopback. All outbound server fetches are fixtures.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { Server } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';

const listen = Server.prototype.listen;
Server.prototype.listen = function (...args) {
  this.once('listening', () => process.send({ port: this.address().port }));
  return listen.apply(this, args);
};

globalThis.fetch = async (url, options = {}) => {
  const { hostname, pathname } = new URL(url);
  appendFileSync('requests.log', JSON.stringify([options.method ?? 'GET', hostname, pathname]) + '\n');
  if (hostname === 'storage.invalid') {
    if (options.method === 'POST') return new Response(null, { status: 204 });
    return Response.json([{ state: JSON.parse(readFileSync('data/syncedPortfolio.json', 'utf8')) }]);
  }
  const fixture = JSON.parse(readFileSync('github.json', 'utf8'));
  if (fixture.hold === pathname) {
    while (!existsSync('release')) await delay(10);
  }
  if (hostname === 'api.github.com') {
    if (pathname === '/users/owner/repos') return Response.json(fixture.list);
    const [, root, owner, name, resource] = pathname.split('/');
    if (root === 'repos' && owner === 'owner' && !resource && fixture.details[name]) {
      return Response.json(fixture.details[name]);
    }
  }
  return new Response(null, { status: 404 });
};

await import('../../server.ts');
