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
	    	      { text: 'Architecture & Patterns', link: '/architecture/overview' },
	      { text: 'Telemetry', link: '/diblob/telemetry' },
	      { text: 'MCP Server', link: '/mcp/' },
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
			          text: 'Packages',
			          items: [
			            { text: '@speajus/diblob',           link: '/diblob/' },
			            { text: '@speajus/diblob-config',    link: '/diblob/config' },
			            { text: '@speajus/diblob-telemetry', link: '/diblob/telemetry' },
			            { text: '@speajus/diblob-logger',    link: '/diblob/logger' },
			            { text: '@speajus/diblob-async-context', link: '/diblob/async-context' },
			            { text: '@speajus/diblob-connect',   link: '/diblob/connect' },
			            { text: '@speajus/diblob-svelte',    link: '/diblob/svelte' },
			            { text: '@speajus/diblob-testing',   link: '/diblob/testing' },
			            { text: '@speajus/diblob-oauth',     link: '/diblob/oauth' },
			            { text: '@speajus/diblob-mcp',       link: '/mcp/' },
			            { text: '@speajus/diblob-visualizer', link: '/visualizer/' },
			          ]
			        },
        {
          text: 'Advanced',
          items: [
            { text: 'Async Support', link: '/diblob/guide/async-support' },
            { text: 'Container Nesting', link: '/diblob/guide/container-nesting' },
            { text: 'Lifecycle Management', link: '/diblob/guide/lifecycle' },
            { text: 'Lifecycle Hooks', link: '/diblob/guide/lifecycle-hooks' },
            { text: 'Constructor Injection', link: '/diblob/guide/constructor-injection' },
            { text: 'Factory Injection', link: '/diblob/guide/factory-injection' },
            { text: 'Testing', link: '/diblob/guide/testing' },
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
	      '/mcp/': [
        {
          text: 'MCP Server',
          items: [
            { text: 'Overview', link: '/mcp/' },
            { text: 'Getting Started', link: '/mcp/getting-started' },
            { text: 'Examples', link: '/mcp/examples' },
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
	      ],
	    	      '/architecture/': [
	    	        {
	    	          text: 'Architecture & Patterns',
	    	          items: [
	    	            { text: 'Overview', link: '/architecture/overview' },
	    	            { text: 'HTTP / Connect / gRPC service', link: '/architecture/http-grpc-service' },
	    	            { text: 'Background worker / job runner', link: '/architecture/worker' },
	    	            { text: 'Svelte SPA', link: '/architecture/svelte-spa' },
	    	            { text: 'Reference application', link: '/architecture/reference-app' },
	    	          ],
	    	        },
	    	      ],
		      '/internal/': [
		        {
		          text: 'Internal Docs',
		          items: [
		            { text: 'ADR-0002: diblob-config', link: '/internal/ADR-0002-diblob-config' },
		            { text: 'ADR-0003: LLM debugging helper', link: '/internal/ADR-0003-llm-debug-helper' },
		            { text: 'ADR-0004: OAuth/OIDC integration', link: '/internal/ADR-0004-oauth-diblob' },
		          ]
		        }
		      ],
	    	  // Root diblob docs: group by individual Node modules
	    	  '/diblob/': [
	    	    {
	    	      text: '@speajus/diblob',
	    	      items: [
	    	        { text: 'Overview', link: '/diblob/' },
	    	        { text: 'Getting Started', link: '/diblob/guide/getting-started' },
	    	        { text: 'Architecture & Patterns', link: '/architecture/overview' },
	    	        { text: 'API Reference', link: '/diblob/api/' },
	    	        { text: 'Examples', link: '/diblob/examples/' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-config',
	    	      items: [
	    	        { text: 'Typed Config', link: '/diblob/config' },
	    	        { text: 'Env Config Quick Start', link: '/diblob/ENVIRONMENT_CONFIG_QUICK_START' },
	    	        { text: 'Env Configuration Guide', link: '/diblob/ENVIRONMENT_CONFIGURATION' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-telemetry',
	    	      items: [
	    	        { text: 'Telemetry Guide', link: '/diblob/telemetry' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-diagnostics',
	    	      items: [
	    	        { text: 'Diagnostics + LLM helper', link: '/diblob/diagnostics' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-logger',
	    	      items: [
		    	        { text: 'Logger', link: '/diblob/logger' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-async-context',
	    	      items: [
	    	        { text: 'Async Context', link: '/diblob/async-context' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-connect',
	    	      items: [
		    	        { text: 'Connect gRPC', link: '/diblob/connect' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-svelte',
	    	      items: [
		    	        { text: 'Svelte Integration', link: '/diblob/svelte' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-testing',
	    	      items: [
		    	        { text: 'Testing Utilities', link: '/diblob/testing' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-mcp',
	    	      items: [
	    	        { text: 'Docs', link: '/mcp/' },
	    	      ],
	    	    },
	    	    {
	    	      text: '@speajus/diblob-visualizer',
	    	      items: [
	    	        { text: 'Docs', link: '/visualizer/' },
	    	      ],
	    	    },
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

