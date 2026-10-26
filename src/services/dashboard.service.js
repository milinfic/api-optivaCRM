const Clients = require('../../database/models/client.model');
const Opportunities = require('../../database/models/opportunity.model');
const Interactions = require('../../database/models/interaction.model');
const db = require('../../database/connection');

/**
 * Indicadores do dashboard.
 *
 * @returns {Promise<object>}
 */
exports.summary = async () => {
  const stats = await Clients.stats();

  const [{ clients_month }] = await db('clients')
    .whereNull('deleted_at')
    .whereRaw("created_at >= date_trunc('month', now())")
    .count({ clients_month: '*' });

  const pipeline = await Opportunities.pipelineByStatus();
  const upcoming = await Interactions.upcoming(5);

  const [{ won }] = await db('opportunities')
    .leftJoin('opportunities_status', 'opportunities_status.id', 'opportunities.opportunity_status_id')
    .whereNull('opportunities.deleted_at')
    .whereRaw("lower(opportunities_status.status) like 'ganh%'")
    .count({ won: '*' });

  return {
    ...stats,
    clientsThisMonth: Number(clients_month ?? 0),
    wonOpportunities: Number(won ?? 0),
    pipeline,
    upcomingContacts: upcoming
  };
};
