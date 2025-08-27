# 🚀 Performance Optimization Guide - IT Asset Monitor

## 📊 Current Performance Issues

### ❌ Problems Identified
1. **API Response Times**:
   - `/api/computers`: 7.5 seconds (should be < 1 second)
   - `/api/alerts`: 6.3 seconds (should be < 1 second)
   - `/api/health`: 0.0008 seconds ✅ (good)

2. **Database Connection Issues**:
   - Single connection pool (max: 1)
   - Long timeouts (60 seconds)
   - No connection pooling optimization

3. **Query Performance**:
   - No database indexes
   - No query caching
   - No pagination for large datasets

## 🔧 Applied Optimizations

### 1. Database Connection Optimization ✅
```javascript
// Before
pool: {
  max: 1, // Single connection
  min: 0,
  idleTimeoutMillis: 600000, // 10 minutes
  acquireTimeoutMillis: 60000, // 60 seconds
}

// After
pool: {
  max: 10, // Multiple connections
  min: 2, // Keep 2 connections ready
  idleTimeoutMillis: 300000, // 5 minutes
  acquireTimeoutMillis: 30000, // 30 seconds
}
```

### 2. Application-Level Caching ✅
- **30-second cache** for `/api/computers`
- **30-second cache** for `/api/alerts` (per user)
- **Automatic cache cleanup** every minute
- **Cache hit logging** for monitoring

### 3. Database Performance Script ✅
- **7 performance indexes** created
- **3 optimized views** for common queries
- **2 stored procedures** for better performance
- **Query store enabled** for monitoring

## 📋 Implementation Steps

### Step 1: Apply Database Optimizations
```bash
# Run the performance optimization script on SQL Server
sqlcmd -S 10.53.64.205 -U ccet -P !qaz7410 -d mes -i performance-optimization.sql
```

### Step 2: Restart Application
```bash
# Stop current application
pkill -f "node server.js"
pkill -f "vite"

# Start with optimized settings
npm run mac:full
```

### Step 3: Test Performance
```bash
# Test computers endpoint
curl -w "Time: %{time_total}s\n" -o /dev/null -s "http://localhost:3002/api/computers"

# Test alerts endpoint
curl -w "Time: %{time_total}s\n" -o /dev/null -s "http://localhost:3002/api/alerts/c270188"

# Test health endpoint
curl -w "Time: %{time_total}s\n" -o /dev/null -s "http://localhost:3002/api/health"
```

## 🎯 Expected Performance Improvements

### Before Optimization
| Endpoint | Response Time | Status |
|----------|---------------|--------|
| `/api/computers` | 7.5s | ❌ Poor |
| `/api/alerts` | 6.3s | ❌ Poor |
| `/api/health` | 0.0008s | ✅ Good |

### After Optimization (Expected)
| Endpoint | Response Time | Improvement |
|----------|---------------|-------------|
| `/api/computers` | < 0.5s | 93% faster |
| `/api/alerts` | < 0.3s | 95% faster |
| `/api/health` | < 0.001s | ✅ Maintained |

## 🔍 Monitoring and Maintenance

### 1. Cache Monitoring
```javascript
// Check cache status in logs
[CACHE] Returning cached computers data
[CACHE] Cached 150 computers for 30 seconds
[CACHE] Cleared expired cache: computers
```

### 2. Database Performance
```sql
-- Monitor query performance
SELECT 
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count as avg_elapsed_time,
    qs.total_logical_reads / qs.execution_count as avg_logical_reads,
    qt.text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.text LIKE '%TBL_IT_MachinesCurrent%'
ORDER BY avg_elapsed_time DESC;
```

### 3. Connection Pool Status
```javascript
// Check in health endpoint
curl -s "http://localhost:3002/api/health" | jq '.database'
```

## 🚨 Troubleshooting

### If Performance is Still Poor

1. **Check Database Connection**:
   ```bash
   curl -s "http://localhost:3002/api/health" | jq '.database.status'
   ```

2. **Check Cache Status**:
   ```bash
   # Look for cache logs in server output
   grep "CACHE" server.log
   ```

3. **Check Database Indexes**:
   ```sql
   SELECT 
       i.name as IndexName,
       t.name as TableName,
       i.type_desc as IndexType
   FROM sys.indexes i
   JOIN sys.tables t ON i.object_id = t.object_id
   WHERE t.name LIKE '%IT_Machines%'
   ORDER BY t.name, i.name;
   ```

4. **Monitor Query Performance**:
   ```sql
   -- Check slow queries
   SELECT TOP 10
       qs.execution_count,
       qs.total_elapsed_time / qs.execution_count as avg_elapsed_time,
       qt.text
   FROM sys.dm_exec_query_stats qs
   CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
   ORDER BY avg_elapsed_time DESC;
   ```

## 📈 Additional Optimizations (Future)

### 1. Redis Caching
```javascript
// Add Redis for distributed caching
const redis = require('redis');
const client = redis.createClient();

// Cache frequently accessed data
await client.setex('computers', 300, JSON.stringify(computers));
```

### 2. Database Partitioning
```sql
-- Partition large tables by date
CREATE PARTITION FUNCTION PF_ByDate (datetime)
AS RANGE RIGHT FOR VALUES ('2024-01-01', '2024-07-01', '2025-01-01');
```

### 3. API Response Compression
```javascript
// Enable gzip compression
app.use(compression());
```

### 4. CDN for Static Assets
```javascript
// Serve static files from CDN
app.use('/static', express.static('dist', {
  maxAge: '1y',
  etag: true
}));
```

## 📞 Support

If you encounter issues after applying these optimizations:

1. **Check server logs** for error messages
2. **Verify database connectivity** using health endpoint
3. **Monitor cache performance** in application logs
4. **Review database query performance** using SQL Server Management Studio

## 🎉 Success Metrics

Performance optimization is successful when:
- ✅ `/api/computers` responds in < 1 second
- ✅ `/api/alerts` responds in < 1 second  
- ✅ Cache hit rate > 80%
- ✅ Database connection pool utilization < 80%
- ✅ No timeout errors in logs
