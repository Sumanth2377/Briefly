export const rawDataStream = [
  { id: 1, type: 'slack', source: '#eng-delivery', time: '10:05 AM', author: 'Alex (Dev)', text: 'Deployment for CA Firm portal is stuck on a migration lock. Might push back the release by a day if we don\'t resolve.' },
  { id: 2, type: 'email', source: 'Gmail', time: '10:12 AM', author: 'Sarah (Acme Corp)', text: 'Hey team, just following up on the agentic search feature. We need this for our board meeting next Tuesday. Are we still on track?' },
  { id: 3, type: 'jira', source: 'LIVO-842', time: '10:15 AM', author: 'System', text: 'Ticket "Refactor OCR pipeline" marked as In Progress by David.' },
  { id: 4, type: 'slack', source: '#random', time: '10:18 AM', author: 'Priya', text: 'Anyone going for coffee in 10 mins?' },
  { id: 5, type: 'email', source: 'Gmail', time: '10:22 AM', author: 'John (PharmaTech)', text: 'Thanks for the update on the extraction model. The accuracy looks much better now!' },
  { id: 6, type: 'slack', source: '#eng-delivery', time: '10:25 AM', author: 'Alex (Dev)', text: 'Update: migration lock cleared. We are good to go for the release today.' },
  { id: 7, type: 'email', source: 'Gmail', time: '10:28 AM', author: 'CEO, Nexus Insurance', text: 'URGENT: The portal is throwing a 500 error for our underwriters. We need someone to look at this immediately.' },
  { id: 8, type: 'jira', source: 'LIVO-845', time: '10:30 AM', author: 'System', text: 'Ticket "Nexus Portal 500 Fix" created by Support Team. Priority: Blocker.' },
  { id: 9, type: 'slack', source: '#sales', time: '10:31 AM', author: 'Kangana', text: 'Just had a great call with the new NGO lead. They want a demo of the knowledge graph system tomorrow.' },
  { id: 10, type: 'slack', source: '#general', time: '10:33 AM', author: 'Soumya', text: 'Company all-hands in 15 mins. Please wrap up your tasks.' },
  { id: 11, type: 'email', source: 'Github', time: '10:35 AM', author: 'Dependabot', text: 'Bump axios from 1.5.0 to 1.6.0 in /frontend' },
  { id: 12, type: 'jira', source: 'LIVO-840', time: '10:38 AM', author: 'System', text: 'Ticket "Update landing page copy" marked as Done by Marketing.' }
];

export const getHeartbeatDigest = () => {
  // This simulates the LLM's output based on analyzing the above raw stream
  return {
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    items: [
      {
        type: 'critical',
        title: 'Nexus Insurance Portal Down',
        description: 'CEO reported a 500 error for underwriters. Support created blocker ticket LIVO-845. Engineering is investigating.',
        source: 'Email / Jira'
      },
      {
        type: 'warning',
        title: 'Acme Corp Agentic Search',
        description: 'Client asked for confirmation that feature will be ready for their board meeting next Tuesday. Needs a reply.',
        source: 'Email'
      },
      {
        type: 'success',
        title: 'New NGO Demo Scheduled',
        description: 'Kangana successfully pitched the knowledge graph system. Demo scheduled for tomorrow.',
        source: 'Slack (#sales)'
      }
    ]
  };
};
