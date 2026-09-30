import { DatabaseTarget, OracleMetric, OracleSession, SlowQuery, TablespaceInfo, TuningAuditEntry, TuningRecommendation, WaitEvent } from '../types/oracle';

export const INITIAL_DATABASES: DatabaseTarget[] = [
  {
    id: 'prod-rac01-fin',
    name: 'PROD_RAC01 (PDB_FIN_CORE)',
    type: 'RAC',
    host: 'rac-node01.corp.internal',
    port: 1521,
    serviceName: 'fin_core.corp.internal',
    version: 'Oracle Database 19c Enterprise Edition Release 19.18.0.0.0',
    environment: 'PRODUCTION',
    status: 'WARNING',
  },
  {
    id: 'dw-sales-cdb',
    name: 'DW_ANALYTICS_CDB (PDB_SALES_DW)',
    type: 'CDB',
    host: 'exadata-dw01.corp.internal',
    port: 1521,
    serviceName: 'sales_dw.corp.internal',
    version: 'Oracle Database 19c Enterprise Edition Release 19.20.0.0.0',
    environment: 'DATA_WAREHOUSE',
    status: 'HEALTHY',
  },
  {
    id: 'crm-billing-pdb',
    name: 'CRM_BILLING_PDB (CDB_APPS)',
    type: 'PDB',
    host: 'ora-apps02.corp.internal',
    port: 1521,
    serviceName: 'crm_billing.corp.internal',
    version: 'Oracle Database 21c Enterprise Edition Release 21.7.0.0.0',
    environment: 'PRODUCTION',
    status: 'HEALTHY',
  },
];

export const INITIAL_METRICS: OracleMetric = {
  timestamp: new Date().toISOString(),
  cpuUtilization: 78.4,
  sgaUtilization: 86.2,
  pgaUtilization: 64.8,
  bufferCacheHitRatio: 91.3,
  libraryCacheHitRatio: 99.4,
  activeSessions: 38,
  totalSessions: 240,
  redoLogRateMBs: 18.5,
  iops: 12450,
  dbTimeRate: 4.8,
};

export const INITIAL_WAIT_EVENTS: WaitEvent[] = [
  {
    eventName: 'db file sequential read',
    waitClass: 'User I/O',
    totalWaits: 482910,
    timeWaitedSec: 1420.5,
    percentageDbTime: 44.8,
    avgWaitMs: 3.2,
    severity: 'warning',
  },
  {
    eventName: 'enq: TX - row lock contention',
    waitClass: 'Application',
    totalWaits: 1420,
    timeWaitedSec: 640.2,
    percentageDbTime: 20.2,
    avgWaitMs: 450.8,
    severity: 'critical',
  },
  {
    eventName: 'log file sync',
    waitClass: 'Commit',
    totalWaits: 98400,
    timeWaitedSec: 380.1,
    percentageDbTime: 12.0,
    avgWaitMs: 3.8,
    severity: 'normal',
  },
  {
    eventName: 'CPU + CPU Wait',
    waitClass: 'Other',
    totalWaits: 0,
    timeWaitedSec: 350.0,
    percentageDbTime: 11.0,
    avgWaitMs: 0,
    severity: 'normal',
  },
  {
    eventName: 'direct path read temp',
    waitClass: 'User I/O',
    totalWaits: 34100,
    timeWaitedSec: 220.4,
    percentageDbTime: 7.0,
    avgWaitMs: 6.4,
    severity: 'warning',
  },
  {
    eventName: 'latch: cache buffers chains',
    waitClass: 'Concurrency',
    totalWaits: 18200,
    timeWaitedSec: 157.8,
    percentageDbTime: 5.0,
    avgWaitMs: 8.6,
    severity: 'warning',
  },
];

