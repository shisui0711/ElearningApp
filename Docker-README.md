# Docker Setup for ELearning App

This document outlines how to run the ELearning application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Files Overview

- `Dockerfile`: Configures the Node.js container for the Next.js application
- `docker-compose.yml`: Orchestrates the application and database services
- `.dockerignore`: Specifies files that should be excluded from the Docker image

## Getting Started

### Building and Running the Application

1. Clone the repository
2. Navigate to the project directory
3. Build and start the containers:

```bash
docker-compose up -d
```

This will start:
- The Next.js application on port 3000
- A PostgreSQL database on port 5432

### Database Setup

After the containers are running, initialize the database:

```bash
# Run migrations
docker-compose exec app pnpm prisma migrate deploy

# Seed the database
docker-compose exec app pnpm seed
```

## Environment Variables

The Docker setup uses these environment variables:

- `POSTGRES_PRISMA_URL`: Set to `postgresql://postgres:123@db:5432/elearning?schema=public` in container
- `POSTGRES_PRISMA_URL_NON_POOLING`: Same as above
- `POSTGRES_USER`: postgres
- `POSTGRES_PASSWORD`: 123
- `POSTGRES_DB`: elearning

## Common Commands

```bash
# View container logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild and restart containers
docker-compose up -d --build

# Connect to PostgreSQL database
docker-compose exec db psql -U postgres -d elearning
```

## Data Persistence

The PostgreSQL data is persisted in a named volume (`postgres-data`). This ensures your data remains even if containers are removed.

## File Uploads

The `/public/uploads` directory is mounted as a volume to ensure file uploads persist outside the container.

## Troubleshooting

### Database Connection Issues

If the application can't connect to the database:

1. Check if the database container is running:
   ```bash
   docker-compose ps
   ```

2. Verify database logs for errors:
   ```bash
   docker-compose logs db
   ```

3. Ensure the connection string in the application matches the one in docker-compose.yml

### Build Failed

If the build process fails:

1. Check if there are TypeScript errors in your code
2. Make sure all dependencies are compatible with the Node.js version in the Dockerfile
3. Increase Docker memory allocation if you encounter out-of-memory errors