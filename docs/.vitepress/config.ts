import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tac',
  description: 'Documentation for Tac',
  lang: 'en-US',
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/tac-icon.svg' }],
    ['meta', { name: 'theme-color', content: '#0a0e1a' }],
  ],

  themeConfig: {
    logo: '/tac-icon.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/reference' },
      { text: 'Examples', link: '/examples/basic-usage' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Best Practices', link: '/guide/best-practices' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/reference' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/basic-usage' },
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
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
