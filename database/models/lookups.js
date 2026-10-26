const { createLookupRepository } = require('./lookup.model');

/**
 * Tabelas de apoio do CRM (id + name).
 * Todas usam o mesmo formato, então compartilham o repository genérico.
 */
module.exports = {
  ClientSegments: createLookupRepository({ table: 'client_segments', activeColumn: 'is_active' }),
  ClientGroups: createLookupRepository({ table: 'client_groups', activeColumn: 'is_active' }),
  ClientTypes: createLookupRepository({ table: 'client_types', orderBy: 'name' }),
  AddressTypes: createLookupRepository({ table: 'address_types', orderBy: 'type' }),
  ContactTypes: createLookupRepository({ table: 'contact_types', orderBy: 'description' }),
  TypeDocuments: createLookupRepository({ table: 'type_documents', orderBy: 'document_type' }),
  OpportunityTypes: createLookupRepository({ table: 'opportunities_type', orderBy: 'type' }),
  OpportunityStatuses: createLookupRepository({ table: 'opportunities_status', orderBy: 'status' }),
  InteractionTypes: createLookupRepository({ table: 'client_interactions_types', orderBy: 'description' }),
  EventTypes: createLookupRepository({ table: 'event_types', orderBy: 'code' })
};
