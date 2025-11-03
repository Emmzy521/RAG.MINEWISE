// tsx configuration for better module resolution in PNPM workspace
export default {
  tsconfig: './tsconfig.json',
  nodeOptions: {
    '--experimental-specifier-resolution': 'node',
  },
};
