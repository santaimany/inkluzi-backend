# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema FIRST (before install)
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client AFTER install
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema to production
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Generate Prisma Client in production stage too
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]