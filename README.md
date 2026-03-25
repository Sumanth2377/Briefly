# Briefly (macOS Node)

> *“Synthesizing noise into decisive operational intelligence.”*

Briefly is a decision-assistant prototype designed for non-technical founders managing delivery and business development. Traditional dashboards focus on system logs or raw engineering metrics; Briefly focuses exclusively on business outcomes, consequence modeling, and reducing founder decision-latency.

## Key Features

Instead of a passive status report, Briefly acts as an active **Chief of Staff**:
- **Temporal Awareness:** Tracks exact data deltas since the last 30-minute interval (e.g., "PharmaTech moved from Watch → Risk").
- **Consequence Modeling:** Translates system failures into direct business impacts (e.g., "If ignored: client churn likely").
- **Zero-Latency Actions:** Replaces abstract recommendations with 1-click execution triggers (e.g., "Draft De-escalation Email" pre-populated with context).
- **Delivery Trajectories:** Translates engineering velocity into immediate ETA outcomes (e.g., "99% On-Track for Friday") rather than just listing Jira tickets.

---

## System Design Document

**Digest Contents & Cadence**
The digest is a decision assistant, not a report. Every 30 minutes, it provides a 1-second mental snapshot (e.g., “2 risks, 1 opportunity”) followed by prioritized items: client escalations, delivery risks (with precise ETAs), and BD expansion signals. Each item is compressed into a single actionable line and includes quick actions (e.g., draft reply) to drastically reduce response time.

**Urgency vs. Informational**
Urgency is defined by business impact, not isolated systemic events. A database error alone is informational; but when combined with a delayed response and negative client sentiment, it becomes critical. Urgent items explicitly target consequences (e.g., “risk of churn”) and suggest immediate actions. Informational updates are grouped safely or suppressed unless they indicate meaningful structural change.

**Architecture & Tooling**
The architecture integrates Slack, Email, and Jira MCP (Model Context Protocol) servers to seamlessly correlate client communication arrays with engineering activity. These sources provide the most reliable systemic footprint for tracking sentiment, trajectory progress, and delays. An LLM layer is utilized for deep summarization, prioritization, and sentiment classification.

**Engineering Trade-Offs**
The primary design trade-off was aggressively prioritizing *clarity* over completeness. Low-level logs and edge case details are entirely omitted in favor of simple heuristics that map complex issues directly to assigned Owners and Actions, guaranteeing fast, confident decision-making without technical cognitive load.

---

## Tech Stack
- **Frontend Framework:** React 18 + Vite 
- **Styling:** Tailwind CSS (Custom Inter typography, sleek 3D perspective CSS transforms)
- **Icons:** Lucide-React 

## Getting Started
```bash
# Clone the repository
git clone https://github.com/Sumanth2377/Briefly.git

# Install dependencies
npm install

# Run the local development server
npm run dev
```
