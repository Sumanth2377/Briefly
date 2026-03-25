# Livo Heartbeat: Reducing Decision Latency (Option A)

This repository contains the prototype and the accompanying system design document for the **Livo Heartbeat** feature.

> *"The goal is not to inform, but to reduce decision latency."*

## Part 1: Design Document (Decision Latency Driven)

**1. What’s in the digest?**  
We organize strictly by *client unit* rather than tool. Instead of repeating context, we only show *what changed* (+2 angry emails, pipeline resolved). We aggressively surface "silent failures" (e.g., no engineering activity on a priority client for 12 hours) alongside contextual, time-sensitive reminders ("Client call in 1 hr; no prep doc ready"). 

**2. Urgency vs. Informational**  
Every project receives a dynamic risk score (🟢 Healthy, 🟡 Watch, 🔴 At Risk). "Urgent" means a project shifted exactly to "At Risk" (e.g., *🔴 2 failed pipeline runs + pending client reply*). We use LLMs for compression and sentiment tracking, catching sudden negative tone shifts.

**3. Tools & Justification**  
*   **Slack/Email (MCP):** Real-time client signal (source of truth).
*   **DB (Postgres):** Structured project state.
*   **Logs/Monitoring:** System reliability and silent-failure detection.  
*Key distinction:* The LLM is used exclusively for compression and judgment, not raw data retrieval.

**4. Hardest Calls (Trade-offs)**  
Ignored 95% of low-priority logs entirely to reduce cognitive load. Used heuristic thresholds instead of perfect models for speed. Accepted occasional misclassification (flagged via "low confidence" tags in UI) to avoid missing critical urgency entirely.

---

## Part 2: The Concept Simulator Application

To demonstrate how the LLM reasoning would function in reality, this repository includes a "Concept Simulator" web app built with React (Vite) and Tailwind CSS. 

### Core Features Exhibited:
1. **"Where should I focus" Engine:** Translates raw sentiment shifts into top-level priority lists.
2. **Delta Detection:** Only extracts new occurrences since the last poll.
3. **Auto-Escalation Triggers:** Tells the founder exactly *how* to de-escalate if a risk score turns red.

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
* Lucide React for iconography
