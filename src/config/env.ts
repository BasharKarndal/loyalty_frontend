/**
 * Central frontend ↔ backend config.
 * Dev: VITE_API_BASE_URL=/api/v1 (Vite proxy → FastAPI).
 * Prod: full backend API URL ending with /api/v1.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const APP_NAME = 'ولاء';
