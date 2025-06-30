import React from 'react';
import ReactDOM from 'react-dom/client';

/* Tailwind — обязательно, иначе всё будет «невидимо» */
import './index.css';

/* ← Вот здесь имя файла и путь!  */
import { App } from './App';       // 1) с заглавной «A»
                                   // 2) без .tsx на конце
                                   // 3) расположение: src/App.tsx

console.log('👋 main loaded');

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

console.log('🚀 React mounted');
