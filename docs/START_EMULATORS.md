# How to Start Firebase Emulators

## Quick Start

1. **Build the functions** (required before starting emulators):
   ```bash
   cd apps/functions
   pnpm build
   ```

2. **Start the emulators** (from project root):
   ```bash
   firebase emulators:start
   ```

   Or start specific emulators:
   ```bash
   firebase emulators:start --only functions,firestore,auth
   ```

## What Gets Started

- **Functions Emulator**: http://localhost:5001
- **Firestore Emulator**: http://localhost:8080
- **Auth Emulator**: http://localhost:9099
- **Emulator UI**: http://localhost:4000

## API Endpoint

Your API endpoint will be:
```
http://localhost:5001/minewise-ai-4a4da/us-central1/api
```

## Troubleshooting

If you get build errors:
1. Make sure you're in the `apps/functions` directory
2. Run `pnpm build` to compile TypeScript
3. Check for any TypeScript errors and fix them

If the emulators don't start:
1. Make sure Firebase CLI is installed: `npm install -g firebase-tools`
2. Make sure you're logged in: `firebase login`
3. Check that ports 4000, 5001, 5000, 8080, and 9099 are available












