# newsroom-api

REST API serving articles to the web site and the mobile apps. Deployed on Kubernetes (see `k8s/`).

- `npm test` runs the test suite
- `npm start` starts the API on port 8080 (needs `DATABASE_URL`)
- Migrations live in `migrations/` and run at deploy time
