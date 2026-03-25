export const rawDataStream = [
  { id: 1, type: 'slack', source: 'Slack', time: '10:15 AM', author: 'Sarah (Eng)', text: 'Deployment for CA Firm portal is stuck on a migration lock. Might push back the release by a day if we don\'t resolve.' },
  { id: 2, type: 'email', source: 'Gmail', time: '10:18 AM', author: 'Mark (Acme Corp)', text: 'Hey, checking in on the sync today. Please ensure the prep document is attached to the agenda before we meet.' },
  { id: 3, type: 'jira', source: 'Jira', time: '10:19 AM', author: 'System', text: 'Ticket #882 "Database Optimization for PharmaTech" moved to BLOCKED.' },
  { id: 4, type: 'system', source: 'Monitor', time: '10:20 AM', author: 'Agent', text: 'SILENT FAILURE DETECTED: No Github commits or Jira activity on Project Nexus for 24 hours.' },
  { id: 5, type: 'email', source: 'Gmail', time: '10:22 AM', author: 'John (PharmaTech)', text: 'This delay is starting to cause issues on our end. Please advise on timeline immediately.' },
  { id: 6, type: 'slack', source: 'Slack', time: '10:25 AM', author: 'DevBot', text: 'Update: migration lock resolved for CA Firm. Deployment pipeline continuing.' },
  { id: 7, type: 'slack', source: 'Slack', time: '10:30 AM', author: 'Sarah (Eng)', text: 'Data pipeline successfully processed 3.2M rows for PharmaTech model training.' },
  { id: 8, type: 'system', source: 'Calendar', time: '10:35 AM', author: 'Agent', text: 'REMINDER: "Acme Corp Sync" starts in 1 hour. No prep document attached to the invite.' }
];

export const getHeartbeatDigest = () => {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    timestamp: timeStr,
    focus: [
      {
        client: 'PharmaTech',
        text: 'Tone shifted to negative',
        impact: 'Risk of churn if not addressed quickly.',
        confidence: 'High',
        reason: 'Flagged because: no reply + negative sentiment + delay > 4h',
        timeAgo: '45 mins ago',
        isPositive: false
      },
      {
        client: 'Acme Corp',
        text: 'Sync missing prep document',
        impact: 'Unprepared meeting may delay final approval.',
        confidence: 'High',
        reason: 'Flagged because: meeting < 1 hr + no linked docs detected',
        timeAgo: '15 mins ago',
        isPositive: false
      },
      {
        client: 'System Health',
        text: '3 data pipelines ran successfully',
        impact: 'All stable — no action required.',
        confidence: 'Very High',
        reason: 'Flagged because: previous pipeline failures were resolved',
        timeAgo: 'Just now',
        isPositive: true
      }
    ],
    projects: [
      {
        name: 'PharmaTech Model',
        client: 'PharmaTech',
        status: 'risk',
        statusReason: 'Client escalating due to delays',
        summary: 'Accuracy high (98%), but client unhappy due to communication delays.',
        deltas: [
          'Received urgent email from John',
          'DB optimization ticket blocked'
        ],
        recommendation: 'Action: Reply now to de-escalate client risk.',
        confidence: 'High Confidence'
      },
      {
        name: 'Project Nexus',
        client: 'Internal',
        status: 'watch',
        statusReason: 'Silent failure detected',
        summary: 'No engineering movement or activity detected for an unusual duration.',
        deltas: [
          'No Github/Jira activity for 24h'
        ],
        recommendation: 'Action: Ping TL for status check.',
        confidence: 'Medium Confidence'
      },
      {
        name: 'CA Firm Portal',
        client: 'CA Firm',
        status: 'healthy',
        statusReason: 'Migration lock resolved',
        summary: 'Deployments proceeding as normal. No blockers remain.',
        deltas: [
          'Migration lock cleared',
          'Pipeline resumed successfully'
        ],
        recommendation: null,
        confidence: 'High Confidence'
      }
    ]
  };
};
