# Configuration

Tac can be configured via a `tac.config.js` or `tac.config.ts` file in your project root.

## Basic Config

```js
// tac.config.js
export default {
  entry: './src/index.ts',
  outDir: './dist',
  target: 'node18',
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entry` | `string` | `./src/index.ts` | Entry point file |
| `outDir` | `string` | `./dist` | Output directory |
| `target` | `string` | `node18` | Target runtime |

## Environment Variables

Tac respects the following environment variables:

- `TAC_ENV` — Set the environment (`development`, `production`)
- `TAC_DEBUG` — Enable debug logging

:::tip
Use `.env` files in your project root. Tac loads them automatically.
:::
