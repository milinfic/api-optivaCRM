-- =====================================================================
-- Optiva CRM — schema inicial
-- =====================================================================

-- ---------------------------------------------------------------------
-- Clientes: tabelas de apoio (segmentos e grupos)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_segments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- ---------------------------------------------------------------------
-- Usuários do sistema (vendedores, supervisores, responsáveis)
--
-- A tabela `users` já existe neste banco (herdada do projeto base) com:
--   id serial, name, email, password, refresh_token, created_at,
--   data_base, code, expires_at, used
-- Por isso NÃO é criada aqui — apenas é consumida pelo CRM.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions(user_id);

CREATE TABLE IF NOT EXISTS auth_session_tokens (
    token_hash CHAR(64) PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS auth_session_tokens_session_id_idx ON auth_session_tokens(session_id);

-- ---------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_segment_id BIGINT REFERENCES client_segments(id) ON DELETE SET NULL,
    client_group_id BIGINT REFERENCES client_groups(id) ON DELETE SET NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cpf_cnpj VARCHAR(20),
    rg_ie VARCHAR(30),
    im VARCHAR(30),
    birth_foundation_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients (cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_segment ON clients (client_segment_id);
CREATE INDEX IF NOT EXISTS idx_clients_group ON clients (client_group_id);

-- N:N clientes x tipos de cliente
CREATE TABLE IF NOT EXISTS client_client_types (
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    client_type_id BIGINT NOT NULL REFERENCES client_types(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, client_type_id)
);

-- ---------------------------------------------------------------------
-- Endereços
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ibge_code VARCHAR(10),
    city VARCHAR(150) NOT NULL,
    state VARCHAR(2) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Brasil'
);

CREATE INDEX IF NOT EXISTS idx_cities_state ON cities (state);
CREATE INDEX IF NOT EXISTS idx_cities_city ON cities (city);

CREATE TABLE IF NOT EXISTS addresses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    city_id BIGINT REFERENCES cities(id) ON DELETE SET NULL,
    zip_code VARCHAR(10),
    street VARCHAR(255) NOT NULL,
    district VARCHAR(150)
);

CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses (city_id);

CREATE TABLE IF NOT EXISTS address_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS client_addresses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    address_id BIGINT NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
    address_type_id BIGINT REFERENCES address_types(id) ON DELETE SET NULL,
    number VARCHAR(20),
    complement VARCHAR(255),
    reference VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_client_addresses_client ON client_addresses (client_id);

-- ---------------------------------------------------------------------
-- Contatos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS client_contacts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    department VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts (client_id);

CREATE TABLE IF NOT EXISTS client_contact_channels (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_contact_id BIGINT NOT NULL REFERENCES client_contacts(id) ON DELETE CASCADE,
    contact_type_id BIGINT REFERENCES contact_types(id) ON DELETE SET NULL,
    value VARCHAR(255) NOT NULL,
    normalized_value VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_channels_contact ON client_contact_channels (client_contact_id);

-- ---------------------------------------------------------------------
-- Comercial / Financeiro / Configurações / Marketing
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_commercial (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    supervisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    market_segment VARCHAR(150),
    sales_channel VARCHAR(150),
    credit_limit NUMERIC(15,2) DEFAULT 0,
    max_discount NUMERIC(5,2) DEFAULT 0,
    payment_term_id BIGINT,
    price_table_id BIGINT
);

CREATE TABLE IF NOT EXISTS client_financial (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    preferred_payment_method VARCHAR(100),
    bank_name VARCHAR(100),
    agency VARCHAR(20),
    account_number VARCHAR(30),
    pix_key VARCHAR(255),
    due_day INT,
    financial_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    block_reason TEXT
);

CREATE TABLE IF NOT EXISTS client_settings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    block_reason TEXT,
    allow_partial_invoice BOOLEAN NOT NULL DEFAULT FALSE,
    allow_sale_without_stock BOOLEAN NOT NULL DEFAULT FALSE,
    require_purchase_order BOOLEAN NOT NULL DEFAULT FALSE,
    require_special_approval BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS client_marketing (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    lead_source VARCHAR(150),
    campaign VARCHAR(150),
    email_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    sms_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    lgpd_consent BOOLEAN NOT NULL DEFAULT FALSE,
    lgpd_consent_date TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Documentos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS type_documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    document_type VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS client_documents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type_documents_id BIGINT REFERENCES type_documents(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON client_documents (client_id);

-- ---------------------------------------------------------------------
-- Oportunidades
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunities_type (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities_status (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS event_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS opportunities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    opportunity_type_id BIGINT REFERENCES opportunities_type(id) ON DELETE SET NULL,
    opportunity_status_id BIGINT REFERENCES opportunities_status(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    estimated_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    probability INT NOT NULL DEFAULT 0,
    expected_close_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities (client_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user ON opportunities (user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities (opportunity_status_id);

CREATE TABLE IF NOT EXISTS client_interactions_types (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    description TEXT NOT NULL,
    color VARCHAR(20),
    icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS client_interactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    interaction_type_id BIGINT REFERENCES client_interactions_types(id) ON DELETE SET NULL,
    opportunity_id BIGINT REFERENCES opportunities(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    interaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
    next_contact_date TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_client ON client_interactions (client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_opportunity ON client_interactions (opportunity_id);

CREATE TABLE IF NOT EXISTS opportunity_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type_id BIGINT REFERENCES event_types(id) ON DELETE SET NULL,
    field_name VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_logs_opportunity ON opportunity_logs (opportunity_id);

CREATE TABLE IF NOT EXISTS opportunity_comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opportunity_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    detail VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_comments_opportunity ON opportunity_comments (opportunity_id);

CREATE TABLE IF NOT EXISTS opportunity_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    opportunities_id BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    from_opportunity_status_id BIGINT REFERENCES opportunities_status(id) ON DELETE SET NULL,
    opportunity_status_id BIGINT REFERENCES opportunities_status(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_opportunity ON opportunity_status_history (opportunities_id);
