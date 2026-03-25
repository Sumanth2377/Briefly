# Livo Heartbeat Prototype

This repository contains the prototype and the accompanying system design document for the **Livo Heartbeat** feature (Option A).

## Part 1: Design Document

**1. Digest Contents**
The digest strips away operational noise, presenting only actionable BD updates, delivery blockers, and client sentiment shifts. Every 30 minutes, she needs to know: "Is a client waiting on me? Are any of our shipping deadlines at risk today? Did a key deal progress?"

**2. Urgency vs. Informational**
We use an LLM (e.g., Claude 3.5 Sonnet) with a strict rubric. "Urgent" means direct client questions, escalations, or explicit blockers reported by engineering. These trigger a prominent notification. "Informational" (general updates, closed tickets, routine scheduling) is silently batched into an end-of-day digest.

**3. Tools & MCP Servers**
We use the **Slack MCP** (internal delivery chatter), **Google Drive/Gmail MCP** (client comms), and **Linear/GitHub MCP** (blockers). MCPs standardise context retrieval. This avoids writing fragile, custom REST API wrappers for each distinct tool, keeping integration code minimal and generic.

**4. Hardest Calls**
The hardest call was aggressively filtering out 95% of updates, valuing brevity over completeness. Assuming she wants zero configuration, the system drops low-confidence alerts rather than risking spamming her. Since it runs locally on her MacBook for client data privacy, we gave up central cloud telemetry.

---

## Part 2: The Prototype Application

To demonstrate how the LLM reasoning would function in reality, this repository includes a "Concept Simulator" web app built with React (Vite) and Tailwind CSS.

### What it does:
1. **Raw Data Interception:** The left panel simulates a noisy stream of events across Slack, Jira, and Email happening in the background.
2. **Digest Generation:** The right panel serves as the "Founder Dashboard." Clicking "Generate Heartbeat" pushes the raw intercepted noise through the logic described in the design doc to produce a clean, 3-bullet actionable digest.

### Running Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Tech Stack
* React 18 (Vite)
* Tailwind CSS for styling
* Lucide React for iconography

## Deployment
This project is continuously deployed to Vercel and can be viewed at: **[Insert Vercel Link Here]**
