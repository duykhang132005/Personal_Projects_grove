# Grove

Nature-themed personal todo app. Built with Vite, React 19, TypeScript, React Router, and date-fns. Data lives in the browser via `localStorage`.

## Features

- **Today** — overview of what is due now and upcoming
- **Calendar** — week and month views with a rigid equal-column grid
- **List** — browse and filter tasks
- **Projects** — organize work into projects
- **Garden** — one plant grown from weekly XP (daily water + task completion)
- **Task detail** — description, priority, due date/time, tags, links, notes, breakdowns, and mini-steps
- **Persistence** — `localStorage`, JSON export/import, and seed reset
- **Loading splash** — shown while the app boots and React hydrates

## Requirements

- Node.js 18 or newer (recommended)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck and production build (`tsc -b && vite build`) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint with oxlint |

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview
```

Output lands in `dist/` as static files you can host anywhere.

## GitHub Pages

Live site (after you enable Pages): https://duykhang132005.github.io/Personal_Projects_grove/

Source: https://github.com/duykhang132005/Personal_Projects_grove

Grove is a static SPA. Production builds default to base path /Personal_Projects_grove/. Local dev still serves from /.

### Automatic deploy

This repo includes .github/workflows/deploy-pages.yml. After you push to main:

1. Open the repo on GitHub, then Settings, then Pages.
2. Under Build and deployment, set Source to GitHub Actions.
3. Allow the workflow to run (Actions tab). The site URL appears when deploy finishes.

The production build also writes dist/404.html (copy of index.html) so deep links like /calendar work on project Pages.

### Manual build

Use the project build script. Override the base if needed by setting env VITE_BASE to / before building.

Task data stays in each browser localStorage (no server sync).

## Project layout

```
src/
  App.tsx                 Routes and loading splash
  main.tsx                Entry
  index.css               Theme and layout styles (including calendar grid)
  components/             Layout, LoadingScreen, TaskItem, NewTaskModal
  context/GroveContext.tsx  App state and persistence API
  data/                   storage.ts (localStorage) and seed.ts
  pages/                  Today, Calendar, List, Projects, Garden, TaskDetail
  types/                  Shared TypeScript types
  utils/                  Helpers (ids, formatting)
public/                   Static assets (favicon, icons)
```

## License

MIT License. Copyright (c) 2026 Khang Nguyen. See [LICENSE](LICENSE).
