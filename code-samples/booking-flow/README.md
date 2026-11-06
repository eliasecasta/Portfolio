# MiniBooker — Full-stack booking code sample

**Live Demo:** Deployment pending.

**[Source Code](https://github.com/eliasecasta/Portfolio/tree/gh-pages/code-samples/booking-flow)**

A small, original React + TypeScript + Node.js application showing how I structure a real product workflow: booking a limited-capacity class without double-booking or creating duplicate reservations on retries.

**Why this sample?** My production client applications are private. This is a fictional, independent example built for public code review. It does not contain client source code, customer data, or proprietary business logic.

## What it demonstrates

- A small React UI that displays available sessions and submits reservations.
- A TypeScript/Express API with runtime request validation (Zod).
- A focused domain service with explicit business rules: capacity limits, one reservation per email/slot, normalized emails, and idempotent retries.
- Predictable HTTP errors (400 for invalid input, 404 for unknown sessions, 409 for conflicts).
- Unit tests for the domain rules and API tests for the HTTP contract.
- Dependency injection for IDs and time, making tests deterministic.

## Run locally

Requires Node.js 22+ and npm.

~~~bash
cd code-samples/booking-flow
npm install
npm run dev
~~~

Open the Vite URL printed in your terminal (usually http://localhost:5173). The API runs at http://127.0.0.1:3001 and the Vite development server proxies /api requests to it.

Run tests and type-check/build:

~~~bash
npm test
npm run build
~~~

## API contract

- GET /api/slots — list sessions with remaining capacity.
- POST /api/bookings — reserve one seat using the following JSON:

~~~json
{
  "slotId": "design-systems",
  "email": "developer@example.com",
  "requestId": "f8eb4e70-8231-40bc-a5d4-8191ce2b872f"
}
~~~

A new booking returns HTTP 201. Replaying the same requestId and payload returns HTTP 200 with the original booking. Reusing that requestId for a different request returns HTTP 409.

## Architecture

- server/bookingStore.ts — business rules and in-memory state; no HTTP dependencies.
- server/app.ts — input validation and HTTP status mapping.
- server/index.ts — demo data and process startup.
- server/*.test.ts — business and HTTP tests.
- web/src/App.tsx — accessible React booking flow.
- web/src/styles.css — responsive UI.

## Decisions and trade-offs

This deliberately uses in-memory storage to keep the example reviewable. The reservation method performs the capacity check and write synchronously in a single Node.js process. **It is not a production concurrency solution**: multiple instances or restarts require a durable database and a transaction/unique constraints for capacity, idempotency keys, and duplicate bookings. Authentication, rate limiting, payment processing, and persistent audit logs are also out of scope.

The public demo uses fictional sessions and temporary, shared data. Use a sample email, not personal information. The reset button clears all visitors' demo reservations, including idempotency history; restarts also clear them. There are no real reservations, payments, or confirmation emails. Run a single web dyno: multiple processes would have independent state.

## Heroku deployment

From the repository root, after merging the changes into `gh-pages`, deploy the application subtree to an existing dedicated Heroku app:

~~~bash
git fetch origin gh-pages
git subtree split --prefix=code-samples/booking-flow origin/gh-pages | xargs -I {} git push https://git.heroku.com/APP_NAME.git {}:refs/heads/main
~~~

Replace `APP_NAME` with the app name and authenticate with Heroku. The buildpack installs from the lockfile, runs `npm run build`, and starts `npm start`. Heroku's Eco dyno sleeps after inactivity; its first request may take longer. The demo requires no add-ons or database.

The point is to make the rules clear and testable before adding infrastructure. In a production system, I would preserve the domain contract and replace the store with a transactional persistence adapter.

## AI-assisted development

I use coding agents to accelerate implementation, while treating their output as code that must be reviewed, tested, and understood. This sample was prepared with AI assistance. The design choices, edge cases, limitations, and verification steps are intentionally documented so a reviewer can assess the engineering rather than the amount of code typed manually.

**Note:** This repository is a portfolio sample, not an affiliated Sticker Mule project or a copy of any client system.
