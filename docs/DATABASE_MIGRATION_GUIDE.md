# Database Migration Guide

This guide covers migrating Vanity Hub from SQLite (development) to PostgreSQL (production).

## Overview

Vanity Hub supports multiple database configurations:
- **Development**: SQLite for local development
- **Production**: PostgreSQL for scalable production deployment
- **Testing**: SQLite for automated testing

## Quick Start

### 1. Development Setup (SQLite)

```bash
# Set up development database
npm run db:setup:dev

# Or manually
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 2. Production Setup (PostgreSQL)

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Set up production database
npm run db:setup:prod

# Or manually
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
```

## Detailed Migration Steps

### Step 1: Install PostgreSQL

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Check services are running
docker-compose ps
```

#### Option B: Local Installation

1. Install PostgreSQL 15+
2. Create database and user:

```sql
CREATE DATABASE vanity_hub;
CREATE USER vanity_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vanity_hub TO vanity_user;
```

### Step 2: Update Environment Configuration

1. Copy environment template:
```bash
cp .env.example .env.local
```

2. Update database URL in `.env.local`:
```env
# For Docker setup
DATABASE_URL="postgresql://vanity_user:vanity_password@localhost:5432/vanity_hub?schema=public"

# For local PostgreSQL
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/vanity_hub?schema=public"
```

### Step 3: Update Prisma Schema

The schema is already configured for PostgreSQL. If you need to switch back to SQLite:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 4: Run Migrations

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

## Environment-Specific Commands

### Development Commands

```bash
# Setup development environment
npm run db:setup:dev

# Reset development database
npm run db:reset

# Fresh development setup
npm run db:fresh
```

### Production Commands

```bash
# Setup production environment
npm run db:setup:prod

# Deploy migrations (production)
npm run db:migrate:deploy

# Generate client only
npm run db:generate
```

### Testing Commands

```bash
# Setup test environment
npm run db:setup:test

# Run tests with fresh database
npm run test
```

## Data Migration

### Migrating from SQLite to PostgreSQL

1. **Export SQLite data**:
```bash
# Export to SQL
sqlite3 prisma/dev.db .dump > backup.sql

# Or use Prisma
npx prisma db pull
```

2. **Import to PostgreSQL**:
```bash
# Clean import (recommended)
npm run db:reset
npm run db:seed

# Or manual import
psql -h localhost -U vanity_user -d vanity_hub -f backup.sql
```

## Troubleshooting

### Common Issues

#### 1. Connection Refused
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

#### 2. Permission Denied
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE vanity_hub TO vanity_user;
GRANT ALL ON SCHEMA public TO vanity_user;
```

#### 3. Migration Conflicts
```bash
# Reset migrations
npm run db:migrate:reset

# Or force reset
npx prisma migrate reset --force
```

#### 4. Schema Drift
```bash
# Check schema status
npx prisma migrate status

# Reset to match schema
npx prisma db push --force-reset
```

### Performance Optimization

#### 1. Database Indexes
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_appointments_date ON "Appointment"(date);
CREATE INDEX idx_appointments_staff ON "Appointment"("staffId");
CREATE INDEX idx_clients_email ON "User"(email) WHERE role = 'CLIENT';
```

#### 2. Connection Pooling
```env
# Add to .env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public&connection_limit=10&pool_timeout=20"
```

## Backup and Recovery

### Automated Backups

```bash
# Create backup script
#!/bin/bash
pg_dump -h localhost -U vanity_user vanity_hub > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

```bash
# Restore database
psql -h localhost -U vanity_user -d vanity_hub < backup_file.sql
```

## Monitoring

### Database Health Checks

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('vanity_hub'));

-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'vanity_hub';

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Performance Monitoring

```bash
# Enable query logging
docker-compose exec postgres psql -U vanity_user -d vanity_hub -c "ALTER SYSTEM SET log_statement = 'all';"

# View logs
docker-compose logs -f postgres
```

## Security Considerations

1. **Use strong passwords** for database users
2. **Enable SSL** in production
3. **Restrict network access** to database
4. **Regular security updates** for PostgreSQL
5. **Backup encryption** for sensitive data

## Production Deployment

### Environment Variables

```env
# Production database
DATABASE_URL="postgresql://user:pass@prod-host:5432/vanity_hub_prod?sslmode=require"

# Connection pooling
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
```

### SSL Configuration

```env
# Enable SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&sslcert=client-cert.pem&sslkey=client-key.pem&sslrootcert=ca-cert.pem"
```

## Support

For additional help:
1. Check the [Prisma documentation](https://www.prisma.io/docs/)
2. Review PostgreSQL logs: `docker-compose logs postgres`
3. Use Prisma Studio: `npm run db:studio`
4. Check database status: `npx prisma migrate status`