export const INITIAL_TABLESPACES: TablespaceInfo[] = [
  {
    name: 'DATA_TBS01',
    type: 'PERMANENT',
    totalSizeMB: 512000,
    usedSizeMB: 450560,
    freeSizeMB: 61440,
    pctUsed: 88.0,
    status: 'ONLINE',
    autoextend: true,
    datafileCount: 16,
  },
  {
    name: 'INDX_TBS01',
    type: 'PERMANENT',
    totalSizeMB: 256000,
    usedSizeMB: 217600,
    freeSizeMB: 38400,
    pctUsed: 85.0,
    status: 'ONLINE',
    autoextend: true,
    datafileCount: 8,
  },
  {
    name: 'UNDOTBS1',
    type: 'UNDO',
    totalSizeMB: 64000,
    usedSizeMB: 38400,
    freeSizeMB: 25600,
    pctUsed: 60.0,
    status: 'ONLINE',
    autoextend: true,
    datafileCount: 2,
  },
  {
    name: 'TEMP',
    type: 'TEMPORARY',
    totalSizeMB: 128000,
    usedSizeMB: 104960,
    freeSizeMB: 23040,
    pctUsed: 82.0,
    status: 'ONLINE',
    autoextend: true,
    datafileCount: 4,
  },
  {
    name: 'SYSTEM',
    type: 'PERMANENT',
    totalSizeMB: 32000,
    usedSizeMB: 18560,
    freeSizeMB: 13440,
    pctUsed: 58.0,
    status: 'ONLINE',
    autoextend: true,
    datafileCount: 1,
  },
  {
    name: 'SYSAUX',
    type: 'PERMANENT',
    totalSizeMB: 64000,
    usedSizeMB: 49920,
    freeSizeMB: 14080,
    pctUsed: 78.0,
    status: 'ONLINE',
    autoextend: true,
    datafileCount: 2,
  },
];

export const INITIAL_SESSIONS: OracleSession[] = [
  {
    sid: 142,
    serial: 39812,
    username: 'FIN_APP_USER',
    status: 'ACTIVE',
    osUser: 'app_srv04',
    machine: 'fin-app-node04.corp',
    program: 'JDBC Thin Client (Batch Settlement)',
    sqlId: '8f7q2m8x9p31a',
    event: 'enq: TX - row lock contention',
    waitClass: 'Application',
    secondsInWait: 184,
    blockingSid: undefined,
    cpuTimeMs: 45200,
    logonTime: '06:14:22',
  },
  {
    sid: 198,
    serial: 11045,
    username: 'BILLING_SVC',
    status: 'ACTIVE',
    osUser: 'billing_job',
    machine: 'batch-worker02.corp',
    program: 'Python cx_Oracle worker',
    sqlId: '3b4k9w2x7y11c',
    event: 'enq: TX - row lock contention',
    waitClass: 'Application',
    secondsInWait: 142,
    blockingSid: 142,
    cpuTimeMs: 23800,
    logonTime: '06:45:10',
  },
  {
    sid: 205,
    serial: 8432,
    username: 'PORTAL_API',
    status: 'ACTIVE',
    osUser: 'api_pod9',
    machine: 'k8s-worker09.corp',
    program: 'NodeJS OracleDB Driver',
    sqlId: '6v8m1z4q5t90e',
    event: 'enq: TX - row lock contention',
    waitClass: 'Application',
    secondsInWait: 96,
    blockingSid: 142,
    cpuTimeMs: 14200,
    logonTime: '07:02:18',
  },
  {
    sid: 267,
    serial: 49201,
    username: 'REPORT_RO',
    status: 'ACTIVE',
    osUser: 'bi_tableau',
    machine: 'tableau-server.corp',
    program: 'Tableau Connector',
    sqlId: '9c1p4t6u2a88f',
    event: 'direct path read temp',
    waitClass: 'User I/O',
    secondsInWait: 12,
    blockingSid: undefined,
    cpuTimeMs: 189400,
    logonTime: '05:30:00',
  },
  {
    sid: 311,
    serial: 14298,
    username: 'ANALYTICS_ETL',
    status: 'ACTIVE',
    osUser: 'airflow_worker',
    machine: 'airflow-worker01.corp',
    program: 'Informatica PowerCenter',
    sqlId: '1m5v7x9k3j22d',
    event: 'db file sequential read',
    waitClass: 'User I/O',
    secondsInWait: 4,
    blockingSid: undefined,
    cpuTimeMs: 98200,
    logonTime: '07:15:33',
  },
  {
    sid: 88,
    serial: 22091,
    username: 'SYSTEM',
    status: 'INACTIVE',
    osUser: 'oracle',
    machine: 'db-host.corp',
    program: 'sqlplus@db-host',
    event: 'SQL*Net message from client',
    waitClass: 'Idle',
    secondsInWait: 420,
    blockingSid: undefined,
    cpuTimeMs: 1200,
    logonTime: '04:00:11',
  },
];

