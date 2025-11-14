// Ensure a minimal Node-like `process.env` is available in the browser.
// Some dependencies (for example @xyflow/svelte / React Flow internals)
// expect `process.env.NODE_ENV` to exist at runtime.

declare global {
  interface Window {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
}

if (typeof window !== 'undefined') {
  const w = window as Window;

  if (!w.process) {
    w.process = { env: {} };
  } else if (!w.process.env) {
    w.process.env = {};
  }
  const env = w.process.env || {};
  if (env.NODE_ENV) {
    env.NODE_ENV = 'production';
  }
}

export {};
