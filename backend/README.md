# Auth Backend

Node.js + Express + MongoDB JWT auth service.

## Setup

1. Install dependencies:

   npm install

2. Update environment values in `.env`.

3. Start the server:

   npm run dev

## Endpoints

- POST /auth/signup
- POST /auth/login
- GET /auth/me (requires Bearer token)
- GET /health
