# API Reference

## `tac(config)`

Main entry point. Initializes Tac with the given configuration.

```ts
import tac from '@srmdn/tac'

const app = await tac({
  entry: './src/index.ts',
})
```

### Parameters

- `config` `TacConfig` — Configuration object

### Returns

- `Promise<TacInstance>` — Running Tac instance

## `TacInstance`

### `.run()`

Starts the application.

```ts
await app.run()
```

### `.stop()`

Gracefully shuts down.

```ts
await app.stop()
```

## Types

```ts
interface TacConfig {
  entry: string
  outDir?: string
  target?: string
}

interface TacInstance {
  run(): Promise<void>
  stop(): Promise<void>
}
```
