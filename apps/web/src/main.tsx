import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize theme on load
const savedTheme = localStorage.getItem('theme') || 
  (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
if (savedTheme) {
  document.documentElement.classList.add(savedTheme);
} else {
  document.documentElement.classList.add('dark'); // Default to dark
}

// Initialize language on load
const savedLanguage = localStorage.getItem('language');
if (savedLanguage) {
  document.documentElement.setAttribute('lang', savedLanguage);
} else {
  // Detect browser language
  const browserLang = navigator.language.split('-')[0];
  const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ar', 'sw', 'zu'];
  const lang = supportedLanguages.includes(browserLang) ? browserLang : 'en';
  document.documentElement.setAttribute('lang', lang);
  localStorage.setItem('language', lang);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
