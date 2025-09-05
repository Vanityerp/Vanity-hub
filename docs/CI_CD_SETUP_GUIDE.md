# CI/CD Pipeline Setup Guide

This guide will help you set up and configure the CI/CD pipelines for VanityERP.

## 🚀 Overview

The CI/CD setup includes:
- **CI Pipeline**: Testing, linting, security scanning, and code quality checks
- **CD Pipeline**: Automated deployment to Vercel (staging/production)
- **Database Pipeline**: Automated database migrations
- **Security Pipeline**: Comprehensive security scanning
- **Performance Pipeline**: Performance monitoring and testing

## 📋 Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Vercel Account**: For deployment
3. **Database**: PostgreSQL database (staging and production)
4. **Redis**: For caching (optional)
5. **Slack**: For notifications (optional)

## 🔧 Environment Variables & Secrets

### GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

#### Required Secrets

```bash
# Database URLs
DATABASE_URL=postgresql://username:password@host:port/database
STAGING_DATABASE_URL=postgresql://username:password@staging-host:port/database
PRODUCTION_DATABASE_URL=postgresql://username:password@prod-host:port/database

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# Vercel Configuration
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

# URLs
STAGING_URL=https://your-staging-domain.vercel.app
PRODUCTION_URL=https://your-production-domain.com
```

#### Optional Secrets

```bash
# Redis (for caching)
REDIS_URL=redis://username:password@host:port

# Email Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com

# Security Scanning
SNYK_TOKEN=your-snyk-token
GITLEAKS_LICENSE=your-gitleaks-license

# Performance Monitoring
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## 🏗️ Pipeline Configuration

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Lint**: ESLint, TypeScript, and formatting checks
- **Test**: Unit and integration tests with PostgreSQL and Redis
- **Build**: Application build and type checking
- **Security**: Vulnerability scanning with Trivy
- **Dependencies**: Dependency audit and outdated package checks
- **Performance**: Lighthouse CI performance tests
- **E2E**: End-to-end tests with Playwright

### 2. CD Pipeline (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` (production deployment)
- Push to `develop` (staging deployment)
- Manual workflow dispatch

**Environments:**
- **Staging**: Automatic deployment on `develop` branch
- **Production**: Automatic deployment on `main` branch
- **Preview**: PR preview deployments

### 3. Database Pipeline (`.github/workflows/database.yml`)

**Triggers:**
- Changes to `prisma/migrations/` or `prisma/schema.prisma`
- Manual workflow dispatch

**Features:**
- Schema validation
- Migration testing
- Automated migration deployment
- Database health checks

### 4. Security Pipeline (`.github/workflows/security.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Daily schedule (2 AM UTC)
- Manual dispatch

**Scans:**
- Dependency vulnerability scanning
- CodeQL analysis
- Trivy security scanner
- Snyk security scan
- OWASP ZAP security scan
- Secrets scanning
- License compliance check

### 5. Performance Pipeline (`.github/workflows/performance.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests
- Daily schedule (3 AM UTC)
- Manual dispatch

**Tests:**
- Lighthouse CI performance tests
- Load testing with Artillery
- Bundle size analysis
- Memory usage monitoring
- Database performance testing
- API performance testing

## 🚀 Getting Started

### Step 1: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add all required secrets listed above

### Step 2: Set up Vercel

1. Create a Vercel account
2. Import your GitHub repository
3. Get your Vercel token, org ID, and project ID
4. Add them to GitHub secrets

### Step 3: Configure Database

1. Set up PostgreSQL databases for staging and production
2. Add database URLs to GitHub secrets
3. Ensure databases are accessible from GitHub Actions

### Step 4: Test the Pipelines

1. Create a test branch
2. Make a small change
3. Push to trigger the CI pipeline
4. Create a PR to test the full pipeline

## 📊 Monitoring & Notifications

### Slack Integration

1. Create a Slack app
2. Set up incoming webhooks
3. Add webhook URL to `SLACK_WEBHOOK_URL` secret
4. Configure channels for different types of notifications

### GitHub Environments

Set up GitHub environments for better control:

1. Go to Settings → Environments
2. Create `staging` and `production` environments
3. Add environment-specific secrets
4. Configure protection rules

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database URLs in secrets
   - Ensure databases are accessible
   - Verify firewall settings

2. **Vercel Deployment Failed**
   - Check Vercel token and project ID
   - Verify environment variables
   - Check build logs

3. **Tests Failing**
   - Check test database setup
   - Verify test data seeding
   - Review test configuration

4. **Security Scans Failing**
   - Check for actual security issues
   - Update dependencies
   - Review scan configurations

### Debug Commands

```bash
# Check GitHub Actions logs
gh run list
gh run view <run-id>

# Test locally
npm run test
npm run lint
npm run build

# Check database connection
npx prisma migrate status
```

## 📈 Performance Optimization

### Bundle Size Optimization

1. Monitor bundle size in CI
2. Use dynamic imports
3. Optimize images
4. Remove unused dependencies

### Database Performance

1. Monitor query performance
2. Add database indexes
3. Optimize Prisma queries
4. Use connection pooling

### Caching Strategy

1. Implement Redis caching
2. Use Next.js caching
3. Optimize API responses
4. Cache static assets

## 🔒 Security Best Practices

1. **Regular Updates**: Keep dependencies updated
2. **Secret Management**: Use GitHub secrets for sensitive data
3. **Access Control**: Limit environment access
4. **Monitoring**: Set up security alerts
5. **Auditing**: Regular security audits

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Review the troubleshooting section
3. Check the documentation
4. Create an issue in the repository

---

**Happy Deploying! 🚀**
