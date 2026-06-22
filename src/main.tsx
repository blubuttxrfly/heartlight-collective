import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StorageProvider } from './lib/storage'
import { BackfillWishes } from './components/BackfillWishes'

/* ─── Fonts: Alice — self-hosted, no Google CDN ─── */
import '@fontsource/alice/400.css'

import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StorageProvider>
        <BackfillWishes />
        <App />
      </StorageProvider>
    </BrowserRouter>
  </StrictMode>,
)
