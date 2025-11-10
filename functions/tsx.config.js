// tsx configuration for better module resolution in PNPM workspace
export default {
  tsconfig: './tsconfig.json',
  nodeOptions: {
    '--experimental-specifier-resolution': 'node',
  },
  watch: {
    // Ignore directories that don't need to trigger restarts
    // These patterns match the --ignore flags in package.json
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.env/**',
      '**/.firebase/**',
      '**/dist/**',
      '**/lib/**',
      '**/coverage/**',
      '**/*.log',
      '**/.env.local',
      '**/.env.*.local',
      '**/.turbo/**',
      '**/tmp/**',
      '**/temp/**',
      '**/*.tmp',
      '**/*.cache',
      // Ignore any files that might be written during query execution
      '**/functions/src/**/*.js.map',
      '**/functions/src/**/*.d.ts',
    ],
    // Add a longer delay before restarting to batch file changes and allow requests to complete
    // This prevents restarts during active API requests
    // Increased to 60 seconds to allow long-running queries (embedding generation + Firestore search + Gemini generation) to complete
    // Note: If a file change is detected during query execution, tsx watch will restart after this debounce period
    // This should be enough time for most queries to finish before a restart occurs
    debounce: 60000,
  },
};
