// Database Query Optimization and Indexing Service
import { PrismaClient } from '@prisma/client'

// Query performance monitoring interface
interface QueryPerformance {
  query: string
  duration: number
  timestamp: number
  parameters?: any
  rowsAffected?: number
  cached?: boolean
}

// Index recommendation interface
interface IndexRecommendation {
  table: string
  columns: string[]
  type: 'btree' | 'hash' | 'gin' | 'gist'
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedImprovement: string
}

class DatabaseOptimizationService {
  private queryLog: QueryPerformance[] = []
  private slowQueryThreshold = 1000 // 1 second
  private maxLogSize = 1000

  /**
   * Recommended database indexes for optimal performance
   */
  getRecommendedIndexes(): IndexRecommendation[] {
    return [
      // Appointments table indexes
      {
        table: 'appointments',
        columns: ['date', 'locationId'],
        type: 'btree',
        reason: 'Frequently queried by date and location for calendar views',
        priority: 'high',
        estimatedImprovement: '70-80% faster appointment queries'
      },
      {
        table: 'appointments',
        columns: ['staffId', 'status'],
        type: 'btree',
        reason: 'Staff schedule queries and status filtering',
        priority: 'high',
        estimatedImprovement: '60-70% faster staff schedule queries'
      },
      {
        table: 'appointments',
        columns: ['clientId'],
        type: 'btree',
        reason: 'Client appointment history lookups',
        priority: 'medium',
        estimatedImprovement: '50-60% faster client history queries'
      },
      {
        table: 'appointments',
        columns: ['createdAt'],
        type: 'btree',
        reason: 'Recent appointments and analytics queries',
        priority: 'medium',
        estimatedImprovement: '40-50% faster recent data queries'
      },

      // Inventory table indexes
      {
        table: 'inventory',
        columns: ['locationId', 'productId'],
        type: 'btree',
        reason: 'Location-specific inventory lookups',
        priority: 'high',
        estimatedImprovement: '80-90% faster inventory queries'
      },
      {
        table: 'inventory',
        columns: ['quantity'],
        type: 'btree',
        reason: 'Low stock alerts and inventory reports',
        priority: 'medium',
        estimatedImprovement: '50-60% faster stock level queries'
      },
      {
        table: 'inventory',
        columns: ['updatedAt'],
        type: 'btree',
        reason: 'Recent inventory changes tracking',
        priority: 'low',
        estimatedImprovement: '30-40% faster change tracking'
      },

      // Transactions table indexes
      {
        table: 'transactions',
        columns: ['locationId', 'createdAt'],
        type: 'btree',
        reason: 'Location-specific transaction reports by date',
        priority: 'high',
        estimatedImprovement: '70-80% faster transaction reports'
      },
      {
        table: 'transactions',
        columns: ['staffId'],
        type: 'btree',
        reason: 'Staff performance and commission calculations',
        priority: 'medium',
        estimatedImprovement: '60-70% faster staff reports'
      },
      {
        table: 'transactions',
        columns: ['clientId'],
        type: 'btree',
        reason: 'Client purchase history and loyalty calculations',
        priority: 'medium',
        estimatedImprovement: '50-60% faster client analytics'
      },
      {
        table: 'transactions',
        columns: ['total'],
        type: 'btree',
        reason: 'Revenue analytics and high-value transaction queries',
        priority: 'low',
        estimatedImprovement: '40-50% faster revenue queries'
      },

      // Staff table indexes
      {
        table: 'staff',
        columns: ['locationId', 'isActive'],
        type: 'btree',
        reason: 'Active staff lookups by location',
        priority: 'high',
        estimatedImprovement: '60-70% faster staff queries'
      },
      {
        table: 'staff',
        columns: ['email'],
        type: 'btree',
        reason: 'Authentication and unique email lookups',
        priority: 'high',
        estimatedImprovement: '90-95% faster login queries'
      },
      {
        table: 'staff',
        columns: ['role'],
        type: 'btree',
        reason: 'Role-based access control queries',
        priority: 'medium',
        estimatedImprovement: '50-60% faster permission checks'
      },

      // Clients table indexes
      {
        table: 'clients',
        columns: ['email'],
        type: 'btree',
        reason: 'Client authentication and unique email lookups',
        priority: 'high',
        estimatedImprovement: '90-95% faster client login queries'
      },
      {
        table: 'clients',
        columns: ['phone'],
        type: 'btree',
        reason: 'Phone number lookups for booking and communication',
        priority: 'medium',
        estimatedImprovement: '70-80% faster phone lookups'
      },
      {
        table: 'clients',
        columns: ['createdAt'],
        type: 'btree',
        reason: 'New client analytics and reporting',
        priority: 'low',
        estimatedImprovement: '40-50% faster client analytics'
      },

      // Products table indexes
      {
        table: 'products',
        columns: ['category', 'isActive'],
        type: 'btree',
        reason: 'Product catalog filtering by category',
        priority: 'medium',
        estimatedImprovement: '60-70% faster product browsing'
      },
      {
        table: 'products',
        columns: ['sku'],
        type: 'btree',
        reason: 'Unique SKU lookups for inventory management',
        priority: 'high',
        estimatedImprovement: '90-95% faster SKU queries'
      },
      {
        table: 'products',
        columns: ['price'],
        type: 'btree',
        reason: 'Price range filtering and analytics',
        priority: 'low',
        estimatedImprovement: '40-50% faster price queries'
      },

      // Services table indexes
      {
        table: 'services',
        columns: ['locationId', 'isActive'],
        type: 'btree',
        reason: 'Active services by location for booking',
        priority: 'high',
        estimatedImprovement: '70-80% faster service queries'
      },
      {
        table: 'services',
        columns: ['category'],
        type: 'btree',
        reason: 'Service category filtering',
        priority: 'medium',
        estimatedImprovement: '50-60% faster category queries'
      },
      {
        table: 'services',
        columns: ['duration'],
        type: 'btree',
        reason: 'Scheduling optimization queries',
        priority: 'low',
        estimatedImprovement: '30-40% faster scheduling queries'
      },

      // Composite indexes for complex queries
      {
        table: 'appointments',
        columns: ['date', 'staffId', 'status'],
        type: 'btree',
        reason: 'Complex staff schedule queries with status filtering',
        priority: 'high',
        estimatedImprovement: '80-90% faster complex schedule queries'
      },
      {
        table: 'transactions',
        columns: ['locationId', 'createdAt', 'total'],
        type: 'btree',
        reason: 'Revenue analytics by location and date range',
        priority: 'medium',
        estimatedImprovement: '70-80% faster revenue analytics'
      },
      {
        table: 'inventory',
        columns: ['locationId', 'productId', 'quantity'],
        type: 'btree',
        reason: 'Stock level queries by location and product',
        priority: 'high',
        estimatedImprovement: '85-95% faster stock queries'
      }
    ]
  }

