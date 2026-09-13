# Grove

Nature-themed personal todo app. Built with Vite, React 19, TypeScript, React Router, and date-fns. Data lives in the browser via `localStorage`.

## Demo Features

- **Today** — overview of what is due now and upcoming
- **Calendar** — week and month views
- **List** — browse and filter tasks
- **Projects** — organize work into projects
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

Open the URL printed by Vite

### Production build

```bash
npm run build
npm run preview
```

Output lands in `dist/` as static files you can host anywhere.

## Project layout

```
src/
  App.tsx                 Routes and loading splash
  main.tsx                Entry
  index.css               Theme and layout styles (including calendar grid)
  components/             Layout, LoadingScreen, TaskItem, NewTaskModal
  context/GroveContext.tsx  App state and persistence API
  data/                   storage.ts (localStorage) and seed.ts
  pages/                  Today, Calendar, List, Projects, TaskDetail
  types/                  Shared TypeScript types
  utils/                  Helpers (ids, formatting)
public/                   Static assets (favicon, icons)
```

## License

MIT License. Copyright (c) 2026 Khang Nguyen. See [LICENSE](LICENSE).
