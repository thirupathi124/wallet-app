# Wallet & Transaction Management System — Backend

NestJS + PostgreSQL REST API with JWT authentication, Stripe-powered wallet top-ups, peer money transfers, and transaction history.

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL + TypeORM (`synchronize: true` auto-creates tables)
- **Auth**: JWT Access Token (15min) + Refresh Token (7 days, DB-backed)
- **Payments**: Stripe Checkout Sessions + Webhooks
- **Docs**: Swagger at `/api/docs`

## Prerequisites

- Node.js v18+
- PostgreSQL running locally (default port 5432)
- Stripe account (for Stripe keys)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhook testing)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create PostgreSQL database

```sql
CREATE DATABASE wallet_db;
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=wallet_db

JWT_ACCESS_SECRET=your_random_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=another_random_secret_here
JWT_REFRESH_EXPIRES=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

PORT=3001
FRONTEND_URL=http://localhost:3000
```

> **Get Stripe keys**: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

### 4. Run the server

```bash
# Development (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Server starts at: `http://localhost:3001`  
Swagger docs at: `http://localhost:3001/api/docs`

### 5. Stripe Webhook (local testing)

Install Stripe CLI and forward events to your local server:

```bash
stripe login
stripe listen --forward-to localhost:3001/payments/webhook
```

Copy the `whsec_...` secret printed by Stripe CLI into your `.env` as `STRIPE_WEBHOOK_SECRET`.

## API Endpoints

### Auth (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register with name, email, password — creates wallet automatically |
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token using refresh token |
| POST | `/auth/logout` | Revoke refresh token (protected) |

### Wallet (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet/balance` | Get current balance |
| POST | `/wallet/add-money` | Create Stripe Checkout session, returns `sessionUrl` |

### Transactions (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transfer` | Transfer money to user by email |
| GET | `/transactions` | Get full transaction history |

### Payments (Stripe only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/webhook` | Stripe webhook — credits wallet on payment success |

## Database Schema

```
users
  id          UUID PK
  name        VARCHAR(100)
  email       VARCHAR(255) UNIQUE
  password_hash VARCHAR
  created_at  TIMESTAMP

wallets
  id          UUID PK
  user_id     UUID FK → users.id
  balance     DECIMAL(12,2) DEFAULT 0
  created_at  TIMESTAMP
  updated_at  TIMESTAMP

transactions
  id                UUID PK
  sender_wallet_id  UUID FK → wallets.id (nullable for Stripe credits)
  receiver_wallet_id UUID FK → wallets.id
  amount            DECIMAL(12,2)
  type              ENUM(CREDIT, DEBIT)
  status            ENUM(PENDING, SUCCESS, FAILED)
  stripe_session_id VARCHAR (nullable)
  description       VARCHAR (nullable)
  created_at        TIMESTAMP

refresh_tokens
  id          UUID PK
  user_id     UUID FK → users.id
  token_hash  VARCHAR (bcrypt hashed)
  expires_at  TIMESTAMP
  revoked     BOOLEAN DEFAULT false
  created_at  TIMESTAMP
```

## Transfer Validation Rules

1. Cannot transfer to yourself
2. Amount must be greater than 0
3. Cannot transfer more than available balance
4. Transfer uses atomic DB transaction (rollback on any failure)

## Auth Flow

```
POST /auth/register or /auth/login
  → { accessToken, refreshToken, user }

Use accessToken in: Authorization: Bearer <accessToken>

When accessToken expires (15min):
POST /auth/refresh { refreshToken }
  → new { accessToken, refreshToken }

POST /auth/logout (Bearer) → revokes refresh token
```

## Stripe Add-Money Flow

```
POST /wallet/add-money { amount: 50 }
  → { sessionUrl: "https://checkout.stripe.com/...", sessionId }

Redirect user to sessionUrl
User completes payment on Stripe

Stripe → POST /payments/webhook
  → wallet credited, CREDIT transaction created
```
