import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Diblob',
  description: 'A dependency injection framework where the proxy (blob) is the key',
  base: '/diblob/',

  ignoreDeadLinks: [
    /^http:\/\/localhost/,
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Diblob', link: '/diblob/guide/getting-started' },
      { text: 'Visualizer', link: '/visualizer/' },
      { text: 'API Reference', link: '/diblob/api/' },
      { text: 'Examples', link: '/diblob/examples/' },
    ],

    sidebar: {
      '/diblob/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is diblob?', link: '/diblob/guide/what-is-diblob' },
            { text: 'Getting Started', link: '/diblob/guide/getting-started' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Blobs', link: '/diblob/guide/blobs' },
            { text: 'List Blobs', link: '/diblob/guide/list-blob' },
            { text: 'Containers', link: '/diblob/guide/containers' },
            { text: 'Dependency Resolution', link: '/diblob/guide/dependency-resolution' },
            { text: 'Reactive Dependencies', link: '/diblob/guide/reactive-dependencies' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Async Support', link: '/diblob/guide/async-support' },
            { text: 'Container Nesting', link: '/diblob/guide/container-nesting' },
            { text: 'Lifecycle Management', link: '/diblob/guide/lifecycle' },
            { text: 'Constructor Injection', link: '/diblob/guide/constructor-injection' },
            { text: 'Factory Injection', link: '/diblob/guide/factory-injection' },
          ]
        }
      ],
      '/diblob/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/diblob/api/' },
            { text: 'createBlob', link: '/diblob/api/create-blob' },
            { text: 'createListBlob', link: '/diblob/api/create-list-blob' },
            { text: 'createContainer', link: '/diblob/api/create-container' },
            { text: 'Container Methods', link: '/diblob/api/container-methods' },
            { text: 'Types', link: '/diblob/api/types' },
          ]
        }
      ],
      '/diblob/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/diblob/examples/' },
            { text: 'Basic Usage', link: '/diblob/examples/basic' },
            { text: 'Factory Injection', link: '/diblob/examples/factory-injection' },
            { text: 'Async Dependencies', link: '/diblob/examples/async' },
            { text: 'Reactive Updates', link: '/diblob/examples/reactive' },
            { text: 'Container Nesting', link: '/diblob/examples/nesting' },
          ]
        }
      ],
      '/visualizer/': [
        {
          text: 'Visualizer',
          items: [
            { text: 'Overview', link: '/visualizer/' },
            { text: 'Getting Started', link: '/visualizer/getting-started' },
            { text: 'Embedding', link: '/visualizer/embedding' },
            { text: 'Remote Visualization', link: '/visualizer/remote' },
            { text: 'Server Setup', link: '/visualizer/server' },
            { text: 'Examples', link: '/visualizer/examples' },
            { text: 'API Reference', link: '/visualizer/api' },
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

