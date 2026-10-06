# ORB MASTERS

ORB MASTERS is a four-mode arcade PWA. This repository root contains the deployable web app. It uses browser ES modules and has no npm runtime dependencies or bundler.

## Requirements

- Node.js 20 or newer
- A current browser for manual gameplay checks

## Local workflow

```sh
npm start          # Serve the editable PWA source at http://127.0.0.1:4173
npm run check      # Check JavaScript syntax, local module links, PWA assets and precache files
npm test           # Run built-in Node tests for release integrity and level progression
npm run build      # Validate and stage the PWA under dist/
npm run preview    # Serve the staged release bundle
npm run release:check  # Run checks, tests and build in sequence
```

The build is a static-file staging step: no compilation is needed because the app is delivered as native browser modules. `dist/` is generated and should not be committed. The Pages workflow deploys its contents at the repository URL `/orb-mastera/`.

## Modes and progress

The app contains Cash Catcher, Bricks, Block Puzzle and Crystal Match. Each mode has 49 configured levels across five stages. Progress and currency currently live in browser `localStorage`; they do not sync between devices.

## Release boundaries

- Rewarded and interstitial ads are demo placeholders, not a real ad integration. No ad impressions or revenue are generated.
- Background music is synthesized locally through Web Audio (`src/game/ArcadeMusic.js`); no third-party recording or network audio download is used.
- Google Play Billing code/dependencies in the Android wrapper are not connected to the web shop and have not been validated as a purchase flow.
- Android signing requires a private release keystore and matching Digital Asset Links on the app's web origin. No release keystore is included. Never commit signing keys or passwords.
- When a private keystore is available, pass its location and credentials using `ORB_RELEASE_KEYSTORE`, `ORB_RELEASE_KEYSTORE_PASSWORD`, `ORB_RELEASE_KEY_ALIAS` and `ORB_RELEASE_KEY_PASSWORD` environment variables; signed `assembleRelease`/`bundleRelease` deliberately fail if they are missing.
- The Android wrapper needs a JDK and Android SDK to build. The current environment has no Java runtime, so APK/AAB packaging cannot be confirmed here.

## Deployment and phone testing

The `Deploy GitHub Pages` workflow builds and tests the PWA, then publishes `dist/` on pushes to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. Once the workflow succeeds, share `https://antondatsagolov.github.io/orb-mastera/` with phone testers. The repository must be public when using GitHub Free; GitHub Pages itself is static hosting, not a backend.

The Android TWA manifest points to the same URL. Its host must serve a Digital Asset Links file at `/.well-known/assetlinks.json` for the installed Android wrapper to open as a verified Trusted Web Activity; otherwise Android falls back to a Custom Tab.
