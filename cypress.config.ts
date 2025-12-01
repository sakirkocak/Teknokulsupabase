import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    // Test kullanıcı bilgileri (gerçek test için değiştirin)
    testEmail: 'test@example.com',
    testPassword: 'Test123456',
  },
})