  /**
   * Generate SQL statements for creating recommended indexes
   */
  generateIndexSQL(): string[] {
    const indexes = this.getRecommendedIndexes()
    const sqlStatements: string[] = []

    indexes.forEach((index, i) => {
      const indexName = `idx_${index.table}_${index.columns.join('_').toLowerCase()}`
      const columnsStr = index.columns.map(col => `"${col}"`).join(', ')
      
      let sql = `-- ${index.reason}\n`
      sql += `-- Priority: ${index.priority.toUpperCase()}\n`
      sql += `-- Estimated improvement: ${index.estimatedImprovement}\n`
      
      if (index.type === 'btree') {
        sql += `CREATE INDEX CONCURRENTLY "${indexName}" ON "${index.table}" (${columnsStr});`
      } else {
        sql += `CREATE INDEX CONCURRENTLY "${indexName}" ON "${index.table}" USING ${index.type} (${columnsStr});`
      }
      
      sqlStatements.push(sql)
    })

    return sqlStatements
  }

  /**
   * Log query performance
   */
  logQuery(query: string, duration: number, parameters?: any, rowsAffected?: number, cached = false) {
    const logEntry: QueryPerformance = {
      query: query.substring(0, 500), // Truncate long queries
      duration,
      timestamp: Date.now(),
      parameters,
      rowsAffected,
      cached
    }

    this.queryLog.push(logEntry)

    // Keep log size manageable
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(-this.maxLogSize)
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected (${duration}ms):`, {
        query: query.substring(0, 200),
        duration,
        parameters
      })
    }
  }

  /**
   * Get slow queries analysis
   */
  getSlowQueries(limit = 10): QueryPerformance[] {
    return this.queryLog
      .filter(q => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): {
    totalQueries: number
    averageDuration: number
    slowQueries: number
    cacheHitRate: number
    topSlowQueries: QueryPerformance[]
  } {
    const totalQueries = this.queryLog.length
    const slowQueries = this.queryLog.filter(q => q.duration > this.slowQueryThreshold).length
    const cachedQueries = this.queryLog.filter(q => q.cached).length
    
    const averageDuration = totalQueries > 0 
      ? this.queryLog.reduce((sum, q) => sum + q.duration, 0) / totalQueries 
      : 0

    const cacheHitRate = totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0

    return {
      totalQueries,
      averageDuration: Math.round(averageDuration),
      slowQueries,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      topSlowQueries: this.getSlowQueries(5)
    }
  }

  /**
   * Optimize common query patterns
   */
  getOptimizedQueries(): Record<string, string> {
    return {
      // Optimized appointment queries
      'appointments_by_date_location': `
        SELECT a.*, s.name as staff_name, c.name as client_name 
        FROM appointments a
        LEFT JOIN staff s ON a.staff_id = s.id
        LEFT JOIN clients c ON a.client_id = c.id
        WHERE a.date >= $1 AND a.date <= $2 AND a.location_id = $3
        ORDER BY a.date, a.start_time
      `,

      // Optimized inventory queries
      'inventory_low_stock': `
        SELECT i.*, p.name, p.sku, p.category
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.location_id = $1 AND i.quantity <= p.reorder_level
        ORDER BY i.quantity ASC
      `,

      // Optimized revenue queries
      'revenue_by_location_date': `
        SELECT 
          DATE(created_at) as date,
          SUM(total) as daily_revenue,
          COUNT(*) as transaction_count,
          AVG(total) as average_transaction
        FROM transactions
        WHERE location_id = $1 AND created_at >= $2 AND created_at <= $3
        GROUP BY DATE(created_at)
        ORDER BY date
      `,

      // Optimized staff performance queries
      'staff_performance': `
        SELECT 
          s.id,
          s.name,
          COUNT(t.id) as transaction_count,
          SUM(t.total) as total_revenue,
          AVG(t.total) as average_sale,
          COUNT(DISTINCT DATE(t.created_at)) as active_days
        FROM staff s
        LEFT JOIN transactions t ON s.id = t.staff_id 
          AND t.created_at >= $1 AND t.created_at <= $2
        WHERE s.location_id = $3 AND s.is_active = true
        GROUP BY s.id, s.name
        ORDER BY total_revenue DESC
      `,

      // Optimized client analytics
      'client_analytics': `
        SELECT 
          c.id,
          c.name,
          c.email,
          COUNT(t.id) as visit_count,
          SUM(t.total) as total_spent,
          AVG(t.total) as average_spend,
          MAX(t.created_at) as last_visit,
          COUNT(DISTINCT DATE(t.created_at)) as unique_visit_days
        FROM clients c
        LEFT JOIN transactions t ON c.id = t.client_id
          AND t.created_at >= $1 AND t.created_at <= $2
        WHERE c.location_id = $3
        GROUP BY c.id, c.name, c.email
        HAVING COUNT(t.id) > 0
        ORDER BY total_spent DESC
      `
    }
  }

  /**
   * Clear query log
   */
  clearQueryLog() {
    this.queryLog = []
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(milliseconds: number) {
    this.slowQueryThreshold = milliseconds
  }
}

// Export singleton instance
export const dbOptimization = new DatabaseOptimizationService()

// Export query performance monitoring decorator
export function withQueryMonitoring<T extends (...args: any[]) => Promise<any>>(
  queryName: string,
  queryFn: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    
    try {
      const result = await queryFn(...args)
      const duration = Date.now() - startTime
      
      dbOptimization.logQuery(
        queryName,
        duration,
        args,
        Array.isArray(result) ? result.length : 1,
        false
      )
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      dbOptimization.logQuery(queryName, duration, args, 0, false)
      throw error
    }
  }) as T
}
