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
      '**/apps/web/**', // Ignore frontend changes
      '**/packages/**', // Ignore package changes unless needed
    ],
    // Increase debounce to prevent rapid restarts during active requests
    debounce: 1000,
  },
};