export const INITIAL_SLOW_QUERIES: SlowQuery[] = [
  {
    sqlId: '8f7q2m8x9p31a',
    planHashValue: 2849102841,
    sqlText: `SELECT o.order_id, c.customer_name, c.email, o.order_date,
       SUM(oi.quantity * oi.unit_price) AS total_amount
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE UPPER(c.country) = 'UNITED STATES'
  AND o.order_date >= TO_DATE('2024-01-01', 'YYYY-MM-DD')
GROUP BY o.order_id, c.customer_name, c.email, o.order_date
HAVING SUM(oi.quantity * oi.unit_price) > 500
ORDER BY total_amount DESC`,
    parsingSchema: 'FIN_CORE',
    module: 'OrderSettlementBatch',
    executions: 1420,
    elapsedTimeSec: 25844.0,
    avgElapsedSec: 18.2,
    cpuTimeSec: 19800.0,
    bufferGets: 3408000,
    diskReads: 984000,
    rowsProcessed: 14200,
    firstLoadTime: '2024-09-28/02:00:00',
    lastActiveTime: 'Just now',
    status: 'PENDING_ANALYSIS',
    currentCost: 48290,
    bottlenecks: [
      'Function UPPER(c.country) suppresses B-tree index on CUSTOMERS.COUNTRY',
      'TABLE ACCESS FULL on CUSTOMERS table (12M rows)',
      'Nested Loop join strategy causing 3.4M buffer gets',
      'Sort operation in TEMP tablespace for ORDER BY total_amount'
    ],
  },
  {
    sqlId: '3b4k9w2x7y11c',
    planHashValue: 1948201940,
    sqlText: `SELECT t.trans_id, t.account_id, t.trans_date, t.amount, t.trans_type
FROM transactions t
WHERE t.amount > (
    SELECT AVG(t2.amount)
    FROM transactions t2
    WHERE t2.account_id = t.account_id
      AND t2.trans_date >= TRUNC(SYSDATE) - 30
)
  AND t.trans_date >= TRUNC(SYSDATE) - 7
ORDER BY t.trans_date DESC`,
    parsingSchema: 'FIN_CORE',
    module: 'FraudDetectionWorker',
    executions: 840,
    elapsedTimeSec: 21840.0,
    avgElapsedSec: 26.0,
    cpuTimeSec: 20100.0,
    bufferGets: 8740000,
    diskReads: 1420000,
    rowsProcessed: 8400,
    firstLoadTime: '2024-09-28/03:15:00',
    lastActiveTime: '3 mins ago',
    status: 'PENDING_ANALYSIS',
    currentCost: 92400,
    bottlenecks: [
      'Correlated subquery evaluated per row without unnesting',
      'Repeated full table / range scans on TRANSACTIONS table (4.8M rows)',
      'High CPU consumption during aggregate computation',
      'Missing composite index on (ACCOUNT_ID, TRANS_DATE, AMOUNT)'
    ],
  },
  {
    sqlId: '6v8m1z4q5t90e',
    planHashValue: 3349182049,
    sqlText: `SELECT DISTINCT p.product_name, p.category, inv.warehouse_id, inv.stock_qty, cart.user_id
FROM products p, inventory inv, cart_items cart
WHERE p.status = 'ACTIVE'
  AND inv.stock_qty < 10
  AND cart.updated_at >= SYSDATE - 1`,
    parsingSchema: 'ECOMM_SVC',
    module: 'CartAbandonmentReminder',
    executions: 310,
    elapsedTimeSec: 13020.0,
    avgElapsedSec: 42.0,
    cpuTimeSec: 11900.0,
    bufferGets: 12400000,
    diskReads: 3820000,
    rowsProcessed: 1850,
    firstLoadTime: '2024-09-28/05:00:00',
    lastActiveTime: '10 mins ago',
    status: 'PENDING_ANALYSIS',
    currentCost: 184500,
    bottlenecks: [
      'CARTESIAN PRODUCT (MERGE JOIN CARTESIAN) detected between products and inventory',
      'Missing explicit join predicate between PRODUCTS and INVENTORY / CART_ITEMS',
      'Massive temporary spill to TEMP tablespace for DISTINCT sort',
      'Severe PGA exhaustion and latch contention'
    ],
  },
  {
    sqlId: '9c1p4t6u2a88f',
    planHashValue: 1049281744,
    sqlText: `SELECT c.customer_id, c.customer_name, c.account_balance
FROM customers c
WHERE c.customer_id NOT IN (
    SELECT o.customer_id
    FROM orders o
    WHERE o.order_date >= ADD_MONTHS(SYSDATE, -6)
)`,
    parsingSchema: 'CRM_CORE',
    module: 'DormantCustomerCampaign',
    executions: 520,
    elapsedTimeSec: 7800.0,
    avgElapsedSec: 15.0,
    cpuTimeSec: 7200.0,
    bufferGets: 2100000,
    diskReads: 640000,
    rowsProcessed: 45000,
    firstLoadTime: '2024-09-28/06:30:00',
    lastActiveTime: '15 mins ago',
    status: 'PENDING_ANALYSIS',
    currentCost: 34200,
    bottlenecks: [
      'NOT IN operator on nullable column CUSTOMER_ID prevents HASH ANTI-JOIN',
      'Oracle CBO falls back to expensive FILTER operation',
      'Executes subquery on ORDERS repeatedly for each candidate customer',
      'Missing NOT NULL constraint or NOT EXISTS rewrite'
    ],
  },
  {
    sqlId: '1m5v7x9k3j22d',
    planHashValue: 4120938102,
    sqlText: `SELECT d.fiscal_quarter, p.brand, c.region,
       SUM(s.sales_amount) AS total_revenue
FROM sales_fact s
JOIN dim_date d ON s.date_id = d.date_id
JOIN dim_product p ON s.product_id = p.product_id
JOIN dim_customer c ON s.customer_id = c.customer_id
WHERE d.fiscal_year = 2024
  AND p.category = 'Enterprise Hardware'
GROUP BY d.fiscal_quarter, p.brand, c.region
ORDER BY total_revenue DESC`,
    parsingSchema: 'SALES_DW',
    module: 'ExecutiveDashboardETL',
    executions: 95,
    elapsedTimeSec: 6650.0,
    avgElapsedSec: 70.0,
    cpuTimeSec: 5800.0,
    bufferGets: 18900000,
    diskReads: 7200000,
    rowsProcessed: 280,
    firstLoadTime: '2024-09-28/04:00:00',
    lastActiveTime: '25 mins ago',
    status: 'PENDING_ANALYSIS',
    currentCost: 310000,
    bottlenecks: [
      'Full Table Scan on partitioned SALES_FACT table (280 million rows)',
      'Star Transformation disabled in session optimizer environment',
      'Missing bitmap indexes on foreign key dimensions DATE_ID and PRODUCT_ID',
      'Heavy direct path reads saturating storage interconnect'
    ],
  },
];

