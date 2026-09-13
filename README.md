# Grove

Nature-themed personal todo app. Built with Vite, React 19, TypeScript, React Router, and date-fns. Data lives in the browser via `localStorage`.

## Demo Features

- **Today** — overview of what is due now and upcoming
- **Calendar** — week and month views with a rigid equal-column grid
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

## GitHub Pages

Grove is a static SPA and works on GitHub Pages.

1. For **project pages** at `https://USER.github.io/REPO/`, build with a matching base path:

   ```bash
   VITE_BASE=/REPO/ npm run build
   ```

   On Windows PowerShell:

   ```powershell
   $env:VITE_BASE="/REPO/"; npm run build
   ```

2. Deploy the contents of `dist/`.

3. Copy `index.html` to `404.html` in the deployed output so deep links (for example `/calendar` or `/task/:id`) resolve on project pages:

   ```bash
   cp dist/index.html dist/404.html
   ```

4. Task data is stored in each browser's `localStorage`. There's no server sync across devices or browsers for this demo.

User Pages (`https://USER.github.io/`) can keep the default base `/`.

`vite.config.ts` reads `process.env.VITE_BASE` (default `/`). The router uses `import.meta.env.BASE_URL` as its basename.

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
