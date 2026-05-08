import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tac',
  description: 'The Agent Stack — technical compendium for Agentic AI',
  lang: 'en-US',
  base: '/tac/',

  appearance: true, // show light/dark toggle

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/tac/tac-icon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' }],
    ['meta', { name: 'theme-color', content: '#1a1714' }],           // dark
    ['meta', { name: 'theme-color', content: '#faf8f3', media: '(prefers-color-scheme: light)' }], // light
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
            { text: 'Reasoning Models', link: '/topics/reasoning-models' },
          ]
        },
        {
          text: 'Agents',
          items: [
            { text: 'Agent Frameworks', link: '/topics/agent-frameworks' },
            { text: 'Autonomous Agent Systems', link: '/topics/autonomous-agents' },
            { text: 'Orchestration', link: '/topics/orchestration' },
            { text: 'Tool Use & Function Calling', link: '/topics/tool-use' },
            { text: 'Context Management', link: '/topics/context-management' },
          ]
        },
        {
          text: 'Quality & Safety',
          items: [
            { text: 'Evaluations', link: '/topics/evals' },
            { text: 'Prompt Injection & Security', link: '/topics/prompt-injection' },
          ]
        },
        {
          text: 'Optimization',
          items: [
            { text: 'Fine-Tuning', link: '/topics/fine-tuning' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/srmdn/tac' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Said Ramadhan'
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
      light: 'vitesse-light',
      dark: 'vitesse-dark'
    }
  }
})