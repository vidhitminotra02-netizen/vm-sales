const buildIcpAgent = require('./icpBuilder');
const buildLeadFinderAgent = require('./leadFinder');
const buildOutreachWriterAgent = require('./outreachWriter');
const buildPipelineCoachAgent = require('./pipelineCoach');
const buildStrategyAdvisorAgent = require('./strategyAdvisor');

const routeAgentRequest = (agentId, ai, messages) => {
  switch (agentId) {
    case 'icp':
      return buildIcpAgent(ai, messages);
    case 'leads':
      return buildLeadFinderAgent(ai, messages);
    case 'write':
      return buildOutreachWriterAgent(ai, messages);
    case 'deals':
      return buildPipelineCoachAgent(ai, messages);
    case 'strategy':
      return buildStrategyAdvisorAgent(ai, messages);
    default:
      throw new Error(`Unknown agent ID: ${agentId}`);
  }
};

module.exports = routeAgentRequest;
