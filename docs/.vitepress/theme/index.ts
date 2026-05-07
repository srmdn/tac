import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Warm Obsidian theme - light/dark toggle handled by VitePress
    // VitePress auto-adds .light / html:not(.light) class
    // Our custom.css handles both via those selectors
  }
} as Theme