# ASHBOUND CREATOR v0.1.0

Independent foundation for a mobile-first 2D game creation environment.

## What works in this first core build

- Create, list, open and delete local game projects.
- Project metadata with a versioned schema.
- IndexedDB persistence on the device.
- Import and export `.ashproj` project packages.
- Import and manage project assets.
- Landscape-first workspace shell.
- Registered creation modules for characters, sprites, animation, combat, stages, world/RPG, runtime and export.
- Installable/offline-capable PWA shell.
- GitHub Pages deployment workflow.

## What is deliberately not claimed as implemented yet

The Character Studio, Sprite Workshop, Animation Timeline, Combat Designer, Stage/Tilemap Editor, World Builder, RPG Systems, IKEMEN bridge and APK/PC exporters are registered workspaces, not finished editors. They are the next implementation milestones.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push this project to a separate GitHub repository named `ASHBOUND-CREATOR`.
2. Open repository Settings → Pages.
3. Set the source to **GitHub Actions**.
4. Push to `main` or manually run the **Deploy ASHBOUND CREATOR** workflow.
5. Open the Pages URL shown in the workflow deployment.

## Project package

`.ashproj` is a ZIP archive containing `project.json` and an `assets/` folder. The project manifest has an explicit schema version so future Creator releases can migrate projects safely.

## Architecture rule

Creator project data is the source of truth. Runtime-specific files are generated outputs. IKEMEN GO is treated as a combat runtime kernel, not as the editor or the complete game engine.
