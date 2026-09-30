import { RagDocumentChunk } from '../types/llm';

export const INITIAL_RAG_KNOWLEDGE_BASE: RagDocumentChunk[] = [
  {
    id: 'rag-cbo-01',
    docTitle: 'Oracle Database 19c Performance Tuning Guide',
    category: 'CBO_TUNING',
    section: 'Chapter 14: Optimizer Cost Calculation & Function-Based Indexes',
    content: `When a SQL query applies SQL functions (e.g. UPPER(c.country) or TRUNC(trans_date)) to indexed columns in WHERE predicates, the Cost-Based Optimizer (CBO) cannot use standard B-Tree indexes because index keys store unmodified values. As a result, the optimizer defaults to a Full Table Scan (TABLE ACCESS FULL) with high I/O wait (db file sequential read).
Remediation:
Create a Function-Based Index online:
CREATE INDEX schema.idx_col_func ON schema.table (UPPER(col)) TABLESPACE INDX_TBS01 ONLINE COMPUTE STATISTICS;
This pre-calculates function results into the index leaf blocks, enabling INDEX RANGE SCAN and reducing buffer gets by over 80%.`,
    tags: ['cbo', 'full_table_scan', 'function_based_index', 'buffer_gets', 'db_file_sequential_read'],
    keywords: ['upper', 'country', 'function', 'index', 'slow query', 'cbo', 'cost', 'plan', '8f7q2m8x9p31a'],
    author: 'Oracle Documentation Architecture Team',
    oracleVersion: 'Oracle 19c EE Release 19.18',
  },
  {
    id: 'rag-lock-02',
    docTitle: 'Oracle Database 19c Performance Tuning Guide',
    category: 'CBO_TUNING',
    section: 'Chapter 10: Diagnosing Lock Contention & enq: TX - row lock contention',
    content: `The wait event 'enq: TX - row lock contention' occurs when an application session attempts to UPDATE or DELETE a table row that is currently locked in Mode 6 (Exclusive Row Lock) by an uncommitted transaction in another session.
Diagnosis Queries:
1. Locate blocker SID:
   SELECT sid, serial#, username, blocking_session, event, seconds_in_wait FROM v$session WHERE blocking_session IS NOT NULL;
2. Identify object:
   SELECT object_name FROM dba_objects WHERE object_id = :row_wait_obj#;
Remediation:
Application must commit or rollback. If transaction is hung or orphaned, terminate the blocker:
ALTER SYSTEM KILL SESSION 'sid,serial#' IMMEDIATE;
Note: Ensure human authorization (HITL) and CAB ticket tracking before executing production session kills.`,
    tags: ['locks', 'tx_contention', 'v$session', 'blocker', 'kill_session'],
    keywords: ['enq: tx', 'row lock contention', 'lock', 'blocker', 'kill', 'session', '142', 'contention'],
    author: 'Oracle RAC & Concurrency Engineering',
    oracleVersion: 'Oracle 19c EE',
  },
  {
    id: 'rag-ora-03',
    docTitle: 'Oracle Database 19c Error Messages & Troubleshooting',
    category: 'ERROR_RESOLUTION',
    section: 'ORA-01555: snapshot too old: rollback segment number with name too small',
    content: `ORA-01555 occurs when a long-running query requires read-consistent (CR) data block images from the UNDO tablespace that have been overwritten by concurrent transaction commits.
Root Causes:
1. UNDO_RETENTION is set too low relative to the longest batch query duration.
2. UNDO tablespace lacks space to retain unexpired undo segments.
3. Fetch-across-commit loops in PL/SQL application logic.
Remediation:
1. Increase UNDO retention to exceed longest query elapsed time:
   ALTER SYSTEM SET UNDO_RETENTION = 14400 SCOPE=BOTH; -- 4 hours
2. Enable guaranteed undo retention:
   ALTER TABLESPACE UNDOTBS1 RETENTION GUARANTEE;
3. Ensure UNDO tablespace has AUTOEXTEND enabled with sufficient disk quota.`,
    tags: ['ora-01555', 'undo_retention', 'undotbs1', 'read_consistency', 'cr_blocks'],
    keywords: ['ora-01555', 'snapshot too old', 'undo', 'retention', 'rollback', 'guarantee'],
    author: 'Oracle Core Storage Support',
    oracleVersion: 'Oracle 19c EE',
  },
  {
    id: 'rag-cis-04',
    docTitle: 'CIS Oracle Database 19c Benchmark v1.1.0',
    category: 'SECURITY_CIS',
    section: '1.1: Ensure REMOTE_OS_AUTHENT is set to FALSE',
    content: `Profile Applicability: Level 1 - RDBMS
Description:
The REMOTE_OS_AUTHENT parameter controls whether a remote client operating system username can be trusted to authenticate directly to the database without a password.
Rationale:
Setting REMOTE_OS_AUTHENT=TRUE introduces a critical vulnerability where an attacker on any remote machine on the corporate network can forge their local username as 'SYS' or 'SYSTEM' and obtain full administrative control.
Audit Command:
SELECT name, value FROM v$parameter WHERE name = 'remote_os_authent';
Remediation Script:
ALTER SYSTEM SET REMOTE_OS_AUTHENT = FALSE SCOPE = SPFILE;
Note: Requires database instance restart on next maintenance window to take effect.`,
    tags: ['cis', 'stig', 'remote_os_authent', 'authentication', 'spfile', 'critical_risk'],
    keywords: ['remote_os_authent', 'cis-ora19-1.1', 'cis', 'security', 'spfile', 'authentication'],
    author: 'Center for Internet Security (CIS)',
    oracleVersion: 'CIS Oracle 19c v1.1.0',
  },
  {
    id: 'rag-cis-05',
    docTitle: 'CIS Oracle Database 19c Benchmark v1.1.0',
    category: 'SECURITY_CIS',
    section: '2.1: Ensure Default & Sample Accounts are Locked and Expired',
    content: `Profile Applicability: Level 1 - RDBMS
Description:
Sample and demonstration database schemas (e.g. SCOTT, HR, OE, PM, IX, SH, BI) installed during database template creation contain default credentials (e.g. SCOTT/TIGER) that are universally documented in security research and dictionary attack tools.
Remediation Script:
ALTER USER SCOTT ACCOUNT LOCK PASSWORD EXPIRE;
ALTER USER HR ACCOUNT LOCK PASSWORD EXPIRE;
ALTER USER OE ACCOUNT LOCK PASSWORD EXPIRE;
ALTER USER SH ACCOUNT LOCK PASSWORD EXPIRE;
Emergency Rollback:
ALTER USER SCOTT ACCOUNT UNLOCK;`,
    tags: ['cis', 'default_accounts', 'scott', 'tiger', 'password_expire'],
    keywords: ['scott', 'hr', 'oe', 'default accounts', 'cis-ora19-2.1', 'lock', 'expire'],
    author: 'Center for Internet Security (CIS)',
    oracleVersion: 'CIS Oracle 19c v1.1.0',
  },
  {
    id: 'rag-cis-06',
    docTitle: 'CIS Oracle Database 19c Benchmark v1.1.0',
    category: 'SECURITY_CIS',
    section: '3.2: Revoke PUBLIC EXECUTE on Out-of-Band Network Packages',
    content: `Profile Applicability: Level 1 - RDBMS
Description:
By default, Oracle grants EXECUTE privilege to PUBLIC on built-in PL/SQL packages such as UTL_FILE (operating system file I/O), UTL_HTTP (outbound web requests), UTL_TCP (raw socket connections), and DBMS_JAVA.
Risk:
Malicious users or SQL injection vulnerabilities can leverage these packages to trigger Server-Side Request Forgery (SSRF), exfiltrate table contents over DNS/HTTP, or read sensitive server files.
Remediation:
REVOKE EXECUTE ON SYS.UTL_FILE FROM PUBLIC;
REVOKE EXECUTE ON SYS.UTL_HTTP FROM PUBLIC;
REVOKE EXECUTE ON SYS.UTL_TCP FROM PUBLIC;
REVOKE EXECUTE ON SYS.DBMS_JAVA FROM PUBLIC;`,
    tags: ['cis', 'privileges', 'utl_file', 'utl_http', 'public_grants', 'ssrf'],
    keywords: ['utl_file', 'utl_http', 'utl_tcp', 'dbms_java', 'cis-ora19-3.2', 'revoke', 'public'],
    author: 'Center for Internet Security (CIS)',
    oracleVersion: 'CIS Oracle 19c v1.1.0',
  },
  {
    id: 'rag-sec-07',
    docTitle: 'Oracle Database 19c Security Guide',
    category: 'SECURITY_CIS',
    section: 'Chapter 12: Transparent Data Encryption (TDE) & Keystore Management',
    content: `Transparent Data Encryption (TDE) protects sensitive data at rest by encrypting datafiles in the operating system file system using AES-256 or AES-128 algorithms without requiring application code changes.
Requirement: PCI-DSS v4.0 Requirement 3.4 & CIS Level 2.
Online Tablespace Encryption Command:
ADMINISTER KEY MANAGEMENT SET KEY USING KEYSTORE IDENTIFIED BY "*****" WITH BACKUP;
ALTER TABLESPACE FIN_TBS01 ENCRYPTION ONLINE USING 'AES256' ENCRYPT;
This encrypts all blocks online in background extents without locking concurrent SELECT or DML operations.`,
    tags: ['tde', 'encryption', 'pci_dss', 'fin_tbs01', 'keystore', 'aes256'],
    keywords: ['tde', 'encryption', 'tablespace', 'fin_tbs01', 'aes256', 'pci-dss', 'cis-ora19-5.1'],
    author: 'Oracle Database Security Product Management',
    oracleVersion: 'Oracle 19c Enterprise Edition',
  },
  {
    id: 'rag-spm-08',
    docTitle: 'Oracle Database 19c Performance Tuning Guide',
    category: 'CBO_TUNING',
    section: 'Chapter 28: SQL Plan Management (SPM) Baselines & DBMS_SPM',
    content: `SQL Plan Management (SPM) preserves execution performance by preventing plan regression across statistics updates, database version patches, or schema changes.
Workflow:
1. Capture optimal plan from Cursor Cache into SQL Management Base (SMB):
   DECLARE
     l_plans PLS_INTEGER;
   BEGIN
     l_plans := DBMS_SPM.LOAD_PLANS_FROM_CURSOR_CACHE(
       sql_id => '8f7q2m8x9p31a',
       plan_hash_value => 384729104,
       fixed => 'YES'
     );
   END;
   /
2. When marked 'fixed => YES', the Cost-Based Optimizer is constrained to use this proven plan.`,
    tags: ['spm', 'sql_plan_management', 'dbms_spm', 'plan_baseline', 'plan_hash_value'],
    keywords: ['spm', 'baseline', 'dbms_spm', 'plan', 'cursor cache', 'regression'],
    author: 'Oracle Optimizer Team',
    oracleVersion: 'Oracle 19c EE',
  },
  {
    id: 'rag-sop-09',
    docTitle: 'Enterprise DBA Standard Operating Procedures (SOP)',
    category: 'SOP_RUNBOOK',
    section: 'SOP-DBA-901: Dual-Custody Production Emergency Changes (CAB)',
    content: `All production database changes classified as HIGH or CRITICAL risk (including KILL SESSION, DROP INDEX, SPFILE ALTERATION, or USER PRIVILEGE ALTERATION) must follow the Dual-Custody Authorization Gate:
1. Identify the Change Ticket ID (ServiceNow / Jira CHG-XXXX).
2. Validate operator clearance (Level 4 Principal DBA or Security Director).
3. Complete Step-Up Multi-Factor Authentication (TOTP 6-digit challenge or hardware security token).
4. Verify presence of tested rollback scripts.
5. All executions are cryptographically signed and logged into immutable dba_audit_trail for SOX Section 404 audit compliance.`,
    tags: ['sop', 'cab', 'hitl', 'dual_custody', 'sox_compliance', 'mfa'],
    keywords: ['cab', 'hitl', 'sop', 'approval', 'dual-custody', 'mfa', 'totp', 'clearance'],
    author: 'Global Enterprise Database Governance Office',
    oracleVersion: 'Enterprise Operations Standards',
  },
];

export function searchRagKnowledge(query: string, topK: number = 3): RagDocumentChunk[] {
  if (!query || typeof query !== 'string') return INITIAL_RAG_KNOWLEDGE_BASE.slice(0, topK);

  const queryTerms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

  const scored = INITIAL_RAG_KNOWLEDGE_BASE.map((chunk) => {
    let score = 0;
    const lowerContent = chunk.content.toLowerCase();
    const lowerTitle = chunk.docTitle.toLowerCase();
    const lowerSection = chunk.section.toLowerCase();

    for (const term of queryTerms) {
      if (chunk.keywords.some((k) => k.toLowerCase().includes(term))) score += 4;
      if (chunk.tags.some((tag) => tag.toLowerCase().includes(term))) score += 3;
      if (lowerSection.includes(term)) score += 2;
      if (lowerTitle.includes(term)) score += 1.5;
      if (lowerContent.includes(term)) score += 1;
    }

    // Normalized relevance score between 0.65 and 0.99
    const normalizedScore = Math.min(0.99, Math.max(0.65, Number((0.65 + score * 0.04).toFixed(2))));

    return {
      ...chunk,
      relevanceScore: normalizedScore,
    };
  });

  scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  return scored.slice(0, topK);
}
