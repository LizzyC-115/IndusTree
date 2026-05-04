import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (import.meta.env.DEV) {
  import('./firebase/auth.js').then(({ migrateUserIndustries }) => {
    window.__migrateIndustries = migrateUserIndustries;
    console.info('[DEV] Run window.__migrateIndustries() in the console to migrate user industries in Firestore.');
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
