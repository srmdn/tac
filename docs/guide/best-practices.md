# Best Practices

## Project Structure

Organize your Tac project like this:

```
my-project/
├── src/
│   ├── index.ts
│   └── lib/
├── tests/
├── tac.config.ts
└── package.json
```

## Performance

- Keep entry files lean
- Use dynamic imports for heavy dependencies
- Enable caching in production

## Error Handling

Always wrap async operations:

```ts
try {
  await tac.run()
} catch (err) {
  console.error('Tac failed:', err.message)
  process.exit(1)
}
```

:::warning
Never ignore unhandled promise rejections. Tac will warn you.
:::
