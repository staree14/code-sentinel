export type Severity = "critical" | "high" | "medium" | "low";
export type ModelId =
  | "claude-haiku-3"
  | "claude-sonnet-3-5"
  | "claude-opus-3";

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  line: number;
  category: string;
  cwe: string;
  description: string;
  fix: string;
}

export interface AnalysisResult {
  model: ModelId;
  modelLabel: string;
  modelReason: string;
  complexity: "low" | "medium" | "high";
  durationMs: number;
  costUsd: number;
  savingsVsOpus: number; // percentage
  vulnerabilities: Vulnerability[];
  summary: string;
}

export const SAMPLE_CODE = `// Authentication service — Node.js / Express
const express = require('express');
const mysql   = require('mysql');
const crypto  = require('crypto');

const db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'admin123',          // ← hardcoded credential
  database : 'users_db',
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Direct string interpolation — SQL injection risk
  const query = \`SELECT * FROM users
    WHERE username='\${username}'
    AND   password='\${password}'\`;

  db.query(query, (err, results) => {
    if (results.length > 0) {
      // MD5 is cryptographically broken
      const token = crypto
        .createHash('md5')
        .update(username)
        .digest('hex');

      res.json({ token, user: results[0] });   // exposes full row
    }
  });
});

app.get('/user/:id', (req, res) => {
  // No authentication or ownership check
  const q = \`SELECT * FROM users WHERE id=\${req.params.id}\`;
  db.query(q, (err, r) => res.json(r[0]));
});`;

export const MOCK_VULNERABILITIES: Vulnerability[] = [
  {
    id: "V001",
    title: "SQL Injection",
    severity: "critical",
    line: 17,
    category: "Injection",
    cwe: "CWE-89",
    description:
      "User-supplied input is interpolated directly into SQL strings. An attacker can manipulate the query to bypass authentication or exfiltrate the entire database.",
    fix: `// Use parameterized queries
const q = 'SELECT id, username FROM users WHERE username = ? AND password = ?';
db.query(q, [username, hashedPwd], (err, rows) => { ... });`,
  },
  {
    id: "V002",
    title: "Hardcoded Credential",
    severity: "critical",
    line: 8,
    category: "Secrets Management",
    cwe: "CWE-798",
    description:
      "The database password is committed to source code. Anyone with repository access or a leaked build artifact can obtain it.",
    fix: `// Load from environment
const db = mysql.createConnection({
  password: process.env.DB_PASSWORD,  // set via AWS Secrets Manager
});`,
  },
  {
    id: "V003",
    title: "Broken Cryptography (MD5)",
    severity: "high",
    line: 25,
    category: "Cryptography",
    cwe: "CWE-326",
    description:
      "MD5 produces predictable, collision-prone hashes. Session tokens derived from MD5 can be forged.",
    fix: `// Cryptographically secure random token
const token = crypto.randomBytes(32).toString('hex');
// Or sign a JWT with RS256 / ES256`,
  },
  {
    id: "V004",
    title: "Missing Authorization (IDOR)",
    severity: "high",
    line: 34,
    category: "Access Control",
    cwe: "CWE-285",
    description:
      "Any authenticated (or unauthenticated) user can read any other user's record by incrementing the :id parameter.",
    fix: `app.get('/user/:id', requireAuth, (req, res) => {
  if (req.user.id !== Number(req.params.id))
    return res.status(403).json({ error: 'Forbidden' });
  // proceed
});`,
  },
  {
    id: "V005",
    title: "Sensitive Data Exposure",
    severity: "medium",
    line: 29,
    category: "Information Disclosure",
    cwe: "CWE-200",
    description:
      "The full database row (including password hash and PII) is returned to the client without field-level filtering.",
    fix: `// SELECT only the fields you need
const q = 'SELECT id, username, email FROM users WHERE username = ?';
// Or strip sensitive fields before sending
const { password_hash, ...safeUser } = results[0];
res.json({ token, user: safeUser });`,
  },
];

export function getMockAnalysis(code: string): AnalysisResult {
  const lines = code.split("\n").length;
  const hasCredentials = /password\s*[:=]\s*['"][^'"]{4,}/.test(code);
  const hasSql = /\$\{[^}]+\}/.test(code) && /SELECT|INSERT|UPDATE/i.test(code);

  let model: ModelId = "claude-haiku-3";
  let modelLabel = "Claude Haiku";
  let costUsd = 0.0008;
  let savingsVsOpus = 95;
  let modelReason = "Low complexity — simple patterns only";
  let complexity: AnalysisResult["complexity"] = "low";

  if (hasSql || hasCredentials) {
    model = "claude-sonnet-3-5";
    modelLabel = "Claude Sonnet 3.5";
    costUsd = 0.0055;
    savingsVsOpus = 63;
    modelReason = "Medium complexity — security-sensitive patterns detected";
    complexity = "medium";
  }

  if (hasSql && hasCredentials && lines > 30) {
    model = "claude-opus-3";
    modelLabel = "Claude Opus";
    costUsd = 0.015;
    savingsVsOpus = 0;
    modelReason = "High complexity — multiple critical patterns, deep analysis required";
    complexity = "high";
  }

  return {
    model,
    modelLabel,
    modelReason,
    complexity,
    durationMs: complexity === "low" ? 820 : complexity === "medium" ? 1350 : 2180,
    costUsd,
    savingsVsOpus,
    vulnerabilities: MOCK_VULNERABILITIES,
    summary: `Found ${MOCK_VULNERABILITIES.length} vulnerabilities (2 critical, 2 high, 1 medium). Immediate remediation required.`,
  };
}