export const INITIAL_PRECOMPUTED_TUNINGS: Record<string, TuningRecommendation> = {
  '8f7q2m8x9p31a': {
    id: 'tune-rec-8f7q2m8x9p31a',
    sqlId: '8f7q2m8x9p31a',
    timestamp: new Date().toISOString(),
    originalSql: `SELECT o.order_id, c.customer_name, c.email, o.order_date,
       SUM(oi.quantity * oi.unit_price) AS total_amount
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
WHERE UPPER(c.country) = 'UNITED STATES'
  AND o.order_date >= TO_DATE('2024-01-01', 'YYYY-MM-DD')
GROUP BY o.order_id, c.customer_name, c.email, o.order_date
HAVING SUM(oi.quantity * oi.unit_price) > 500
ORDER BY total_amount DESC`,
    optimizedSql: `SELECT /*+ LEADING(c o oi) USE_HASH(o) USE_HASH(oi) GATHER_PLAN_STATISTICS */
       o.order_id,
       c.customer_name,
       c.email,
       o.order_date,
       order_totals.total_amount
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
JOIN (
    SELECT order_id, SUM(quantity * unit_price) AS total_amount
    FROM order_items
    GROUP BY order_id
    HAVING SUM(quantity * unit_price) > 500
) order_totals ON o.order_id = order_totals.order_id
WHERE UPPER(c.country) = 'UNITED STATES'
  AND o.order_date >= DATE '2024-01-01'
ORDER BY order_totals.total_amount DESC`,
    tuningRationale: `1. Replaced late aggregation with early aggregated inline view on ORDER_ITEMS to drastically shrink intermediate join cardinality prior to joining ORDERS and CUSTOMERS.
2. Created a Function-Based Index on CUSTOMERS(UPPER(country)) to eliminate the 12-million-row Full Table Scan and replace it with an INDEX RANGE SCAN.
3. Swapped Nested Loops for Hash Joins (USE_HASH) using LEADING(c o oi) to avoid repetitive single-block random I/O (db file sequential read).
4. Created composite index on ORDERS(CUSTOMER_ID, ORDER_DATE, ORDER_ID) to enable index-guided join filtering without touching data blocks.`,
    detectedIssues: [
      'UPPER(c.country) predicate suppresses standard B-Tree index on CUSTOMERS.COUNTRY',
      'TABLE ACCESS FULL on CUSTOMERS table scanning 12,000,000 rows',
      'Nested Loops join causing 3,400,000 buffer gets',
      'Suboptimal join order filtering line items after wide outer joins'
    ],
    recommendedHints: [
      '/*+ LEADING(c o oi) USE_HASH(o) USE_HASH(oi) */',
      '/*+ INDEX(c IDX_CUST_COUNTRY_UPPER) */',
      '/*+ GATHER_PLAN_STATISTICS */'
    ],
    recommendedDdl: [
      `-- Function-based index to support UPPER(c.country) lookup
CREATE INDEX FIN_CORE.IDX_CUST_COUNTRY_UPPER 
ON FIN_CORE.CUSTOMERS (UPPER(country)) 
TABLESPACE INDX_TBS01 
ONLINE COMPUTE STATISTICS;`,
      `-- Composite index to support index-only filtering on ORDERS
CREATE INDEX FIN_CORE.IDX_ORDERS_CUST_DATE 
ON FIN_CORE.ORDERS (customer_id, order_date, order_id) 
TABLESPACE INDX_TBS01 
ONLINE COMPUTE STATISTICS;`
    ],
    statisticsCommands: [
      `BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(
    ownname => 'FIN_CORE',
    tabname => 'CUSTOMERS',
    cascade => TRUE,
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
    method_opt => 'FOR ALL COLUMNS SIZE AUTO FOR COLUMNS (UPPER(country)) SIZE 254'
  );
END;
/`,
      `BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(
    ownname => 'FIN_CORE',
    tabname => 'ORDERS',
    cascade => TRUE,
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE
  );
END;
/`
    ],
    planBaselineCommand: `DECLARE
  l_plans_loaded PLS_INTEGER;
BEGIN
  l_plans_loaded := DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(
    sql_id => '8f7q2m8x9p31a',
    plan_hash_value => 2849102841,
    fixed => 'YES',
    enabled => 'YES'
  );
  DBMS_OUTPUT.PUT_LINE('Plans loaded into SPM Baseline: ' || l_plans_loaded);
END;
/`,
    sqlProfileScript: `BEGIN
  DBMS_SQLTUNE.ACCEPT_SQL_PROFILE(
    task_name => 'STA_TASK_8F7Q2M',
    category => 'DEFAULT',
    force_match => TRUE,
    replace => TRUE
  );
END;
/`,
    metricsComparison: {
      originalCost: 48290,
      optimizedCost: 184,
      costReductionPct: 99.6,
      originalBufferGets: 3408000,
      estimatedBufferGets: 6800,
      bufferGetsReductionPct: 99.8,
      originalElapsedSec: 18.2,
      estimatedElapsedSec: 0.12,
      elapsedReductionPct: 99.3,
    },
    originalPlan: [
      { id: 0, operation: 'SELECT STATEMENT', cost: 48290, cardinality: 14200, bytes: 1420000, timeSec: 18.2 },
      { id: 1, parentId: 0, operation: 'SORT', options: 'ORDER BY', cost: 48290, cardinality: 14200, bytes: 1420000, timeSec: 18.2, warning: 'TEMP_SPILL' },
      { id: 2, parentId: 1, operation: 'FILTER', cost: 47910, cardinality: 14200, bytes: 1420000, timeSec: 18.0 },
      { id: 3, parentId: 2, operation: 'HASH', options: 'GROUP BY', cost: 47910, cardinality: 14200, bytes: 1420000, timeSec: 18.0 },
      { id: 4, parentId: 3, operation: 'NESTED LOOPS', cost: 47450, cardinality: 180000, bytes: 18000000, timeSec: 17.8 },
      { id: 5, parentId: 4, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'CUSTOMERS', cost: 36200, cardinality: 450000, bytes: 27000000, timeSec: 13.5, filterPredicates: "UPPER(COUNTRY)='UNITED STATES'", warning: 'FULL_TABLE_SCAN' },
      { id: 6, parentId: 4, operation: 'TABLE ACCESS', options: 'BY INDEX ROWID', objectName: 'ORDERS', cost: 2, cardinality: 4, bytes: 120, timeSec: 0.01 },
      { id: 7, parentId: 6, operation: 'INDEX', options: 'RANGE SCAN', objectName: 'PK_ORDERS', cost: 1, cardinality: 4, bytes: 0, timeSec: 0.001 },
      { id: 8, parentId: 4, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'ORDER_ITEMS', cost: 11248, cardinality: 180000, bytes: 5400000, timeSec: 4.2, warning: 'FULL_TABLE_SCAN' },
    ],
    optimizedPlan: [
      { id: 0, operation: 'SELECT STATEMENT', cost: 184, cardinality: 14200, bytes: 1420000, timeSec: 0.12 },
      { id: 1, parentId: 0, operation: 'SORT', options: 'ORDER BY', cost: 184, cardinality: 14200, bytes: 1420000, timeSec: 0.12 },
      { id: 2, parentId: 1, operation: 'HASH JOIN', cost: 179, cardinality: 14200, bytes: 1420000, timeSec: 0.11 },
      { id: 3, parentId: 2, operation: 'HASH JOIN', cost: 84, cardinality: 18000, bytes: 900000, timeSec: 0.05 },
      { id: 4, parentId: 3, operation: 'TABLE ACCESS', options: 'BY INDEX ROWID BATCHED', objectName: 'CUSTOMERS', cost: 38, cardinality: 6000, bytes: 360000, timeSec: 0.02 },
      { id: 5, parentId: 4, operation: 'INDEX', options: 'RANGE SCAN', objectName: 'IDX_CUST_COUNTRY_UPPER', cost: 4, cardinality: 6000, bytes: 0, timeSec: 0.002, accessPredicates: "UPPER(COUNTRY)='UNITED STATES'" },
      { id: 6, parentId: 3, operation: 'INDEX', options: 'RANGE SCAN', objectName: 'IDX_ORDERS_CUST_DATE', cost: 44, cardinality: 18000, bytes: 540000, timeSec: 0.03, accessPredicates: "ORDER_DATE>=TO_DATE('2024-01-01')" },
      { id: 7, parentId: 2, operation: 'VIEW', objectName: 'ORDER_TOTALS', cost: 92, cardinality: 14200, bytes: 520000, timeSec: 0.06 },
      { id: 8, parentId: 7, operation: 'HASH', options: 'GROUP BY', cost: 92, cardinality: 14200, bytes: 520000, timeSec: 0.06 },
      { id: 9, parentId: 8, operation: 'INDEX', options: 'FAST FULL SCAN', objectName: 'PK_ORDER_ITEMS', cost: 45, cardinality: 380000, bytes: 7600000, timeSec: 0.03 },
    ],
    riskAssessment: {
      level: 'LOW',
      score: 18,
      impactSummary: 'Low risk. DDL uses ONLINE clause which prevents exclusive DDL table locks on active production transactions. Index size estimated at 42MB in INDX_TBS01.',
      lockingRisk: 'Zero exclusive locking. The ONLINE keyword enables non-blocking DDL build in Oracle 19c.',
      rollbackPlan: 'DROP INDEX FIN_CORE.IDX_CUST_COUNTRY_UPPER; DROP INDEX FIN_CORE.IDX_ORDERS_CUST_DATE;',
    },
    approvalStatus: 'PENDING_APPROVAL',
  },
  '3b4k9w2x7y11c': {
    id: 'tune-rec-3b4k9w2x7y11c',
    sqlId: '3b4k9w2x7y11c',
    timestamp: new Date().toISOString(),
    originalSql: `SELECT t.trans_id, t.account_id, t.trans_date, t.amount, t.trans_type
FROM transactions t
WHERE t.amount > (
    SELECT AVG(t2.amount)
    FROM transactions t2
    WHERE t2.account_id = t.account_id
      AND t2.trans_date >= TRUNC(SYSDATE) - 30
)
  AND t.trans_date >= TRUNC(SYSDATE) - 7
ORDER BY t.trans_date DESC`,
    optimizedSql: `WITH account_30d_avg AS (
    SELECT account_id,
           AVG(amount) AS avg_amount_30d
    FROM transactions
    WHERE trans_date >= TRUNC(SYSDATE) - 30
    GROUP BY account_id
)
SELECT /*+ LEADING(avg_t t) USE_HASH(t) */
       t.trans_id,
       t.account_id,
       t.trans_date,
       t.amount,
       t.trans_type
FROM account_30d_avg avg_t
JOIN transactions t ON avg_t.account_id = t.account_id
WHERE t.trans_date >= TRUNC(SYSDATE) - 7
  AND t.amount > avg_t.avg_amount_30d
ORDER BY t.trans_date DESC`,
    tuningRationale: `1. Eliminated correlated subquery execution for every row candidate. By refactoring into a CTE (Common Table Expression / Subquery Factoring), the 30-day aggregate is computed in a single pass over TRANSACTIONS.
2. Created composite index on TRANSACTIONS(ACCOUNT_ID, TRANS_DATE, AMOUNT) to enable index-only aggregation without accessing data blocks.
3. Swapped Nested Loop Filter for a Hash Join, reducing buffer gets from 8.7M down to 14.5K.`,
    detectedIssues: [
      'Correlated scalar subquery executed 84,000 times',
      'Repeated index/table scans scanning 4.8M rows in TRANSACTIONS',
      'Heavy CPU utilization during per-row aggregate evaluation',
      'Missing covering index for window aggregation'
    ],
    recommendedHints: [
      '/*+ LEADING(avg_t t) USE_HASH(t) */',
      '/*+ MATERIALIZE */'
    ],
    recommendedDdl: [
      `-- Composite index covering account, trans_date, and amount
CREATE INDEX FIN_CORE.IDX_TRANS_ACCT_DATE_AMT 
ON FIN_CORE.TRANSACTIONS (account_id, trans_date, amount) 
TABLESPACE INDX_TBS01 
ONLINE COMPUTE STATISTICS;`
    ],
    statisticsCommands: [
      `BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(
    ownname => 'FIN_CORE',
    tabname => 'TRANSACTIONS',
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
    cascade => TRUE
  );
END;
/`
    ],
    planBaselineCommand: `DECLARE
  l_plans PLS_INTEGER;
BEGIN
  l_plans := DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(sql_id => '3b4k9w2x7y11c');
END;
/`,
    metricsComparison: {
      originalCost: 92400,
      optimizedCost: 340,
      costReductionPct: 99.6,
      originalBufferGets: 8740000,
      estimatedBufferGets: 14500,
      bufferGetsReductionPct: 99.8,
      originalElapsedSec: 26.0,
      estimatedElapsedSec: 0.18,
      elapsedReductionPct: 99.3,
    },
    originalPlan: [
      { id: 0, operation: 'SELECT STATEMENT', cost: 92400, cardinality: 8400, bytes: 672000, timeSec: 26.0 },
      { id: 1, parentId: 0, operation: 'SORT', options: 'ORDER BY', cost: 92400, cardinality: 8400, bytes: 672000, timeSec: 26.0 },
      { id: 2, parentId: 1, operation: 'FILTER', cost: 91800, cardinality: 8400, bytes: 672000, timeSec: 25.8, warning: 'CARDINALITY_MISMATCH' },
      { id: 3, parentId: 2, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'TRANSACTIONS', cost: 18400, cardinality: 420000, bytes: 33600000, timeSec: 5.2, warning: 'FULL_TABLE_SCAN' },
      { id: 4, parentId: 2, operation: 'SORT', options: 'AGGREGATE', cost: 2, cardinality: 1, bytes: 16, timeSec: 0.001 },
      { id: 5, parentId: 4, operation: 'TABLE ACCESS', options: 'FULL', objectName: 'TRANSACTIONS', cost: 18400, cardinality: 1200, bytes: 19200, timeSec: 5.2, warning: 'FULL_TABLE_SCAN' },
    ],
    optimizedPlan: [
      { id: 0, operation: 'SELECT STATEMENT', cost: 340, cardinality: 8400, bytes: 672000, timeSec: 0.18 },
      { id: 1, parentId: 0, operation: 'SORT', options: 'ORDER BY', cost: 340, cardinality: 8400, bytes: 672000, timeSec: 0.18 },
      { id: 2, parentId: 1, operation: 'HASH JOIN', cost: 310, cardinality: 8400, bytes: 672000, timeSec: 0.16 },
      { id: 3, parentId: 2, operation: 'VIEW', cost: 140, cardinality: 12500, bytes: 375000, timeSec: 0.07 },
      { id: 4, parentId: 3, operation: 'HASH', options: 'GROUP BY', cost: 140, cardinality: 12500, bytes: 375000, timeSec: 0.07 },
      { id: 5, parentId: 4, operation: 'INDEX', options: 'FAST FULL SCAN', objectName: 'IDX_TRANS_ACCT_DATE_AMT', cost: 65, cardinality: 480000, bytes: 7680000, timeSec: 0.03 },
      { id: 6, parentId: 2, operation: 'INDEX', options: 'RANGE SCAN', objectName: 'IDX_TRANS_ACCT_DATE_AMT', cost: 165, cardinality: 42000, bytes: 3360000, timeSec: 0.08, accessPredicates: "TRANS_DATE>=TRUNC(SYSDATE)-7" },
    ],
    riskAssessment: {
      level: 'LOW',
      score: 15,
      impactSummary: 'Low risk. Query rewrite preserves exact business semantics. Online index build does not block concurrent transactions.',
      lockingRisk: 'None. Safe online DDL.',
      rollbackPlan: 'DROP INDEX FIN_CORE.IDX_TRANS_ACCT_DATE_AMT;',
    },
    approvalStatus: 'PENDING_APPROVAL',
  },
};

