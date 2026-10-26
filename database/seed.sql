-- =====================================================================
-- Optiva CRM — Dados iniciais
--
-- Execute DEPOIS do create-tables.sql.
-- Idempotente: usa ON CONFLICT / WHERE NOT EXISTS, pode rodar de novo.
-- =====================================================================

-- Segmentos de cliente
INSERT INTO client_segments (name)
SELECT x.name FROM (VALUES
    ('Varejo'), ('Atacado'), ('Indústria'), ('Distribuidor'), ('Órgão Público')
) AS x(name)
WHERE NOT EXISTS (SELECT 1 FROM client_segments s WHERE s.name = x.name);

-- Grupos de cliente
INSERT INTO client_groups (name)
SELECT x.name FROM (VALUES
    ('Grupo A'), ('Grupo B'), ('Grupo C')
) AS x(name)
WHERE NOT EXISTS (SELECT 1 FROM client_groups s WHERE s.name = x.name);

-- Tipos de cliente
INSERT INTO client_types (name)
SELECT x.name FROM (VALUES
    ('Cliente'), ('Fornecedor'), ('Transportadora'), ('Prospect')
) AS x(name)
WHERE NOT EXISTS (SELECT 1 FROM client_types s WHERE s.name = x.name);

-- Tipos de endereço
INSERT INTO address_types (type)
SELECT x.type FROM (VALUES
    ('Comercial'), ('Residencial'), ('Cobrança'), ('Entrega')
) AS x(type)
WHERE NOT EXISTS (SELECT 1 FROM address_types s WHERE s.type = x.type);

-- Tipos de contato
INSERT INTO contact_types (code, description) VALUES
    ('EMAIL',    'E-mail'),
    ('PHONE',    'Telefone'),
    ('WHATSAPP', 'WhatsApp'),
    ('CELL',     'Celular'),
    ('SITE',     'Site')
ON CONFLICT (code) DO NOTHING;

-- Tipos de documento
INSERT INTO type_documents (document_type)
SELECT x.document_type FROM (VALUES
    ('Contrato Social'),
    ('Cartão CNPJ'),
    ('Comprovante de Endereço'),
    ('Certidão Negativa'),
    ('Proposta Comercial')
) AS x(document_type)
WHERE NOT EXISTS (SELECT 1 FROM type_documents s WHERE s.document_type = x.document_type);

-- Tipos de oportunidade
INSERT INTO opportunities_type (type)
SELECT x.type FROM (VALUES
    ('Nova Venda'), ('Renovação'), ('Upsell'), ('Cross-sell')
) AS x(type)
WHERE NOT EXISTS (SELECT 1 FROM opportunities_type s WHERE s.type = x.type);

-- Status de oportunidade
INSERT INTO opportunities_status (status)
SELECT x.status FROM (VALUES
    ('Prospecção'), ('Qualificação'), ('Proposta'),
    ('Negociação'), ('Ganha'), ('Perdida')
) AS x(status)
WHERE NOT EXISTS (SELECT 1 FROM opportunities_status s WHERE s.status = x.status);

-- Tipos de interação
INSERT INTO client_interactions_types (description, color, icon)
SELECT x.description, x.color, x.icon FROM (VALUES
    ('Ligação', '#1c62fc', 'call'),
    ('Reunião', '#16a34a', 'groups'),
    ('E-mail',  '#6b7280', 'email'),
    ('Visita',  '#f59e0b', 'place'),
    ('WhatsApp','#22c55e', 'chat')
) AS x(description, color, icon)
WHERE NOT EXISTS (SELECT 1 FROM client_interactions_types s WHERE s.description = x.description);

-- Tipos de evento (log de oportunidade)
INSERT INTO event_types (module, code, description)
SELECT x.module, x.code, x.description FROM (VALUES
    ('opportunity', 'CREATED',        'Oportunidade criada'),
    ('opportunity', 'UPDATED',        'Oportunidade atualizada'),
    ('opportunity', 'STATUS_CHANGED', 'Status alterado'),
    ('opportunity', 'DELETED',        'Oportunidade excluída')
) AS x(module, code, description)
WHERE NOT EXISTS (SELECT 1 FROM event_types s WHERE s.code = x.code);


-- =====================================================================
-- USUÁRIO ADMINISTRADOR (opcional)
--
-- Senha do hash abaixo: 1234
-- Troque a senha em produção.
-- =====================================================================
INSERT INTO users (name, email, password, created_at, data_base)
SELECT 'Novo Administrador', 'admin@admin.com',
       '$2b$10$w83zHEBHOwIIVDeaK8pPVeT6QYnBKiZNhfjBjSt1MNPXUwmatpyxq',
       '2026-10-19 00:00:00', 1
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = 'admin@admin.com');
