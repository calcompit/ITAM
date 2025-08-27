import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent FOUC (Flash of Unstyled Content) by adding loaded class after page load
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('loaded');
});

// Fallback: add loaded class after a short delay
setTimeout(() => {
  document.documentElement.classList.add('loaded');
}, 100);

createRoot(document.getElementById("root")!).render(<App />);
