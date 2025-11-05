# -------------------------------------------
# STAGE 1: Build & Install Dependencies (Builder Stage)
# -------------------------------------------
    FROM node:18-slim AS builder

    # Set up PNPM environment
    ENV PNPM_HOME="/pnpm"
    ENV PATH="$PNPM_HOME:$PATH"
    RUN corepack enable 
    # RUN npm install pnpm -g # Removed: corepack enables pnpm, avoiding EEXIST error.
    
    WORKDIR /app
    
    # Copy Monorepo Configuration and Source Files
    # The context is the project root ('.'), so COPY works from the root.
    COPY package.json ./package.json
    COPY pnpm-lock.yaml ./pnpm-lock.yaml
    COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
    COPY packages/ ./packages/
    COPY apps/ ./apps/
    COPY functions/ ./functions/
    
    # Install ALL dependencies (Full monorepo install)
    # Using 'pnpm install' here requires a clean local lockfile.
    RUN pnpm install
    
    # --- CRITICAL FIX: Correct Pnpm Filter Syntax ---
    # Use the directory structure with the ellipsis (...) to ensure the command finds and builds the project.
    RUN pnpm run --filter ./functions... build 
    
    # -------------------------------------------
    # STAGE 2: Final Runtime Image (The Deployment Image)
    # -------------------------------------------
    FROM node:18-slim AS runner
    
    # Create a non-root user for security (Cloud Run best practice)
    RUN groupadd -r appgroup && useradd -r -g appgroup appuser
    USER appuser
    
    # Set the final runtime working directory
    WORKDIR /app
    
    # --- Copy Production Assets from Builder Stage ---
    
    # 1. Copy the entire node_modules from the builder stage
    # This is the most reliable way to handle pnpm's linking structure in CI.
    COPY --from=builder /app/node_modules ./node_modules
    
    # 2. Copy the compiled JavaScript code (the 'lib' folder for bundled output)
    COPY --from=builder /app/functions/lib ./lib
    
    # 3. Copy the package.json of the specific app (for the 'start' script)
    COPY functions/package.json ./package.json
    
    # Set runtime variables
    ENV NODE_ENV=production
    ENV PORT 8080 
    EXPOSE 8080
    
    # Specify the command to run the application entry point
    # Note: For Firebase Functions, the entry point is lib/index.js (bundled)
    CMD [ "node", "lib/index.js" ]