export const INITIAL_AUDIT_LOG: TuningAuditEntry[] = [
  {
    id: 'audit-001',
    sqlId: '4k7m9p2x1a05z',
    recommendationId: 'rec-init-001',
    executedBy: 'DBA_ADMIN (Auto Sentinel)',
    executedAt: '2024-09-28 14:22:10',
    actionType: 'CREATE_INDEX',
    executedCommands: [
      'CREATE INDEX FIN_CORE.IDX_INV_STATUS_DATE ON FIN_CORE.INVOICES(STATUS, DUE_DATE) TABLESPACE INDX_TBS01 ONLINE;'
    ],
    rollbackCommand: 'DROP INDEX FIN_CORE.IDX_INV_STATUS_DATE;',
    status: 'SUCCESS',
    executionTimeMs: 1240,
    measuredImprovementPct: 94.6,
    notes: 'Eliminated full table scan on 8.2M invoices. Buffer gets reduced from 1.9M to 12.4K.',
  },
  {
    id: 'audit-002',
    sqlId: '7x2w9q5m3t88k',
    recommendationId: 'rec-init-002',
    executedBy: 'CHOPADE_V (Senior DBA)',
    executedAt: '2024-09-28 16:45:00',
    actionType: 'SQL_PLAN_BASELINE',
    executedCommands: [
      `DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(sql_id => '7x2w9q5m3t88k', plan_hash_value => 1948201940, fixed => 'YES');`
    ],
    rollbackCommand: `DBMS_SPM.DROP_SQL_PLAN_BASELINE(sql_handle => 'SQL_7x2w9q5m3t88k');`,
    status: 'SUCCESS',
    executionTimeMs: 450,
    measuredImprovementPct: 88.2,
    notes: 'Pinned optimal execution plan with hash join baseline. Prevented CBO plan regression.',
  },
];
