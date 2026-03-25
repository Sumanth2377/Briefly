export const rawDataStream = [
  { id: 1, type: 'slack', source: '#eng-delivery', time: '10:05 AM', author: 'Alex (Dev)', text: 'Deployment for CA Firm portal is stuck on a migration lock. Might push back the release by a day if we don\'t resolve.' },
  { id: 2, type: 'email', source: 'Gmail', time: '10:12 AM', author: 'Sarah (Acme Corp)', text: 'Hey team, just following up on the agentic search feature. We need this for our board meeting tomorrow. Are we still on track?' },
  { id: 3, type: 'jira', source: 'LIVO-842', time: '10:15 AM', author: 'System', text: 'Ticket "Refactor OCR pipeline" marked as In Progress by David.' },
  { id: 4, type: 'system', source: 'Monitor', time: '10:20 AM', author: 'Agent', text: 'SILENT FAILURE DETECTED: No Github commits or Jira activity on Project Nexus for 24 hours.' },
  { id: 5, type: 'email', source: 'Gmail', time: '10:22 AM', author: 'John (PharmaTech)', text: 'This delay is starting to cause issues on our end. Please advise on timeline immediately.' },
  { id: 6, type: 'slack', source: '#eng-delivery', time: '10:25 AM', author: 'Alex (Dev)', text: 'Update: migration lock cleared. We are good to go for the CA Firm release today.' },
  { id: 7, type: 'slack', source: '#sales', time: '10:31 AM', author: 'Kangana', text: 'Just had a great call with the new NGO lead. They want a demo of the knowledge graph system tomorrow.' },
  { id: 8, type: 'system', source: 'Calendar', time: '10:35 AM', author: 'Agent', text: 'REMINDER: "Acme Corp Sync" starts in 1 hour. No prep document attached to the invite.' }
];

export const getHeartbeatDigest = () => {
  return {
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    focus: [
      {
        text: 'Focus on PharmaTech — Tone shifted from Neutral → Negative in latest thread. No dev reply in 4 hrs.',
        confidence: 'High'
      },
      {
        text: 'Review or create prep-doc for Acme Corp sync before 11:30 AM.',
        confidence: 'High'
      }
    ],
    projects: [
      {
        name: 'PharmaTech Extraction',
        status: 'risk',
        statusReason: 'Client tone dropped + Delayed response',
        summary: 'Model accuracy reached 98%, but client is angry about communication delays.',
        deltas: ['+1 angry client email', 'No dev response since yesterday'],
        recommendation: 'Recommend immediate reply to de-escalate.'
      },
      {
        name: 'Nexus Insurance Portal',
        status: 'watch',
        statusReason: 'Silent failure detected',
        summary: 'Underwriter portal was deployed last week, but velocity has flatlined.',
        deltas: ['No repository or Jira activity for 24h'],
        recommendation: 'Check if engineering is blocked on requirements.'
      },
      {
        name: 'CA Firm Automation',
        status: 'healthy',
        statusReason: 'Blocker resolved quickly',
        summary: 'Release is 100% on track for today.',
        deltas: ['Migration lock resolved automatically'],
        confidence: 'Low confidence (awaiting final QA sign-off)'
      }
    ]
  };
};
