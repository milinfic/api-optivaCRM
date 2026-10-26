const Users = require('./user.model');
const Clients = require('./client.model');
const clientChild = require('./client-child.model');
const ClientAddresses = require('./client-address.model');
const ClientContacts = require('./client-contact.model');
const Opportunities = require('./opportunity.model');
const Interactions = require('./interaction.model');
const Documents = require('./document.model');
const lookups = require('./lookups');
const db = require('../connection');

module.exports = {
  db,
  Users,
  Clients,
  ClientCommercial: clientChild.commercial,
  ClientFinancial: clientChild.financial,
  ClientSettings: clientChild.settings,
  ClientMarketing: clientChild.marketing,
  ClientTypes: clientChild.clientTypes,
  ClientAddresses,
  ClientContacts,
  Opportunities,
  Interactions,
  Documents,
  ...lookups
};
