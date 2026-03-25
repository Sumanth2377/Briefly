# Briefly - Executive Digest Architecture

## What should actually be in the digest?
Every 30 minutes, she needs a heavily synthesized tactical view. It tracks a 1-second mental model (e.g., 2 Risks, 1 Opportunity, 2 Stable), explicit client escalations to manage relationships, and timeline trajectories (e.g., 90% On-Track) for delivery oversight.

## How do you decide what is urgent vs informational?
Urgency is solely dictated by **business consequence**, not technical severity. A "database optimizing" alert is informational. "Negative client sentiment + Delay > 4h" is urgent because it signals immediate churn risk requiring intervention.

## Which tools or MCP servers would you use and why?
I would prioritize the **Slack MCP** and **Gmail/Drive MCPs** over raw API webhooks because MCPs supply rich, bidirectional context. This enables powerful action-latency reductions, like generating 1-click "Draft De-escalation" emails directly within the digest itself based on previous sentiment and threads.

## What were the hardest calls and what did you give up?
The hardest call was aggressively truncating raw engineering data, sacrificing completeness for decision speed. I completely omitted PR statuses, logs, and technical blockers. Instead, I translated them entirely into timeline delivery metrics (ETAs) and accountability owners (e.g., Owner: Compliance), allowing her to oversee delivery without ever reading code.
