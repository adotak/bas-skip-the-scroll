# bas-skip-the-scroll

An ethical, finite-content mobile app that redirects social scrolling into intentional, time-boxed learning and action sessions.

## Structure

- `apps/mobile` - Expo/React Native mobile app
- `apps/api` - Express API for content sessions
- `packages/shared` - Shared types and constants

## Development

```sh
pnpm install
pnpm mobile:start
pnpm mobile:test
pnpm typecheck
```

The API can be run with:

```sh
pnpm --filter @skip-the-scroll/api dev
```