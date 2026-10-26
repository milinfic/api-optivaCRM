const Addresses = require('../../database/models/client-address.model');
const Contacts = require('../../database/models/client-contact.model');
const Documents = require('../../database/models/document.model');
const { pick } = require('../utils/sanitize.utils');

const ADDRESS_FIELDS = {
  city_id: 'number',
  zip_code: 'string',
  street: 'string',
  district: 'string',
  address_type_id: 'number',
  number: 'string',
  complement: 'string',
  reference: 'string',
  latitude: 'number',
  longitude: 'number',
  is_default: 'boolean'
};

const CONTACT_FIELDS = {
  name: 'string',
  position: 'string',
  department: 'string',
  active: 'boolean',
  notes: 'string'
};

const DOCUMENT_FIELDS = {
  type_documents_id: 'number',
  file_name: 'string',
  file_path: 'string'
};

/* ------------------------------- Endereços ------------------------------ */

exports.listAddresses = async (clientId) => Addresses.listByClient(clientId);

exports.createAddress = async (clientId, body) => {
  const data = pick(body, ADDRESS_FIELDS);

  if (!data.street) return { success: false, message: 'Logradouro é obrigatório.' };

  return { success: true, data: await Addresses.create(clientId, data) };
};

exports.updateAddress = async (id, body) => {
  const data = pick(body, ADDRESS_FIELDS);

  const updated = await Addresses.update(id, data);

  return updated
    ? { success: true, data: updated }
    : { success: false, message: 'Endereço não encontrado.' };
};

exports.removeAddress = async (id) => {
  const removed = await Addresses.remove(id);

  return removed ? { success: true } : { success: false, message: 'Endereço não encontrado.' };
};

/* -------------------------------- Contatos ------------------------------ */

exports.listContacts = async (clientId) => Contacts.listByClient(clientId);

exports.createContact = async (clientId, body) => {
  const data = pick(body, CONTACT_FIELDS);

  if (!data.name) return { success: false, message: 'Nome do contato é obrigatório.' };

  return { success: true, data: await Contacts.create(clientId, { ...data, channels: body.channels }) };
};

exports.updateContact = async (id, body) => {
  const data = pick(body, CONTACT_FIELDS);

  const updated = await Contacts.update(id, { ...data, channels: body.channels });

  return updated
    ? { success: true, data: updated }
    : { success: false, message: 'Contato não encontrado.' };
};

exports.removeContact = async (id) => {
  const removed = await Contacts.remove(id);

  return removed ? { success: true } : { success: false, message: 'Contato não encontrado.' };
};

/* ------------------------------- Documentos ----------------------------- */

exports.listDocuments = async (clientId) => Documents.listByClient(clientId);

exports.createDocument = async (clientId, body, userId) => {
  const data = pick(body, DOCUMENT_FIELDS);

  if (!data.file_name || !data.file_path) {
    return { success: false, message: 'Arquivo e caminho são obrigatórios.' };
  }

  return {
    success: true,
    data: await Documents.create({
      ...data,
      client_id: clientId,
      created_by: userId ?? null
    })
  };
};

exports.removeDocument = async (id) => {
  const removed = await Documents.remove(id);

  return removed ? { success: true } : { success: false, message: 'Documento não encontrado.' };
};
