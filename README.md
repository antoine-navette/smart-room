# Smart Room

## Getting Started

### 1. Environment Variables

The stack uses `.env.example` files as the default configuration — no copy needed. To override a value locally, create a `.env` file next to the corresponding `.env.example` and set only what you want to change.

| File | Purpose |
|---|---|
| `.env` | Root: ports, Postgres credentials, pgAdmin credentials |
| `backend/.env` | Backend-specific overrides |
| `frontend/.env` | Frontend-specific overrides |

---

### 2. Start the Stack

```bash
docker compose up
```

Docker Compose automatically loads `compose.yaml` and merges `compose.override.yaml` on top of it. The override file configures the local dev build (Dockerfiles, volume mounts).

Default ports:

* **Frontend:** `5173`
* **Backend:** `3000`
* **Database:** `5432` (exposed in dev — connect directly from your IDE)
* **pgAdmin:** `5050`

All ports are configurable via the root `.env`.

---

### 3. Node Modules & the IDE

`node_modules` are installed inside the containers at startup. Because the source directories are volume-mounted, they appear on your host after the first `docker compose up`, and your IDE will pick them up automatically — no manual `npm install` needed.

---

## Installing New Packages

Always install new dependencies **inside the appropriate container**, not on your host machine.

### 1. Enter a container:

```bash
docker exec -it <container-name> bash
```

### 2. Install the package:

```bash
npm install <package-name>
```

---

## Migrations

Migrations are SQL files managed by [node-pg-migrate](https://github.com/salsita/node-pg-migrate). They live in `database/migrations/` and are mounted into the backend container at runtime.

All migration commands run inside the backend container:

```bash
docker exec -it <backend-container> bash
```

### Create a migration

```bash
npm run migrate:create -- <migration-name>
```

This generates a new `.sql` file in `database/migrations/`. Edit it to add your `up` and `down` SQL.

### Run pending migrations

```bash
npm run migrate:up
```

### Roll back the last migration

```bash
npm run migrate:down
```
