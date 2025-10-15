# Repository Guidelines

## Project Structure & Module Organization
- `api/index.ts` boots the Express server and wires middleware; domain logic sits in `controllers/`, `routes/`, `models/`, and `middleware/` to keep concerns isolated.
- Configuration lives in `config/` with environment-driven exports; shared utilities extend `helpers/` and TypeScript declarations in `types/`.
- UI assets are split between `views/` (EJS templates and partials such as `views/partials/card-add.ejs`) and `public/` for static files.
- Data and ops artefacts live in `migrations/`, `docs/`, `system/`, and automated checks under `tests/e2e` and `tests/integration`.

## Build, Test & Development Commands
- `yarn start` launches the production server through `tsx api/index.ts`; use `yarn start:dev` for watch mode with source maps.
- `yarn lint` performs TypeScript type-checking plus `npx ejslint` over templates; run `yarn lint:ts` or `yarn lint:ejs` to isolate either track.
- `yarn db:migrate` and `yarn db:rollback` apply or revert Mongo migrations in `migrations/`; check current state with `yarn db:status`.
- `yarn test` runs the Jest suite; add `:coverage` to emit reports into `coverage/` and update `junit.xml` for CI.

## Coding Style & Naming Conventions
- TypeScript files use 2-space indentation, trailing commas, and TSDoc-style blocks (`/** ... */`) for exported members as seen in `controllers/`.
- Prefer `camelCase` for functions/variables, `PascalCase` for classes and interfaces, and `kebab-case` for EJS partial filenames.
- Keep logic pure in controllers/helpers; place request wiring in routes; export a single default per module when practical.

## Testing Guidelines
- Tests run on Jest with the `ts-jest` preset; name specs `*.spec.ts` or `*.test.ts` under `tests/` to match `jest.config.js`.
- Aim to maintain coverage across `api`, `config`, `controllers`, `helpers`, `middleware`, `models`, and `routes` as enforced by `collectCoverageFrom`.
- Consume supertest for request flows and prefer fixture factories over network calls; refresh snapshots after intentional UI changes.

## Commit & Pull Request Guidelines
- Follow the observed Conventional Commit style (`feat:`, `refactor:`, `fix:`, `yarn:`) with concise, imperative summaries under ~70 characters.
- Group related changes per commit; include migration IDs or view names when helpful.
- Pull requests should link issues, describe behavioural impact, list validation commands (`yarn test`, `yarn db:migrate`), and attach UI screenshots for template updates.

## Security & Configuration Tips
- Never commit `.env`; update `.env.example` when introducing new settings and document defaults in `config/`.
- Rotate API keys when sharing recordings or tests, and prefer local `.env.test` overrides for automation to avoid polluting development data.
