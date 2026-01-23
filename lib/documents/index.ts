export type { Document, DocumentMetadata, DocumentStorage } from './types'
export { localStorageAdapter } from './local-storage'

// Default storage adapter - swap this out later for database
import { localStorageAdapter } from './local-storage'
export const documentStorage = localStorageAdapter
