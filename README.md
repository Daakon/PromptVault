# PromptVault workspace

PromptVault is evolving from a single React app into a multi-target workspace that feeds three surfaces:

- **Web app** – the primary development target and source of truth for UI/UX.
- **Chrome extension** – a Manifest V3 side panel that reuses the shared React shell.
- **Desktop shell** – an Electron wrapper (Win/macOS) intended to consume the same web build.

The repo now uses npm workspaces with shared packages so logic and presentation live in one place.

PromptVault is now local-first and self-contained:

- No Gemini integration
- No API keys required
- No outbound API calls from the shared app or extension
- No CDN-loaded runtime scripts or web fonts in the app shells

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

## Install dependencies

```bash
npm install
```

This installs workspace dependencies and links the shared package across apps.

It also installs the local Tailwind/PostCSS build toolchain used to generate CSS at build time (runtime remains self-contained with no CDN styling dependencies).

## Build commands (quick reference)

Use these root-level commands for the common workflows:

```bash
npm run dev:web
npm run build:web
npm run dev:extension
npm run build:extension
npm run dev:desktop
npm run build:desktop
npm run package:desktop
```

What each command produces:

- `npm run build:web` builds the shared renderer bundle to `apps/web/dist` (including locally generated Tailwind CSS).
- `npm run build:extension` builds the Chrome extension bundle to `apps/chrome-extension/dist`.
- `npm run build:desktop` does not create an installer; it copies `apps/web/dist` into `apps/desktop/static` for local Electron production runs.
- `npm run package:desktop` builds web + desktop static assets and then runs `electron-builder` to create installable desktop artifacts.

### Output locations

- Web production bundle: `apps/web/dist/`
- Chrome extension unpacked bundle: `apps/chrome-extension/dist/`
- Chrome extension ZIP package: `apps/chrome-extension/PromptVault-extension.zip`
- Desktop local static bundle (consumed by Electron in production mode): `apps/desktop/static/`
- Desktop packaged artifacts/installers: `apps/desktop/release/`

## Web app (reference implementation)

```bash
npm run dev:web    # Start Vite dev server on http://localhost:3000
npm run build:web  # Output production bundle to apps/web/dist
```

The web app should be your primary playground for UI/logic changes—updates propagate automatically to the extension/desktop via the shared package.

Build note:

- If you change shared UI styling or Tailwind classes, rerun `npm run build:web` before refreshing desktop static assets or packaging the desktop app.

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

Build note:

- The extension now uses locally built CSS (no Tailwind CDN at runtime), so `npm run build:extension` is required after styling changes.

## Managing categories and models

Category and model lists are managed directly in the app UI (web, extension, and desktop all use the same shared interface logic).

- Categories: use the gear button next to the category filter to open **Manage Categories**.
- Models: use the sliders button next to the model filter to open **Manage Models**.
- Additions/removals persist locally in browser/Electron storage (`localStorage`).
- Removing a category does **not** delete prompts in that category; prompts remain and only the category list entry is removed.
- Removing a model also clears matching model quick-filters and resets the active model filter if that model was selected.
- Changes are local to the current profile/device unless you export/import prompts.

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

Desktop build notes:

- `npm run build:desktop` only refreshes `apps/desktop/static`; it is not an installer build.
- If the desktop app looks unstyled, rebuild in this order: `npm run build:web` then `npm run build:desktop`, then restart the Electron app.
- If the Electron app is already running while `apps/desktop/static` is refreshed, fully restart it to load the new assets.

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

Artifacts land in `apps/desktop/release/` (e.g., `PromptVault-win-0.1.0.exe`, `win-unpacked/`, and builder metadata files). Windows packaging is configured as an `nsis` installer (`.exe`). The config currently disables executable editing/signing so it runs without elevated privileges; once you have certificates, remove `signAndEditExecutable: false`.

## Testing & QA

Focus manual verification on the scenarios below whenever you touch shared logic.

**Web App**
- CRUD prompts: create, edit, and delete entries; confirm persistence in localStorage.
- Filtering/search: category toggles, model filters, quick filters, and keyword search should all combine without stale results.
- Prompt editing/tagging: create and edit prompts entirely locally; confirm no API key prompts or network-dependent enhancement actions appear.

**Chrome Extension**
- Run `npm run dev:extension`, load the unpacked side panel from `apps/chrome-extension/dist`, and verify all core flows above.
- Validate Chrome-specific affordances: side panel sizing, persistent state between sessions, clipboard copy via the browser, and permission prompts (storage only; no host permissions).
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
