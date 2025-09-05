# Vanity Hub - Project Architecture

## 🎯 **Overview**

This document provides a comprehensive overview of Vanity Hub's architecture, including system design, technology stack, data flow, and architectural decisions. The system is designed for scalability, maintainability, and performance.

## 🏗️ **System Architecture**

### **High-Level Architecture**
```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App - Future]
        API_CLIENT[External API Clients]
    end
    
    subgraph "Application Layer"
        NEXTJS[Next.js 15 App Router]
        AUTH[NextAuth.js]
        MIDDLEWARE[Middleware Layer]
    end
    
    subgraph "Business Logic Layer"
        SERVICES[Business Services]
        VALIDATION[Validation Layer]
        CACHE[Caching Layer]
        MONITORING[Monitoring Layer]
    end
    
    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        DATABASE[(PostgreSQL)]
        REDIS[(Redis Cache)]
        FILES[File Storage]
    end
    
    subgraph "External Services"
        EMAIL[Email Service]
        SMS[SMS Service - Future]
        PAYMENT[Payment Gateway - Future]
        ANALYTICS[Analytics Service]
    end
    
    WEB --> NEXTJS
    MOBILE --> NEXTJS
    API_CLIENT --> NEXTJS
    
    NEXTJS --> AUTH
    NEXTJS --> MIDDLEWARE
    NEXTJS --> SERVICES
    
    SERVICES --> VALIDATION
    SERVICES --> CACHE
    SERVICES --> MONITORING
    
    SERVICES --> PRISMA
    CACHE --> REDIS
    PRISMA --> DATABASE
    
    SERVICES --> EMAIL
    SERVICES --> SMS
    SERVICES --> PAYMENT
    SERVICES --> ANALYTICS
```

### **Technology Stack**

#### **Frontend**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **State Management**: React Context + Custom Hooks
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

#### **Backend**
- **Runtime**: Node.js
- **Framework**: Next.js 15 API Routes
- **Language**: TypeScript
- **Authentication**: NextAuth.js
- **Database ORM**: Prisma
- **Validation**: Zod with custom validation layer
- **Caching**: Redis with fallback to memory
- **Rate Limiting**: Custom Redis-based implementation

#### **Database & Storage**
- **Primary Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: Local filesystem (Future: AWS S3/CloudFlare R2)
- **Search**: PostgreSQL full-text search (Future: Elasticsearch)

#### **DevOps & Monitoring**
- **Deployment**: Vercel (Production), Docker (Development)
- **Monitoring**: Custom monitoring service + Error tracking
- **Logging**: Custom logger with structured logging
- **Testing**: Jest + React Testing Library + Playwright
- **CI/CD**: GitHub Actions

## 📊 **Data Architecture**

### **Database Schema Overview**
```mermaid
erDiagram
    User ||--o{ Staff : "is"
    Location ||--o{ Staff : "works_at"
    Location ||--o{ Service : "offers"
    Location ||--o{ Inventory : "has"
    
    Client ||--o{ Appointment : "books"
    Staff ||--o{ Appointment : "performs"
    Service ||--o{ Appointment : "for"
    Location ||--o{ Appointment : "at"
    
    Product ||--o{ Inventory : "tracked_in"
    Product ||--o{ TransactionItem : "sold_as"
    
    Transaction ||--o{ TransactionItem : "contains"
    Client ||--o{ Transaction : "makes"
    Staff ||--o{ Transaction : "processes"
    Location ||--o{ Transaction : "at"
    
    User {
        string id PK
        string email UK
        string name
        string role
        datetime createdAt
        datetime updatedAt
    }
    
    Client {
        string id PK
        string firstName
        string lastName
        string email UK
        string phone UK
        string address
        json preferences
        datetime createdAt
        datetime updatedAt
    }
    
    Staff {
        string id PK
        string userId FK
        string firstName
        string lastName
        string email UK
        string phone
        string role
        json locationIds
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Location {
        string id PK
        string name
        string address
        string city
        string state
        string zipCode
        string country
        string phone
        string timezone
        json businessHours
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Service {
        string id PK
        string name
        string description
        string categoryId
        integer duration
        decimal price
        json locationIds
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Appointment {
        string id PK
        string clientId FK
        string serviceId FK
        string staffId FK
        string locationId FK
        datetime date
        integer duration
        string notes
        decimal price
        string status
        boolean reminderSent
        datetime createdAt
        datetime updatedAt
    }
    
    Product {
        string id PK
        string name
        string description
        string categoryId
        string sku UK
        string barcode
        decimal price
        decimal cost
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    Inventory {
        string id PK
        string productId FK
        string locationId FK
        integer quantity
        integer minStockLevel
        integer maxStockLevel
        datetime lastUpdated
    }
    
    Transaction {
        string id PK
        string clientId FK
        string staffId FK
        string locationId FK
        string paymentMethod
        decimal subtotal
        decimal tax
        decimal discount
        decimal total
        string notes
        datetime createdAt
    }
    
    TransactionItem {
        string id PK
        string transactionId FK
        string type
        string itemId
        integer quantity
        decimal price
        decimal discount
        decimal tax
    }
```

