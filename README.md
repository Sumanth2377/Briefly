# Briefly Prototype

This repository contains the concept simulator web app and the system design document for the **Briefly** feature (Option A).

## Part 1: Design Document (Decision Latency Driven)

The digest should act as a decision assistant, not a status report. Every 30 minutes, it surfaces only what needs attention.

It includes: (1) urgent alerts (client escalation, missed deadlines, failed pipelines), (2) project snapshots with risk labels (Healthy / Watch / At Risk + reason), (3) pending client conversations (>3–4 hours without reply), and (4) key updates since the last cycle. Each item is compressed into one line to keep it scannable within 30 seconds.

Urgency is determined using simple rules: negative client sentiment, overdue tasks, repeated system failures, or inactivity where progress is expected. Informational updates are shown only if they represent meaningful change.

Data is pulled from Slack/email (client signals), project DB (task state), and system logs (pipeline health). An LLM is used for summarization, sentiment detection, and prioritization, not raw retrieval.

Key trade-offs: I prioritised brevity over completeness, ignoring low-level logs to reduce noise. I used heuristic thresholds instead of complex models for reliability. Some misclassification is acceptable if it ensures critical issues are never missed.

The goal is to reduce decision latency and highlight exactly where intervention is needed.

---

## Part 2: The Concept Simulator Application

To demonstrate how the LLM reasoning would function in reality, this repository includes a highly polished "Concept Simulator" web app built with React (Vite) and Tailwind CSS. 

### Core Features Exhibited (Live in Prototype):
1. **"Where should I focus" Engine:** Identifies >4hr pending client conversations and sudden sentiment shifts.
2. **Project Snapshots & Risk Labels:** Dynamically tags projects as 🟢 Healthy, 🟡 Watch, or 🔴 At Risk, displaying explicit reasons for the status switch.
3. **Delta Detection:** Only extracts new occurrences since the last poll.
4. **Auto-Escalation Triggers:** Tells the founder exactly *how* to intervene.

### Running Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Tech Stack
* React 18 (Vite)
* Tailwind CSS V3 for rapid styling

## Deployment
This project is continuously deployed to Vercel and can be viewed at: **[Insert Vercel Link Here]**
