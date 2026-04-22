import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

if (window.location.pathname.startsWith('/showcase')) {
  // Lazy-load showcase bundle — keeps main page unaffected
  import('./pages/Showcase.jsx').then(({ default: ShowcasePage }) => {
    root.render(<React.StrictMode><ShowcasePage /></React.StrictMode>)
  })
} else {
  import('./App.jsx').then(({ default: App }) => {
    root.render(<React.StrictMode><App /></React.StrictMode>)
  })
}
