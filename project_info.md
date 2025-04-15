# 🛡️ NeuraSec — AI-Powered Cybersecurity Platform for Students

**NeuraSec** is a modern, student-focused cybersecurity platform built with AI, offering real-time phishing detection, URL scanning, file malware detection, and more. It integrates powerful analyzer tools to help users stay safe in a digital world.

---

## 🚀 Tech Stack

| Layer        | Tech Used                                     |
|--------------|-----------------------------------------------|
| Frontend     | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Library   | ShadCN UI, Aceternity UI                      |
| Auth         | Clerk Authentication                         |
| ORM & DB     | Prisma + PostgreSQL (via Neon)               |
| Hosting      | Vercel (Later AWS optional)                  |

> ✅ Note: This version is for **local development only**. No Docker. Deployment will be added in the future.

---

## 🎯 Project Scope & Vision

NeuraSec empowers college students and beginner hackers with automated AI-driven cybersecurity tools. It includes:

- ⚡ **Quick analyzers** to scan emails, URLs, and files.
- 🧠 **AI threat analyzer** to explain logs or code in simple terms.
- 📊 **Central dashboard** showing scan stats and platform insights.
- 🏆 **Leaderboards & rewards** to gamify cybersecurity learning.

---

## 🔑 Authentication

The project uses [Clerk.dev](https://clerk.dev) for secure login/signup. Authenticated users can:

- Access scan tools.
- View their history (`My Scans`).
- Get auto-generated reports (`Submitted Reports`).
- Edit profile and settings.

---

## 🧭 Navigation & Pages

> Pages below are **routed, protected by Clerk**, and each has real, usable content with visual UI via ShadCN + Aceternity UI components.

### 🖥️ `/dashboard` – Main Hub

- Project vision, features, architecture
- Stats (scans done, threats caught)
- Quick access buttons to all analyzers
- Tech stack section with tooltips/icons
- Animated hero section (Aceternity style)

---

### ✉️ `/email-analyzer`

- Paste an email body
- AI model analyzes for phishing indicators
- Shows result: safe / suspicious / phishing
- Confidence score and explanation

---

### 🌐 `/url-analyzer`

- Enter a website URL
- Checks for malicious content using threat intel + AI
- Renders site preview (optional)
- Score + verdict (safe / risky / dangerous)

---

### 🗂️ `/file-analyzer` (Coming Soon)

- Upload a `.zip`, `.exe`, or `.docx`
- File is scanned for malware via VirusTotal (mocked now)
- Results are summarized for user

---

### 🧠 `/threat-analyzer`

- Paste any script/log/code snippet
- AI explains if it’s malicious, suspicious, or benign
- Gives threat level, severity, and what it could do

---

### 📊 `/threat-intelligence`

- Shows logs of all submitted threats across the platform
- Filter by scan type, severity, or date
- Helps track threat trends

---

### 🏆 `/leaderboard`

- Lists top contributors by number of scans
- Ranks by points
- Real-time updates with user info from Clerk

---

### 🎁 `/rewards`

- Gamified page to see available rewards
- Earn points for every scan or report
- Progress bars, badges, claim buttons

---

## 👤 User Profile Menu

When users click their avatar (top-right), show dropdown with:

- `👤 My Profile` – Edit name, email, picture  
- `📂 My Scans` – View personal scan history  
- `📝 Submitted Reports` – AI-generated incident reports  
- `⚙️ Settings` – Notification prefs, theme toggle, etc.

> Uses Clerk's `userButton` and `userProfile` components for auth integration.

---

## 🧱 Prisma Models

```prisma
model User {
  id        String  @id @default(cuid())
  clerkId   String  @unique
  email     String  @unique
  scans     Scan[]
  reports   Report[]
  leaderboard LeaderboardEntry?
  createdAt DateTime @default(now())
}

model Scan {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "email" | "url" | "file" | "custom"
  input     String
  result    String
  score     Float
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Report {
  id        String   @id @default(cuid())
  userId    String
  details   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model LeaderboardEntry {
  id        String   @id @default(cuid())
  userId    String   @unique
  points    Int
  user      User     @relation(fields: [userId], references: [id])
}

model Reward {
  id        String   @id @default(cuid())
  name      String
  description String
  points    Int
}


