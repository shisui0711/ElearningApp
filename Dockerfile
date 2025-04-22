# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Prisma and other packages
RUN apk add --no-cache libc6-compat python3 make g++

# Install PNPM - since your project uses PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package.json, pnpm-lock.yaml, and related files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN pnpm prisma generate

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN pnpm build

# Expose the port the app will run on
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]