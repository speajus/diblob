import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'diblob',
  description: 'A dependency injection framework where the proxy (blob) is the key',
  base: '/diblob/',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is diblob?', link: '/guide/what-is-diblob' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Blobs', link: '/guide/blobs' },
            { text: 'Containers', link: '/guide/containers' },
            { text: 'Dependency Resolution', link: '/guide/dependency-resolution' },
            { text: 'Reactive Dependencies', link: '/guide/reactive-dependencies' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Async Support', link: '/guide/async-support' },
            { text: 'Container Nesting', link: '/guide/container-nesting' },
            { text: 'Lifecycle Management', link: '/guide/lifecycle' },
            { text: 'Constructor Injection', link: '/guide/constructor-injection' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'createBlob', link: '/api/create-blob' },
            { text: 'createContainer', link: '/api/create-container' },
            { text: 'Container Methods', link: '/api/container-methods' },
            { text: 'Types', link: '/api/types' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'Async Dependencies', link: '/examples/async' },
            { text: 'Reactive Updates', link: '/examples/reactive' },
            { text: 'Container Nesting', link: '/examples/nesting' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/jspears/diblob' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present'
    },

    search: {
      provider: 'local'
    }
  }
})

