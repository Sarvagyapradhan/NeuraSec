# 🔐 NeuraSec - Free URL Phishing Detection API

NeuraSec is a free and intelligent URL phishing detection system built using FastAPI, based on cutting-edge research from the "Best Free URL Phishing Detection" report. It scans URLs for threats like phishing, malware, typosquatting, and suspicious behaviors — using **only free tools and public APIs**.

---

## 🚀 Features

- 🧠 Lexical URL analysis (keywords, structure, length)
- 📡 Real-time threat intelligence checks via:
  - PhishTank
  - URLhaus
  - AlienVault OTX
  - AbuseIPDB (optional)
  - VirusTotal (if needed)
- 🕵️ WHOIS domain age checking
- 🔒 SSL/TLS certificate validation
- 🖼️ Optional dynamic scanning with urlscan.io
- ⚖️ Verdict scoring system (`Benign`, `Suspicious`, `Malicious`)

---

## 📦 Tech Stack

- **FastAPI** (Python 3.10+)
- `urllib.parse` (URL parsing)
- `requests` (API calls)
- `python-whois` (WHOIS data)
- `ssl`, `pyOpenSSL` (TLS check)
- `Levenshtein` (typosquatting)
- `.env` (for API keys)

---

## 📥 API Endpoint

### `/scan-url` – POST

Scans the input URL across multiple dimensions.

#### ✅ Request:

```json
{
  "url": "https://example.com/login"
}
```

#### 🔁 Response:

```json
{
  "url": "https://example.com/login",
  "verdict": "Suspicious",
  "score": 9,
  "sources": {
    "phishTank": false,
    "urlhaus": false,
    "otx": true
  },
  "domain_age_days": 2,
  "ssl_valid": true,
  "suspicious_features": [
    "short domain age",
    "login keyword in URL",
    "uses @ character"
  ],
  "suggestions": "Avoid clicking this link until more analysis is available"
}
```

---

## 🔄 Detection Stages

### 🧩 Stage 1 – Lexical & Structural Analysis

- Extract domain, TLD, subdomains, path, query
- Flag based on:
  - URL length > 100
  - Suspicious characters: `@`, `-`, multiple dots
  - Keywords (see list below)
  - Typosquatting via Levenshtein distance

### 🛡️ Stage 2 – Threat Intelligence (API)

- **PhishTank** – Phishing sites
- **URLhaus** – Malware domains
- **AlienVault OTX** – General threat intelligence
- **VirusTotal** – Aggregated AV verdicts (if others are inconclusive)
- **AbuseIPDB** – IP reputation


---

## 🛑 List of Suspicious Keywords (used in phishing URLs)

These are flagged if found in the domain or path:

```
login
verify
secure
account
password
signin
banking
confirm
checkout
update
reset
support
session
invoice
auth
activation
security
access
unlock
webmail
webscr
paypal
appleid
google
dropbox
mail
admin
wp-admin
download
install
portal
connect
web
attachment
report
alert
recover
open
doc
pdf
note
```

You can extend this list based on threat trends.

---
