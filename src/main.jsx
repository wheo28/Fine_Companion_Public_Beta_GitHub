import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import './index.css'

// Support a repository subpath on GitHub Pages. import.meta.env.BASE_URL is set
// by Vite from `base` (e.g. "/fine-companion-public-beta/"); React Router wants
// a basename without a trailing slash (except the root "/").
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
)