### **Data Flow Architecture**
```mermaid
graph LR
    subgraph "Client Request"
        USER[User Action]
        FORM[Form Submission]
        API[API Call]
    end
    
    subgraph "Validation Layer"
        SCHEMA[Zod Schema]
        SANITIZE[Data Sanitization]
        BUSINESS[Business Rules]
        SECURITY[Security Validation]
    end
    
    subgraph "Business Logic"
        SERVICE[Business Service]
        CACHE_CHECK[Cache Check]
        DB_OPERATION[Database Operation]
        CACHE_UPDATE[Cache Update]
    end
    
    subgraph "Data Persistence"
        PRISMA[Prisma ORM]
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
    end
    
    subgraph "Response"
        TRANSFORM[Data Transformation]
        RESPONSE[API Response]
        UI_UPDATE[UI Update]
    end
    
    USER --> FORM
    FORM --> API
    API --> SCHEMA
    SCHEMA --> SANITIZE
    SANITIZE --> BUSINESS
    BUSINESS --> SECURITY
    SECURITY --> SERVICE
    SERVICE --> CACHE_CHECK
    CACHE_CHECK --> DB_OPERATION
    DB_OPERATION --> PRISMA
    PRISMA --> POSTGRES
    DB_OPERATION --> CACHE_UPDATE
    CACHE_UPDATE --> REDIS
    SERVICE --> TRANSFORM
    TRANSFORM --> RESPONSE
    RESPONSE --> UI_UPDATE
```

## 🔧 **Component Architecture**

### **Frontend Component Hierarchy**
```
App Layout
├── Navigation
│   ├── Main Navigation
│   ├── User Navigation
│   └── Mobile Navigation
├── Dashboard Layout
│   ├── Sidebar
│   ├── Header
│   └── Content Area
├── Feature Components
│   ├── Client Management
│   │   ├── Client List
│   │   ├── Client Form
│   │   ├── Client Details
│   │   └── Client Search
│   ├── Appointment Management
│   │   ├── Calendar View
│   │   ├── Appointment Form
│   │   ├── Appointment List
│   │   └── Scheduling Logic
│   ├── Service Management
│   │   ├── Service List
│   │   ├── Service Form
│   │   └── Service Categories
│   └── Inventory Management
│       ├── Inventory Dashboard
│       ├── Stock Management
│       ├── Transfer System
│       └── Analytics
├── Shared Components
│   ├── UI Components (shadcn/ui)
│   ├── Form Components
│   ├── Chart Components
│   ├── Modal Components
│   └── Loading Components
└── Providers
    ├── Auth Provider
    ├── Theme Provider
    ├── Location Provider
    └── Currency Provider
```

### **Backend Service Architecture**
```
API Layer
├── Route Handlers
│   ├── Authentication Routes
│   ├── Client Routes
│   ├── Appointment Routes
│   ├── Service Routes
│   ├── Staff Routes
│   ├── Inventory Routes
│   └── Analytics Routes
├── Middleware
│   ├── Authentication Middleware
│   ├── Rate Limiting Middleware
│   ├── Validation Middleware
│   └── Error Handling Middleware
├── Business Services
│   ├── Client Service
│   ├── Appointment Service
│   ├── Service Management
│   ├── Staff Service
│   ├── Inventory Service
│   └── Analytics Service
├── Data Access Layer
│   ├── Prisma Client
│   ├── Database Utilities
│   ├── Cache Service
│   └── Query Optimization
└── External Services
    ├── Email Service
    ├── SMS Service (Future)
    ├── Payment Service (Future)
    └── File Storage Service
```

## 🔒 **Security Architecture**

### **Security Layers**
```mermaid
graph TB
    subgraph "Client Security"
        CSP[Content Security Policy]
        HTTPS[HTTPS Enforcement]
        CORS[CORS Configuration]
    end
    
    subgraph "Application Security"
        AUTH[Authentication]
        AUTHZ[Authorization]
        RATE[Rate Limiting]
        VALIDATION[Input Validation]
    end
    
    subgraph "Data Security"
        ENCRYPT[Data Encryption]
        SANITIZE[Data Sanitization]
        AUDIT[Audit Logging]
        BACKUP[Secure Backups]
    end
    
    subgraph "Infrastructure Security"
        FIREWALL[Firewall Rules]
        VPN[VPN Access]
        MONITORING[Security Monitoring]
        UPDATES[Security Updates]
    end
    
    CSP --> AUTH
    HTTPS --> AUTH
    CORS --> AUTH
    
    AUTH --> ENCRYPT
    AUTHZ --> ENCRYPT
    RATE --> ENCRYPT
    VALIDATION --> ENCRYPT
    
    ENCRYPT --> FIREWALL
    SANITIZE --> FIREWALL
    AUDIT --> FIREWALL
    BACKUP --> FIREWALL
```

