// tsx configuration for better module resolution in PNPM workspace
export default {
  tsconfig: './tsconfig.json',
  nodeOptions: {
    '--experimental-specifier-resolution': 'node',
  },
  watch: {
    // Ignore directories that don't need to trigger restarts
    ignore: [
      '**/node_modules/**',
      '**/lib/**',
      '**/dist/**',
      '**/.git/**',
      '**/coverage/**',
      '**/*.log',
      '**/.env.local',
      '**/.env.*.local',
    ],
    // Add a small delay before restarting to batch file changes
    debounce: 300,
  },
};
