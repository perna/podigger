# syntax=docker/dockerfile:1

########################################
# Stage 1: Dependencies - Install all dependencies
########################################
FROM node:24.14.0-alpine AS deps

WORKDIR /app

# Install libc compatibility layer (required for some packages)
RUN apk add --no-cache libc6-compat

ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files FIRST (better layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (needed for build stage)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --cache /root/.npm

########################################
# Stage 2: Builder - Build the application
########################################
FROM node:24.14.0-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy configuration files FIRST (changes less frequently)
COPY next.config.ts postcss.config.mjs tsconfig.json ./
COPY package.json package-lock.json ./

# Copy source code LAST (changes most frequently)
COPY public ./public
COPY src ./src

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENVIRONMENT

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_ENVIRONMENT=$NEXT_PUBLIC_ENVIRONMENT \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build the application
RUN npm run build

########################################
# Stage 3: Runner - Minimal production image
########################################
FROM node:24.14.0-alpine AS runner

WORKDIR /app

# Install runtime dependencies and create non-root user
RUN apk add --no-cache libc6-compat && \
    addgroup -S nextjs -g 1001 && \
    adduser -S nextjs -u 1001

# Set production environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copy only necessary files from builder (standalone output)
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health',r=>process.exit(r.statusCode===200?0:1))"

# Start the application
CMD ["node", "server.js"]
