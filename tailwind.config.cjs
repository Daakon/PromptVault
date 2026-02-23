const path = require('node:path');

const fromRoot = (relativePath) => path.resolve(__dirname, relativePath).replace(/\\/g, '/');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    fromRoot('apps/web/index.html'),
    fromRoot('apps/web/src/**/*.{js,ts,jsx,tsx}'),
    fromRoot('apps/chrome-extension/index.html'),
    fromRoot('apps/chrome-extension/src/**/*.{js,ts,jsx,tsx}'),
    fromRoot('packages/app/src/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#151e2e',
        },
      },
    },
  },
  plugins: [],
};
