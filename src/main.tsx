import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AppStateProvider } from './state/AppState'
import { TestProvider } from './state/TestContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <TestProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </TestProvider>
    </HashRouter>
  </StrictMode>,
)
