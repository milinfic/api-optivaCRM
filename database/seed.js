/**
 * Seed inicial do CRM.
 *
 * Idempotente: pode rodar várias vezes sem duplicar.
 *
 * Executar: npm run seed
 */
require('dotenv').config();

const db = require('../database/connection');

/**
 * Insere as linhas que ainda não existem (comparando por `column`).
 *
 * @param {string} table
 * @param {Array<object>} rows
 * @param {string} column
 */
const seed = async (table, rows, column = 'name') => {
  const existing = await db(table).pluck(column);
  const set = new Set(existing.map(value => String(value)));

  const toInsert = rows.filter(row => !set.has(String(row[column])));

  if (toInsert.length) {
    await db(table).insert(toInsert);
  }

  console.log(`${table}: +${toInsert.length} (total ${existing.length + toInsert.length})`);
};

(async () => {
  try {
    await seed('client_segments', [
      { name: 'Varejo' },
      { name: 'Atacado' },
      { name: 'Indústria' },
      { name: 'Distribuidor' },
      { name: 'Órgão Público' }
    ]);

    await seed('client_groups', [
      { name: 'Grupo A' },
      { name: 'Grupo B' },
      { name: 'Grupo C' }
    ]);

    await seed('client_types', [
      { name: 'Cliente' },
      { name: 'Fornecedor' },
      { name: 'Transportadora' },
      { name: 'Prospect' }
    ]);

    await seed('address_types', [
      { type: 'Comercial' },
      { type: 'Residencial' },
      { type: 'Cobrança' },
      { type: 'Entrega' }
    ], 'type');

    await seed('contact_types', [
      { code: 'EMAIL', description: 'E-mail' },
      { code: 'PHONE', description: 'Telefone' },
      { code: 'WHATSAPP', description: 'WhatsApp' },
      { code: 'CELL', description: 'Celular' },
      { code: 'SITE', description: 'Site' }
    ], 'code');

    await seed('type_documents', [
      { document_type: 'Contrato Social' },
      { document_type: 'Cartão CNPJ' },
      { document_type: 'Comprovante de Endereço' },
      { document_type: 'Certidão Negativa' },
      { document_type: 'Proposta Comercial' }
    ], 'document_type');

    await seed('opportunities_type', [
      { type: 'Nova Venda' },
      { type: 'Renovação' },
      { type: 'Upsell' },
      { type: 'Cross-sell' }
    ], 'type');

    await seed('opportunities_status', [
      { status: 'Prospecção' },
      { status: 'Qualificação' },
      { status: 'Proposta' },
      { status: 'Negociação' },
      { status: 'Ganha' },
      { status: 'Perdida' }
    ], 'status');

    await seed('client_interactions_types', [
      { description: 'Ligação', color: '#1c62fc', icon: 'call' },
      { description: 'Reunião', color: '#16a34a', icon: 'groups' },
      { description: 'E-mail', color: '#6b7280', icon: 'email' },
      { description: 'Visita', color: '#f59e0b', icon: 'place' },
      { description: 'WhatsApp', color: '#22c55e', icon: 'chat' }
    ], 'description');

    await seed('event_types', [
      { module: 'opportunity', code: 'CREATED', description: 'Oportunidade criada' },
      { module: 'opportunity', code: 'UPDATED', description: 'Oportunidade atualizada' },
      { module: 'opportunity', code: 'STATUS_CHANGED', description: 'Status alterado' },
      { module: 'opportunity', code: 'DELETED', description: 'Oportunidade excluída' }
    ], 'code');

    await db.destroy();
    console.log('\n✅ Seed concluído');
  } catch (error) {
    console.error('ERRO no seed:', error.message);
    await db.destroy();
    process.exit(1);
  }
})();
