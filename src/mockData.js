export const rawDataStream = [
  { id: 1, type: 'slack', source: 'Slack', time: '10:15 AM', author: 'Sarah (Eng)', text: 'Deployment for CA Firm portal is stuck on a migration lock. Might push back the release by a day if we don\'t resolve.' },
  { id: 2, type: 'email', source: 'Gmail', time: '10:18 AM', author: 'Mark (Acme Corp)', text: 'Hey, checking in on the sync today. Please ensure the prep document is attached to the agenda before we meet.' },
  { id: 3, type: 'jira', source: 'Jira', time: '10:19 AM', author: 'System', text: 'Ticket #882 "Database Optimization for PharmaTech" moved to BLOCKED.' },
  { id: 4, type: 'system', source: 'Monitor', time: '10:20 AM', author: 'Agent', text: 'SILENT FAILURE DETECTED: No Github commits or Jira activity on Project Nexus for 24 hours.' },
  { id: 5, type: 'email', source: 'Gmail', time: '10:22 AM', author: 'John (PharmaTech)', text: 'This delay is starting to cause issues on our end. Please advise on timeline immediately.' },
  { id: 6, type: 'slack', source: 'Slack', time: '10:25 AM', author: 'DevBot', text: 'Update: migration lock resolved for CA Firm. Deployment pipeline continuing.' },
  { id: 7, type: 'slack', source: 'Slack', time: '10:30 AM', author: 'Sarah (Eng)', text: 'Data pipeline successfully processed 3.2M rows for PharmaTech model training.' },
  { id: 8, type: 'system', source: 'Calendar', time: '10:35 AM', author: 'Agent', text: 'REMINDER: "Acme Corp Sync" starts in 1 hour. No prep document attached to the invite.' },
  { id: 9, type: 'email', source: 'Gmail', time: '10:42 AM', author: 'VP (GlobalBank)', text: 'Platform is working great. Who do we speak to about rolling this out to 50 additional seats next quarter?' },
  { id: 10, type: 'jira', source: 'Jira', time: '10:45 AM', author: 'System', text: 'Velocity alert: Stripe Integration sprint is slipping. Legal compliance task untouched for 72 hours.' }
];

export const getHeartbeatDigest = () => {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    timestamp: timeStr,
    globalDeltas: [
      'PharmaTech moved from Watch → Risk',
      'Sustained inactivity detected on Project Nexus',
      '1 new BD expansion opportunity logged (GlobalBank)'
    ],
    focus: [
      {
        id: 'f1',
        client: 'PharmaTech',
        text: 'Tone shifted to negative regarding project timeline',
        impact: 'High churn risk.',
        consequence: 'If ignored: client churn likely within next interaction.',
        confidence: 'High',
        confidenceContext: 'based on tone shift across 2 distinct threads',
        reason: 'No dev response • Negative sentiment • Delay > 4h',
        timeAgo: '45 mins ago',
        isPositive: false,
        action: 'Draft De-escalation Email',
        actionContext: 'Includes context from last 3 emails'
      },
      {
        id: 'f2',
        client: 'GlobalBank Inc.',
        text: 'Inquired about upgrading Enterprise tier (+50 seats)',
        impact: 'Expansion / BD Opportunity.',
        confidence: 'Very High',
        confidenceContext: 'explicit intent in inbound email',
        reason: 'Explicit intent detected • Inbound email • Pricing inquiry',
        timeAgo: '12 mins ago',
        isPositive: true,
        action: 'Draft BD Intro',
        actionContext: 'Drafts introductory expansion pricing playbook'
      },
      {
        id: 'f3',
        client: 'Acme Corp',
        text: 'Upcoming sync is missing critical prep document',
        impact: 'May delay final project approval.',
        consequence: 'If ignored: sync will likely be unproductive or rescheduled.',
        confidence: 'High',
        confidenceContext: 'calendar validation matched against drive assets',
        reason: 'Calendar sync < 1 hr • No presentation docs attached',
        timeAgo: '15 mins ago',
        isPositive: false
      }
    ],
    projects: [
      {
        name: 'PharmaTech Model',
        client: 'PharmaTech',
        status: 'risk',
        statusReason: 'Client Escalation',
        eta: 'At Risk (T-minus 2 days)',
        summary: 'Accuracy met target; client awaiting deployment timeline confirmation.',
        deltas: [
          'Received urgent email from John',
          'DB optimization ticket formally blocked'
        ],
        recommendation: 'Action: Contact Eng Lead for ETA. (Owner: Backend Team)',
        confidence: 'High Confidence'
      },
      {
        name: 'Stripe Billing Auth',
        client: 'Internal / Platform',
        status: 'risk',
        statusReason: 'Velocity Dropping',
        eta: '60% Confidence (Slipping)',
        summary: 'Sprint is falling behind schedule. Engineering is blocked by pending legal/compliance review.',
        deltas: [
          'Legal compliance task untouched for 72h'
        ],
        recommendation: 'Action: Reach out to Legal to unblock. (Owner: Compliance)',
        confidence: 'High Confidence'
      },
      {
        name: 'Project Nexus',
        client: 'Internal',
        status: 'watch',
        statusReason: 'Silent Failure',
        eta: '75% On-Track',
        summary: 'No engineering movement or activity detected for an unusual duration. Sustained inactivity detected.',
        deltas: [
          'Zero Github/Jira activity for 24h'
        ],
        missingData: 'Architectural roadmap not logged',
        recommendation: 'Action: Check with TL for status. (Owner: Platform)',
        confidence: 'Medium Confidence'
      },
      {
        name: 'CA Firm Portal',
        client: 'CA Firm',
        status: 'healthy',
        statusReason: 'Blocker Resolved',
        eta: '99% On-Track for Friday',
        summary: 'Migration lock cleared successfully. Final deployment proceeding smoothly.',
        deltas: [
          'Migration lock cleared over Slack',
          'Pipeline resumed successfully'
        ],
        missingData: 'QA deployment sign-off not recorded',
        recommendation: null,
        confidence: 'High Confidence'
      },
      {
        name: 'GlobalBank Sandbox',
        client: 'GlobalBank Inc.',
        status: 'healthy',
        statusReason: 'Upsell Triggered',
        eta: 'Completed',
        summary: 'Piloting phase completely successful. Client requesting broader rollout.',
        deltas: [
          'VP requested 50 additional seats via email'
        ],
        recommendation: null,
        confidence: 'High Confidence'
      }
    ]
  };
};
