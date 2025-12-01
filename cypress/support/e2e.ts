// ***********************************************************
// Cypress E2E Support File
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Hata yönetimi
Cypress.on('uncaught:exception', (err, runnable) => {
  // Supabase realtime bağlantı hataları için
  if (err.message.includes('ResizeObserver') || err.message.includes('WebSocket')) {
    return false
  }
  return true
})

