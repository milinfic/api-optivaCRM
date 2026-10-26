const db = require('../connection');

const q = (trx) => (trx ? db('client_contacts').transacting(trx) : db('client_contacts'));

/**
 * Lista contatos do cliente com seus canais.
 *
 * @param {number} clientId
 * @returns {Promise<object[]>}
 */
exports.listByClient = async (clientId) => {
  const contacts = await q()
    .where('client_id', clientId)
    .orderBy('name');

  if (!contacts.length) return [];

  const channels = await db('client_contact_channels')
    .leftJoin('contact_types', 'contact_types.id', 'client_contact_channels.contact_type_id')
    .whereIn('client_contact_id', contacts.map(contact => contact.id))
    .select(
      'client_contact_channels.*',
      'contact_types.code as type_code',
      'contact_types.description as type_description'
    )
    .orderBy('client_contact_channels.id');

  const byContact = new Map();

  for (const channel of channels) {
    if (!byContact.has(channel.client_contact_id)) byContact.set(channel.client_contact_id, []);

    byContact.get(channel.client_contact_id).push(channel);
  }

  return contacts.map(contact => ({
    ...contact,
    channels: byContact.get(contact.id) ?? []
  }));
};

/**
 * @param {number} id
 * @returns {Promise<object|null>}
 */
exports.findById = async (id) => (await q().where('id', id).first()) ?? null;

/**
 * Cria contato + canais.
 *
 * @param {number} clientId
 * @param {object} data
 * @returns {Promise<object>}
 */
exports.create = async (clientId, data) => {
  return db.transaction(async (trx) => {
    const [contact] = await q(trx)
      .insert({
        client_id: clientId,
        name: data.name,
        position: data.position ?? null,
        department: data.department ?? null,
        active: data.active ?? true,
        notes: data.notes ?? null
      })
      .returning('*');

    await syncChannels(contact.id, data.channels ?? [], trx);

    return contact;
  });
};

/**
 * Atualiza contato e substitui os canais.
 *
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object|null>}
 */
exports.update = async (id, data) => {
  const current = await exports.findById(id);

  if (!current) return null;

  return db.transaction(async (trx) => {
    const [contact] = await q(trx)
      .update({
        name: data.name ?? current.name,
        position: data.position ?? current.position,
        department: data.department ?? current.department,
        active: data.active ?? current.active,
        notes: data.notes ?? current.notes
      })
      .where('id', id)
      .returning('*');

    if (data.channels) {
      await syncChannels(id, data.channels, trx);
    }

    return contact ?? null;
  });
};

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
exports.remove = async (id) => {
  const deleted = await q().where('id', id).del();

  return deleted > 0;
};

/**
 * Substitui os canais de um contato.
 *
 * @param {number} contactId
 * @param {object[]} channels
 * @param {any} [trx]
 */
const syncChannels = async (contactId, channels = [], trx = null) => {
  const runner = trx ? db('client_contact_channels').transacting(trx) : db('client_contact_channels');

  await runner.where('client_contact_id', contactId).del();

  const rows = channels
    .filter(channel => channel?.value)
    .map(channel => ({
      client_contact_id: contactId,
      contact_type_id: channel.contact_type_id ?? null,
      value: String(channel.value).trim(),
      normalized_value: channel.normalized_value ?? String(channel.value).replace(/\D/g, ''),
      is_primary: Boolean(channel.is_primary),
      verified: Boolean(channel.verified),
      notes: channel.notes ?? null
    }));

  if (rows.length) {
    await (trx ? db('client_contact_channels').transacting(trx) : db('client_contact_channels'))
      .insert(rows);
  }
};

exports.syncChannels = syncChannels;
