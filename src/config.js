// Backend base URL. Configured at build time via REACT_APP_API_BASE_URL
// (a Create React App environment variable). Defaults to the local dev
// backend so `npm start` works with no extra setup. Any trailing slash is
// stripped so callers can safely concatenate a path beginning with '/'.
export const BACKEND_URL = (
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'
).replace(/\/+$/, '')
