import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tac',
  description: 'The Agent Stack — technical compendium for Agentic AI',
  lang: 'en-US',
  base: '/tac/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/tac/tac-icon.svg' }],
    ['meta', { name: 'theme-color', content: '#0a0e1a' }],
    ['meta', { property: 'og:title', content: 'Tac — The Agent Stack' }],
    ['meta', { property: 'og:description', content: 'Technical compendium for Agentic AI: tokens, inference, caching, serving, frameworks, and orchestration.' }],
  ],

  themeConfig: {
    logo: '/tac-icon.svg',
    siteTitle: 'Tac',

    nav: [
      { text: 'Stack', link: '/stack/' },
      { text: 'Topics', link: '/topics/tokens-and-cost' },
      { text: 'About', link: '/about' },
    ],

    sidebar: {
      '/stack/': [
        {
          text: 'The Stack',
          items: [
            { text: 'Overview', link: '/stack/' },
            { text: 'Foundation Models', link: '/stack/foundation-models' },
            { text: 'Infrastructure', link: '/stack/infrastructure' },
            { text: 'Agent Runtime', link: '/stack/agent-runtime' },
            { text: 'Applications', link: '/stack/applications' },
          ]
        }
      ],
      '/topics/': [
        {
          text: 'Foundations',
          items: [
            { text: 'Tokens & Cost', link: '/topics/tokens-and-cost' },
            { text: 'Context Windows', link: '/topics/context-windows' },
            { text: 'Sampling', link: '/topics/sampling' },
          ]
        },
        {
          text: 'Infrastructure',
          items: [
            { text: 'LLM Serving', link: '/topics/llm-serving' },
            { text: 'Prompt Caching', link: '/topics/prompt-caching' },
            { text: 'Latency', link: '/topics/latency' },
            { text: 'KV Cache & Quantization', link: '/topics/kv-cache-quantization' },
            { text: 'Rate Limits & Concurrency', link: '/topics/rate-limits' },
          ]
        },
        {
          text: 'Architecture',
          items: [
            { text: 'MoE Architecture', link: '/topics/moe-architecture' },
          ]
        },
        {
          text: 'Agents',
          items: [
            { text: 'Agent Frameworks', link: '/topics/agent-frameworks' },
            { text: 'Orchestration', link: '/topics/orchestration' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/srmdn/tac' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright \u00a9 2025-present Said Ramadhan'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    editLink: {
      pattern: 'https://github.com/srmdn/tac/edit/main/docs/:path'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
