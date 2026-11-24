# Browser end-to-end tests

Playwright tests that drive the real frontend against a real backend and a throwaway database.
Phases run in order and build on each other's data (01-auth … 09-reports-logs-account).

## Run

1. Backend repo: `npm run test:db:reset`, then start a test server:
   `DB_NAME=pos_inventory_e2e PORT=5055 MAIL_HOST=127.0.0.1 MAIL_PORT=2599 CORS_ORIGINS=http://localhost:5174 node server.js`
2. Frontend on :5174 proxying `/api` to :5055. Copy `vite.e2e.config.js` to `node_modules/.cache/vite.e2e.config.mjs`
   (it must resolve the frontend's plugins), then:
   `VITE_API_URL=http://localhost:5174/api npx vite --config node_modules/.cache/vite.e2e.config.mjs`
3. Here: `npm install && npx playwright install chromium && npm test`

Reset the database before each full run. `tests/db.js` reads the backend's `.env` and only ever
connects to `pos_inventory_e2e`.
