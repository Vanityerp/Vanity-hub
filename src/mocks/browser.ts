// MSW browser setup for development environment
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Setup worker with our request handlers
export const worker = setupWorker(...handlers)
