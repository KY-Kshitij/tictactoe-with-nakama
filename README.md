# Tic-Tac-Toe Multiplayer with Nakama & Next.js

A production-ready, server-authoritative real-time Tic-Tac-Toe game using Nakama backend and Next.js frontend.

## Architecture

*   **Backend**: Nakama server (Dockerized), using custom Server-Authoritative TypeScript Modules to validate moves, process turns, and determine winners.
*   **Frontend**: Next.js App Router, React, Tailwind CSS, communicating via WebSocket with `@nakama/api-client`.

## Setup & Run Locally

### 1. Start Backend

```bash
cd backend
npm install
npm run build 
cd ..
sudo docker compose up --build
```
Nakama console is available at http://127.0.0.1:7351 (admin/password).

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```
Accessible at http://localhost:3000.

## Cloud Deployment (Production)

To deploy the Nakama backend and Next.js frontend to a cloud environment (e.g. Render, Railway, or DigitalOcean App Platform):

1. **Deploy Nakama:**
   - Use the official `heroiclabs/nakama:3.22.0` Docker image.
   - Attach a persistent volume for the CockroachDB instance.
   - Inject the custom TypeScript module build (`backend/build/main.js`) into `/nakama/data/modules`.
   - Expose ports `7350` (gRPC/Websockets) and `7351` (Console).

2. **Deploy Next.js Engine:**
   - Deploy the `frontend/` directory directly to Vercel or a Dockerized Node runtime.
   - Ensure the following environment variables are supplied:
     ```env
     NEXT_PUBLIC_NAKAMA_HOST=your-nakama-domain.com
     NEXT_PUBLIC_NAKAMA_PORT=443
     NEXT_PUBLIC_NAKAMA_SECURE=true
     ```

## Multiplayer Testing

To properly simulate concurrent matchmaking and gameplay on a single local machine without state collisions:
- Open the application (`http://localhost:3000`) in **two distinct browser sessions** (e.g., one standard window and one **Incognito/Private** window).
- This ensures the `deviceId` generated via `uuid` and stored in `localStorage` behaves as two distinct physical clients.


Running the Application
To play a game across two browser windows:

Ensure the backend is running:sudo docker compose up --build
Start the Frontend Server: cd frontend && npm run dev
Hit http://localhost:3000
TIP

If you decide to deploy to a real cloud provider later, all you have to do is update your frontend's Vercel environment variables to point to your hosted Nakama instance's IP Address!