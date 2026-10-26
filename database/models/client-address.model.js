const db = require('../connection');

/**
 * Query builder de `client_addresses` (com joins de endereço e cidade).
 *
 * @param {any} [trx]
 * @returns {any}
 */
const q = (trx) => (trx ? db('client_addresses').transacting(trx) : db('client_addresses'));

/**
 * Lista os endereços de um cliente com cidade/UF e tipo.
 *
 * @param {number} clientId
 * @returns {Promise<object[]>}
 */
exports.listByClient = async (clientId) =>
  q()
    .leftJoin('addresses', 'addresses.id', 'client_addresses.address_id')
    .leftJoin('cities', 'cities.id', 'addresses.city_id')
    .leftJoin('address_types', 'address_types.id', 'client_addresses.address_type_id')
    .where('client_addresses.client_id', clientId)
    .select(
      'client_addresses.*',
      'addresses.zip_code',
      'addresses.street',
      'addresses.district',
      'cities.city',
      'cities.state',
      'cities.ibge_code',
      'address_types.type as address_type'
    )
    .orderBy('client_addresses.id');

/**
 * @param {number} id
 * @returns {Promise<object|null>}
 */
exports.findById = async (id) =>
  (await q().where('id', id).first()) ?? null;

/**
 * Cria o endereço base (`addresses`) e o vínculo com o cliente.
 *
 * @param {number} clientId
 * @param {object} data
 * @param {any} [trx]
 * @returns {Promise<object>}
 */
exports.create = async (clientId, data, trx = null) => {
  const run = async (runner) => {
    const [address] = await runner('addresses')
      .insert({
        city_id: data.city_id ?? null,
        zip_code: data.zip_code ?? null,
        street: data.street ?? '',
        district: data.district ?? null
      })
      .returning('*');

    const [link] = await runner('client_addresses')
      .insert({
        client_id: clientId,
        address_id: address.id,
        address_type_id: data.address_type_id ?? null,
        number: data.number ?? null,
        complement: data.complement ?? null,
        reference: data.reference ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        is_default: data.is_default ? 1 : 0
      })
      .returning('*');

    return { ...link, ...address };
  };

  if (trx) return run((table) => db(table).transacting(trx));

  return db.transaction((t) => run((table) => db(table).transacting(t)));
};

/**
 * Atualiza o vínculo e o endereço base.
 *
 * @param {number} id id em client_addresses
 * @param {object} data
 * @returns {Promise<object|null>}
 */
exports.update = async (id, data) => {
  const current = await exports.findById(id);

  if (!current) return null;

  return db.transaction(async (trx) => {
    await db('addresses')
      .transacting(trx)
      .update({
        city_id: data.city_id ?? current.city_id,
        zip_code: data.zip_code ?? current.zip_code,
        street: data.street ?? current.street,
        district: data.district ?? current.district
      })
      .where('id', current.address_id);

    const [link] = await db('client_addresses')
      .transacting(trx)
      .update({
        address_type_id: data.address_type_id ?? current.address_type_id,
        number: data.number ?? current.number,
        complement: data.complement ?? current.complement,
        reference: data.reference ?? current.reference,
        latitude: data.latitude ?? current.latitude,
        longitude: data.longitude ?? current.longitude,
        is_default: data.is_default !== undefined ? (data.is_default ? 1 : 0) : current.is_default
      })
      .where('id', id)
      .returning('*');

    return link ?? null;
  });
};

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
exports.remove = async (id) => {
  const current = await exports.findById(id);

  if (!current) return false;

  return db.transaction(async (trx) => {
    await db('client_addresses').transacting(trx).where('id', id).del();
    await db('addresses').transacting(trx).where('id', current.address_id).del();

    return true;
  });
};