### **Authentication & Authorization Flow**
```mermaid
sequenceDiagram
    participant User
    participant NextAuth
    participant Database
    participant API
    participant Resource
    
    User->>NextAuth: Login Request
    NextAuth->>Database: Verify Credentials
    Database-->>NextAuth: User Data
    NextAuth-->>User: Session Token
    
    User->>API: API Request + Session
    API->>NextAuth: Validate Session
    NextAuth-->>API: User Info
    API->>API: Check Permissions
    API->>Resource: Access Resource
    Resource-->>API: Resource Data
    API-->>User: Response
```

## 📈 **Performance Architecture**

### **Caching Strategy**
```mermaid
graph LR
    subgraph "Client-Side Caching"
        BROWSER[Browser Cache]
        REACT[React Query Cache]
        LOCAL[Local Storage]
    end
    
    subgraph "Server-Side Caching"
        NEXT[Next.js Cache]
        REDIS[Redis Cache]
        MEMORY[Memory Cache]
    end
    
    subgraph "Database Optimization"
        INDEXES[Database Indexes]
        QUERIES[Optimized Queries]
        POOLING[Connection Pooling]
    end
    
    BROWSER --> NEXT
    REACT --> REDIS
    LOCAL --> MEMORY
    
    NEXT --> INDEXES
    REDIS --> QUERIES
    MEMORY --> POOLING
```

### **Performance Monitoring**
- **Real User Monitoring**: Web Vitals tracking
- **Application Performance**: Response time monitoring
- **Database Performance**: Query performance tracking
- **Cache Performance**: Hit ratio monitoring
- **Error Tracking**: Comprehensive error logging

## 🔄 **Deployment Architecture**

### **Development Environment**
```
Local Development
├── Next.js Development Server
├── PostgreSQL (Docker)
├── Redis (Docker)
├── File Storage (Local)
└── Email Service (Mock)
```

### **Production Environment**
```
Production (Vercel)
├── Next.js Application
├── PostgreSQL (Managed)
├── Redis (Managed)
├── File Storage (CDN)
├── Email Service (SendGrid)
└── Monitoring (Custom)
```

### **CI/CD Pipeline**
```mermaid
graph LR
    DEV[Development] --> PR[Pull Request]
    PR --> TESTS[Automated Tests]
    TESTS --> REVIEW[Code Review]
    REVIEW --> MERGE[Merge to Main]
    MERGE --> BUILD[Build & Deploy]
    BUILD --> STAGING[Staging Environment]
    STAGING --> PROD[Production Deployment]
    
    TESTS --> UNIT[Unit Tests]
    TESTS --> INTEGRATION[Integration Tests]
    TESTS --> E2E[E2E Tests]
    TESTS --> LINT[Linting]
    TESTS --> TYPE[Type Checking]
```

## 📊 **Monitoring & Observability**

### **Monitoring Stack**
- **Application Monitoring**: Custom monitoring service
- **Error Tracking**: Custom error tracking with grouping
- **Performance Monitoring**: Response time and throughput tracking
- **Infrastructure Monitoring**: Server and database metrics
- **User Analytics**: User behavior and feature usage

### **Alerting Strategy**
- **Critical Alerts**: System down, database errors, security breaches
- **Warning Alerts**: High response times, low cache hit ratios, high error rates
- **Info Alerts**: Deployment notifications, scheduled maintenance

## 🔮 **Future Architecture Considerations**

### **Scalability Improvements**
- **Microservices**: Break down monolith into focused services
- **Event-Driven Architecture**: Implement event sourcing and CQRS
- **API Gateway**: Centralized API management and routing
- **Container Orchestration**: Kubernetes for container management

### **Technology Upgrades**
- **Database Sharding**: Horizontal database scaling
- **CDN Integration**: Global content delivery
- **Search Engine**: Elasticsearch for advanced search
- **Message Queue**: Redis Pub/Sub or RabbitMQ for async processing

### **Mobile Architecture**
- **React Native**: Cross-platform mobile application
- **API Optimization**: Mobile-specific API endpoints
- **Offline Support**: Local data synchronization
- **Push Notifications**: Real-time mobile notifications

---

**Last Updated**: 2025-06-27  
**Architecture Version**: v2.0  
**Next Review**: 2025-07-27
