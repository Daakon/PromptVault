import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@prompt-vault/app';

const mount = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('PromptVault Chrome side panel missing #root element');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
