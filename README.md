# 🛡️ CodeSentinel

> **AI-powered code security platform** — scan, detect, and auto-fix vulnerabilities using a multi-LLM intelligent routing pipeline built on AWS Bedrock.

---

## ✨ Why CodeSentinel?

| Capability | What we do |
|---|---|
| **Intelligent Model Routing** | Nova Micro → Lite → Pro selected automatically by prompt complexity — cuts cost by up to 95% vs always using Pro |
| **Three-Layer Security Scan** | AWS IAM Access Analyzer (deterministic) + RAG context + Bedrock LLM analysis, merged & deduplicated |
| **Dynamic Auto-Fix** | Button applies the exact surgical fix directly into your editor. When snippets mismatch, falls back to a live `/api/fix` LLM call that locates & patches the vulnerable lines |
| **Simulate Attack Demo** | Adversarial red-team animation scans your code in real time before handing off to the AI defender — designed for compelling live demos |
| **AI Sentinel Chat** | In-app chatbot (powered by Nova middleware) explains any vulnerability and can generate remediation on demand |
| **Monaco Code Editor** | Full syntax highlighting, real-time glyph annotations marking vulnerable (🔴) and fixed (🟢) lines |
| **Downloadable Report** | One-click `.txt` security report with all findings, severities, CWEs, and remediation |
| **Auth + S3 Persistence** | Email/password signup & login; user data and analysis logs stored in AWS S3 |
| **Analytics Dashboard** | Live cost savings, token usage, latency, model distribution, and PII detection panel |
| **Rate Limiting & Health Guard** | SlowAPI rate limiter + prompt-injection detector preventing abuse and resource exhaustion |

---

## 🏗️ Architecture

```
Browser (Next.js 14)
    │
    ├─ POST /api/scan   → Three-layer pipeline: Parser → RAG → IAM Analyzer + Bedrock LLM
    ├─ POST /api/fix    → LLM generates original_snippet + fixed_snippet for any vuln
    └─ POST /process    → Nova Middleware: classify → route → invoke → return
                              ↓
                       Amazon Bedrock (Nova Micro / Lite / Pro)
                       AWS IAM Access Analyzer
                       AWS S3 (users + logs)
```

---

## 🚀 Setup

### Prerequisites
- Node.js 18+, Python 3.11+
- AWS account with Bedrock access (Nova models) and an S3 bucket

### 1. Clone & configure

```bash
git clone https://github.com/staree14/code-sentinel
cd code-sentinel
cp .env.example .env          # fill in AWS keys + S3 bucket
cp backend/.env.example backend/.env
```

### 2. Frontend

```bash
npm install
npm run dev          # http://localhost:3000
```

### 3. Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Environment variables (`.env` / `backend/.env`)

| Key | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET_NAME` | Bucket for user data & logs |

---

## 📂 Project Structure

```
codesentinel/
├── src/
│   ├── app/
│   │   ├── dashboard/     # Main security dashboard (scan + auto-fix + chat)
│   │   ├── scanner/       # Standalone scanner page
│   │   ├── login/ signup/ # Auth pages
│   │   └── analytics/     # Usage & cost analytics
│   └── components/        # Editor, Hero, Routing diagram, Nav
└── backend/
    ├── main.py            # FastAPI app — /api/scan, /api/fix, /process, /api/analytics
    ├── security_agent.py  # Three-layer scan pipeline
    ├── analyzer.py        # Local fallback pattern engine
    ├── services/
    │   ├── bedrock.py     # Bedrock Nova invocation
    │   ├── classifier.py  # Prompt complexity classifier
    │   ├── router.py      # Model routing logic
    │   ├── rag.py         # RAG context builder
    │   ├── iam_analyzer.py# AWS IAM Access Analyzer integration
    │   └── s3_service.py  # S3 read/write/log
    └── security_rules.json# CIS benchmark rules for RAG
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan` | Full three-layer vulnerability scan |
| `POST` | `/api/fix` | LLM-generated surgical fix for a specific vuln |
| `POST` | `/process` | Intelligent Nova middleware with routing analytics |
| `GET` | `/api/analytics` | Aggregate daily cost & usage stats |
| `POST` | `/api/signup` | User registration (S3-backed) |
| `POST` | `/api/login` | User authentication |

---

Built with Next.js · FastAPI · Amazon Bedrock · AWS IAM Access Analyzer · AWS S3
