# Rental Listing

A tiny full-stack website listing 3 available rental units, with a "request
more information" inquiry form — built as a focused, one-day project to get
hands-on with software testing practices ahead of applying for a QA role.

## Stack

- **Backend:** Node.js `http` module + `node:sqlite` (Node's built-in SQLite —
  no external database or framework required to run it)
- **Frontend:** plain HTML/CSS/JavaScript
- **Unit tests:** Jest
- **API tests:** Postman collection (runnable via `newman` in CI)
- **End-to-end tests:** Playwright
- **CI/CD:** GitHub Actions — runs all three test suites on every push

## Running it locally

```bash
npm install
npm start
# visit http://localhost:3000
```

## Running the tests

```bash
npm test               # Jest unit tests against the API
npm run test:e2e       # Playwright browser tests
npm run test:api-collection   # Postman collection via newman (requires the server running)
```

## What this project demonstrates

| Skill | Where |
|---|---|
| SQL | `server.js` — table schema and parameterized `INSERT`/`SELECT` queries for inquiries |
| JavaScript | Backend (`server.js`), frontend (`public/app.js`), and all test suites |
| Unit testing (Jest) | `__tests__/api.test.js` — covers success and validation-error paths |
| API testing (Postman) | `postman/rental-listing.postman_collection.json` — status codes and response shape |
| Browser automation (Playwright) | `tests-e2e/rental-listing.spec.js` — the actual user flow, end to end |
| CI/CD | `.github/workflows/test.yml` — all three suites run automatically on every push |

## API

- `GET /api/units` — the 3 available units (hardcoded, no auth needed)
- `GET /api/inquiries` — inquiries submitted so far
- `POST /api/inquiries` — submit a booking inquiry; requires `unitId` (must
  match a real unit), `name`, and a valid `email`; `message` is optional

In a real deployment, `GET /api/inquiries` would need authentication so only
the landlord could see submitted contact details — left open here to keep
the project simple and to have a second GET endpoint to test.

## Notes

This was built and manually verified (server behavior, all UI flows, and the
exact assertions used in the Jest/Playwright/Postman files) in an environment
without package-registry access, so `npm install` and the test suites
themselves haven't been run end-to-end as a single command yet — do that
first after cloning, and everything should pass as written.
