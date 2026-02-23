# Agent instructions

`@anupheaus/socket-api` is a real-time API library built on Socket.IO. It provides a typed, structured way to define and consume **actions** (request/response RPC), **events** (server-to-client push), and **subscriptions** (streaming data with subscribe/unsubscribe).

## Package structure

The package exports three entry points:

- **`@anupheaus/socket-api/server`** – Server-side setup and handlers
- **`@anupheaus/socket-api/client`** – React client components and hooks
- **`@anupheaus/socket-api/common`** – Shared definitions (actions, events, subscriptions, models)

## How it works

### 1. Define contracts (common)

Use the definition helpers to create typed contracts shared by server and client:

```ts
// Actions: request → response (RPC-style)
const myAction = defineAction<{ id: string }, { name: string }>()('myAction');

// Events: server pushes to client (no response)
const myEvent = defineEvent<{ message: string }>('myEvent');

// Subscriptions: client subscribes, server streams updates
const mySubscription = defineSubscription<{ query: string }, { results: string[] }>()('mySubscription');
```

### 2. Server setup

Attach the socket API to an HTTP server:

```ts
import http from 'http';
import { startServer, createServerAction, createServerSubscription } from '@anupheaus/socket-api/server';

const server = http.createServer();
await startServer({
  name: 'api',
  server,
  privateKey: '...', // for JWT auth
  actions: [
    createServerAction(myAction, async ({ id }) => ({ name: await fetchName(id) })),
  ],
  subscriptions: [
    createServerSubscription(mySubscription, async ({ request, subscriptionId, update, onUnsubscribe }) => {
      const interval = setInterval(() => update({ results: [...] }), 1000);
      onUnsubscribe(() => clearInterval(interval));
      return { results: [] };
    }),
  ],
});
server.listen(3000);
```

- **Actions** – Handler receives the request and returns the response.
- **Subscriptions** – Handler receives `request`, `subscriptionId`, `update(response)` to push data, and `onUnsubscribe(handler)` for cleanup.
- **Events** – Use `useEvent(myEvent)` on the server and call the returned function to emit to the connected client.

### 3. Client setup

Wrap the app with `SocketAPI` and use the hooks:

```tsx
import { SocketAPI, useAction, useEvent, useSubscription } from '@anupheaus/socket-api/client';

<SocketAPI name="api">
  <MyApp />
</SocketAPI>
```

- **`useAction(action)`** – Returns `actionName(request)` (Promise) and `useActionName(request)` (reactive state).
- **`useEvent(event)`** – Returns a setter; call it with a handler to listen for server events.
- **`useSubscription(subscription)`** – Returns `subscribe(request)`, `unsubscribe()`, and `onCallback(handler)`.

### 4. Authentication

- Server: Call `setUser(user)` from `useSocketAPI()` to authenticate a client. JWT tokens are created automatically.
- Client: `AuthenticationProvider` (inside `SocketAPI`) stores the token and re-authenticates on reconnect.
- Internal action `socketAPIAuthenticateTokenAction` verifies tokens; it runs automatically when the client reconnects with a stored token.

## Key files

| Path | Purpose |
|------|---------|
| `src/server/startServer.ts` | Bootstraps Koa, Socket.IO, and handlers |
| `src/server/handler/createServerHandler.ts` | Registers handlers; wraps errors as `{ error }` |
| `src/server/actions/createServerAction.ts` | Wraps action handlers |
| `src/server/subscriptions/createServerSubscription.ts` | Handles subscribe/unsubscribe and `update()` |
| `src/client/SocketAPI.tsx` | Root provider (Logger → Socket → Subscription → Auth) |
| `src/client/providers/socket/SocketProvider.tsx` | Manages Socket.IO connection and event registration |
| `src/client/hooks/useAction.ts` | Calls actions; handles `{ error }` responses |
| `src/common/socket/SocketIOParser.ts` | Custom parser for serialisation (Dates, etc.) |

## Event naming

- Actions: `socket-api.actions.{actionName}`
- Events: `socket-api.events.{eventName}`
- Subscriptions: `socket-api.subscriptions.{subscriptionName}`

## Dependencies

- **`@anupheaus/common`** – Logger, utilities, types
- **`@anupheaus/react-ui`** – React components, `createComponent`, `LoggerProvider`, `useSubscription`
- **Socket.IO** – Transport layer

## Testing

- Unit tests: `pnpm test` (Vitest)
- E2E tests: `pnpm test:e2e` – starts a real server and tests with `socket.io-client`
