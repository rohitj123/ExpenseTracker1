# Expense Tracker — Render deployment

This repository is configured as a Render Blueprint with two services:

- `expense-tracker-api`: Express API
- `expense-tracker-web`: Vite/React static site

## Deploy

1. Push this folder to a new GitHub repository. Do not commit a `.env` file.
2. In Render, choose **New > Blueprint**, select the repository, and approve the services in `render.yaml`.
3. Set `MONGODB_URI` for `expense-tracker-api` to a MongoDB Atlas connection string. Allow Render's outbound connections in Atlas (or temporarily allow all IPs while testing).
4. Deploy. Render generates `JWT_SECRET` automatically.

The frontend uses `https://expense-tracker-api.onrender.com/api` and the API permits `https://expense-tracker-web.onrender.com`. If you rename either Render service or add a custom domain, update both `VITE_API_URL` (then redeploy the static site) and `CLIENT_URL` accordingly.

## Local run

Copy both `.env.example` files to `.env`, provide a valid MongoDB URI and JWT secret, then run the following in separate terminals:

```sh
cd backend && npm ci && npm run dev
cd frontend && npm ci && npm run dev
```

## Security note

The supplied archive included a live MongoDB connection string in source control. It has been removed from this deployable copy. Rotate that database password in MongoDB Atlas before deploying.
