#!/usr/bin/env node

/**
 * Database Setup Script for Vanity Hub
 * 
 * This script helps set up the database for different environments:
 * - Development: SQLite
 * - Production: PostgreSQL
 * 
 * Usage:
 *   node scripts/setup-database.js [environment]
 *   
 * Examples:
 *   node scripts/setup-database.js development
 *   node scripts/setup-database.js production
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ENVIRONMENTS = {
  development: {
    provider: 'sqlite',
    url: 'file:./prisma/dev.db',
    description: 'SQLite database for development'
  },
  production: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/vanity_hub?schema=public',
    description: 'PostgreSQL database for production'
  },
  test: {
    provider: 'sqlite',
    url: 'file:./prisma/test.db',
    description: 'SQLite database for testing'
  }
}

function updatePrismaSchema(environment) {
  const config = ENVIRONMENTS[environment]
  if (!config) {
    console.error(`❌ Unknown environment: ${environment}`)
    console.log('Available environments:', Object.keys(ENVIRONMENTS).join(', '))
    process.exit(1)
  }

  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')
  let schema = fs.readFileSync(schemaPath, 'utf8')

  // Update the datasource block
  const datasourceRegex = /datasource db \{[\s\S]*?\}/
  const newDatasource = `datasource db {
  provider = "${config.provider}"
  url      = env("DATABASE_URL")
}`

  schema = schema.replace(datasourceRegex, newDatasource)

  fs.writeFileSync(schemaPath, schema)
  console.log(`✅ Updated Prisma schema for ${environment} (${config.provider})`)
}

function updateEnvironmentFile(environment) {
  const config = ENVIRONMENTS[environment]
  const envPath = path.join(__dirname, '..', '.env')
  
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Update or add DATABASE_URL
  const dbUrlRegex = /^DATABASE_URL=.*$/m
  const newDbUrl = `DATABASE_URL="${config.url}"`

  if (dbUrlRegex.test(envContent)) {
    envContent = envContent.replace(dbUrlRegex, newDbUrl)
  } else {
    envContent += `\n${newDbUrl}\n`
  }

  fs.writeFileSync(envPath, envContent)
  console.log(`✅ Updated .env file with ${config.description}`)
}

function runPrismaCommands(environment) {
  console.log('🔄 Generating Prisma client...')
  try {
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated')
  } catch (error) {
    console.error('❌ Failed to generate Prisma client:', error.message)
    process.exit(1)
  }

  if (environment === 'production') {
    console.log('🔄 Running database migrations...')
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      console.log('✅ Database migrations completed')
    } catch (error) {
      console.error('❌ Failed to run migrations:', error.message)
      console.log('💡 Make sure your PostgreSQL database is running and accessible')
      process.exit(1)
    }
  } else {
    console.log('🔄 Pushing database schema...')
    try {
      execSync('npx prisma db push', { stdio: 'inherit' })
      console.log('✅ Database schema pushed')
    } catch (error) {
      console.error('❌ Failed to push schema:', error.message)
      process.exit(1)
    }
  }
}

function seedDatabase() {
  console.log('🔄 Seeding database...')
  try {
    execSync('npx prisma db seed', { stdio: 'inherit' })
    console.log('✅ Database seeded successfully')
  } catch (error) {
    console.log('⚠️ Database seeding failed or no seed script found')
    console.log('💡 You can create a seed script at prisma/seed.ts')
  }
}

function main() {
  const environment = process.argv[2] || 'development'
  
  console.log(`🚀 Setting up Vanity Hub database for ${environment} environment`)
  console.log('=' .repeat(60))

  // Validate environment
  if (!ENVIRONMENTS[environment]) {
    console.error(`❌ Unknown environment: ${environment}`)
    console.log('Available environments:', Object.keys(ENVIRONMENTS).join(', '))
    process.exit(1)
  }

  const config = ENVIRONMENTS[environment]
  console.log(`📋 Configuration: ${config.description}`)
  console.log(`🔗 Provider: ${config.provider}`)
  console.log(`🔗 URL: ${config.url}`)
  console.log('')

  try {
    // Step 1: Update Prisma schema
    updatePrismaSchema(environment)

    // Step 2: Update environment file
    updateEnvironmentFile(environment)

    // Step 3: Run Prisma commands
    runPrismaCommands(environment)

    // Step 4: Seed database (optional)
    if (process.argv.includes('--seed')) {
      seedDatabase()
    }

    console.log('')
    console.log('🎉 Database setup completed successfully!')
    console.log('')
    console.log('Next steps:')
    if (environment === 'production') {
      console.log('1. Make sure your PostgreSQL server is running')
      console.log('2. Update DATABASE_URL in your production environment')
      console.log('3. Run database migrations: npx prisma migrate deploy')
    } else {
      console.log('1. Start your development server: npm run dev')
      console.log('2. Access Prisma Studio: npx prisma studio')
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Vanity Hub Database Setup Script

Usage:
  node scripts/setup-database.js [environment] [options]

Environments:
  development  - SQLite database for local development (default)
  production   - PostgreSQL database for production
  test         - SQLite database for testing

Options:
  --seed       - Run database seeding after setup
  --help, -h   - Show this help message

Examples:
  node scripts/setup-database.js development
  node scripts/setup-database.js production --seed
  node scripts/setup-database.js test
`)
  process.exit(0)
}

main()
