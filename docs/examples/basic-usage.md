# Basic Usage

## Hello World

Create a simple Tac app:

```ts
import tac from '@srmdn/tac'

const app = await tac({
  entry: './src/hello.ts',
})

await app.run()
```

## With Configuration

```ts
import tac from '@srmdn/tac'

const app = await tac({
  entry: './src/app.ts',
  outDir: './build',
  target: 'node20',
})

await app.run()
```

## CLI Usage

```bash
# Run directly
tac dev

# Build for production
tac build

# With custom config
tac build --config ./tac.production.ts
```
