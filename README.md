# PromptVault workspace

PromptVault is evolving from a single React app into a multi-target workspace that feeds three surfaces:

- **Web app** – the primary development target and source of truth for UI/UX.
- **Chrome extension** – a Manifest V3 side panel that reuses the shared React shell.
- **Desktop shell** – an Electron wrapper (Win/macOS) intended to consume the same web build.

The repo now uses npm workspaces with shared packages so logic and presentation live in one place.

## Repository layout

```
apps/
  web/               # Vite app used for web dev and as renderer bundle
  chrome-extension/  # Manifest v3 bundle + packing script
  desktop/           # Electron main & preload processes
packages/
  app/               # Shared React App component, types, services, UI modules
```

## Prerequisites

- Node.js 18+
- npm 10+
- A Gemini API key (for prompt enhancement/tag suggestions)

Create `.env.local` at the repo root and set:

```
GEMINI_API_KEY=your-key-here
```

Both Vite configs read from the repo root so the same key is injected everywhere.

## Install dependencies

```bash
npm install
```

This installs workspace dependencies and links the shared package across apps.

## Web app (reference implementation)

```bash
npm run dev:web    # Start Vite dev server on http://localhost:3000
npm run build:web  # Output production bundle to apps/web/dist
```

The web app should be your primary playground for UI/logic changes—updates propagate automatically to the extension/desktop via the shared package.

## Chrome extension

Development flow:

1. Build (watch mode) so Chrome can load directly from `apps/chrome-extension/dist`:
   ```bash
   npm run dev:extension
   ```
2. In Chrome, load an unpacked extension from `apps/chrome-extension/dist` (enable the new side panel entry).

Release packaging:

```bash
npm run build:extension         # one-off build
npm run package --workspace @prompt-vault/chrome-extension
```

The packaging script zips `apps/chrome-extension/dist` into `apps/chrome-extension/PromptVault-extension.zip`, ready for Chrome Web Store submission.

## Desktop shells (Electron)

Status: scaffolding is in place and currently loads the web app either from the Vite dev server (during development) or from a copied static build (after running the new desktop build pipeline). Native menus, IPC, auto-updates, and installers will be fleshed out in upcoming phases.

Dev workflow:

```bash
# Terminal 1
npm run dev:web

# Terminal 2
npm run dev:desktop
```

Production smoke test (loads the copied static bundle):

```bash
npm run build:web
npm run build --workspace @prompt-vault/desktop
npm run start --workspace @prompt-vault/desktop
```

The `@prompt-vault/desktop` build script copies `apps/web/dist` into `apps/desktop/static`, which the Electron shell consumes when no dev server URL is provided.

The desktop shell hides its menu bar for a cleaner look and now exposes native controls directly in the header: a pin toggle (to keep the window on top) and a transparency popover that adjusts opacity for distraction-free workflows. Set the environment variable `PROMPTVAULT_ALWAYS_ON_TOP=true` or `PROMPTVAULT_OPACITY=0.85` before starting the desktop app if you want default pinning/opacity.

### Packaging (Electron Builder)

Use the new workspace-level helper to generate signed-release-ready Windows installers (macOS/Linux targets are configured but require running on those OSes):

```bash
npm run package:desktop
```

This script:
1. Builds the shared web bundle.
2. Copies it into `apps/desktop/static`.
3. Invokes `electron-builder` with configuration from `apps/desktop/electron-builder.yml`.

Artifacts land in `apps/desktop/release/` (e.g., `PromptVault-win-0.1.0.exe` plus the unpacked folder). The config currently disables executable editing/signing so it runs without elevated privileges; once you have certificates, remove `signAndEditExecutable: false`.

## Testing & QA

Focus manual verification on the scenarios below whenever you touch shared logic.

**Web App**
- CRUD prompts: create, edit, and delete entries; confirm persistence in localStorage.
- Filtering/search: category toggles, model filters, quick filters, and keyword search should all combine without stale results.
- Prompt enhancement/tag suggestions: set `GEMINI_API_KEY`, click enhance/tag buttons, and handle failures gracefully when the key is missing.

**Chrome Extension**
- Run `npm run dev:extension`, load the unpacked side panel from `apps/chrome-extension/dist`, and verify all core flows above.
- Validate Chrome-specific affordances: side panel sizing, persistent state between sessions, clipboard copy via the browser, and permission prompts (storage, host permissions).
- Perform a final release dry run with `npm run package --workspace @prompt-vault/chrome-extension` and sideload the generated ZIP.

**Desktop**
- Dev mode: start the Vite server + `npm run dev:desktop` and ensure hot reload works; verify window chrome (title bar, resizing).
- Production mode: after running the desktop build pipeline, launch `npm run start --workspace @prompt-vault/desktop` and confirm it reads from `apps/desktop/static` with networking disabled (simulate offline usage if possible).
- Basic native smoke checks: clipboard copy, keyboard shortcuts, and window lifecycle (minimize, reopen, quit on Windows vs macOS behavior).
- Window pinning & transparency: toggle the header pin button (or use the `PROMPTVAULT_ALWAYS_ON_TOP` env var) and adjust opacity via the droplet popover (or `PROMPTVAULT_OPACITY`). Confirm the Electron window stays above others and opacity changes persist through interactions.
- Installer QA: execute `npm run package:desktop`, install the generated EXE from `apps/desktop/release`, confirm it launches, uninstall, and rerun to ensure upgrades behave.

## Next steps

- Harden extension UX (permissions review, Chrome Store listing assets, analytics/privacy copy).
- Expand the Electron shell with IPC bridges for filesystem, notifications, and auto-update.
- Extract additional shared utilities/design tokens into dedicated packages as features grow.
- Add CI jobs to build/test every target and store the release artifacts.
