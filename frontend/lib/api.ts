// Base URL for the backend API.
// Set NEXT_PUBLIC_API_URL in the deploy environment (Vercel) to the deployed
// backend URL. Falls back to localhost for local development.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
