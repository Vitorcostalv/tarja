-- Banco digital fictício "Cofre Claro". Dados inventados.
-- CORPUS DE VALIDAÇÃO v2: congelado; rodado uma única vez. Tem tabelas de catálogo e chaves estrangeiras declaradas.

CREATE TABLE bancos_ref (
  codigo_compe CHAR(3) NOT NULL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  ispb CHAR(8)
);

CREATE TABLE clientes_pf (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL,
  rg VARCHAR(15),
  email VARCHAR(150) NOT NULL,
  celular VARCHAR(20),
  data_nascimento DATE NOT NULL,
  nome_mae VARCHAR(150),
  renda_mensal DECIMAL(12,2),
  profissao VARCHAR(80),
  cep CHAR(8),
  logradouro VARCHAR(150),
  numero VARCHAR(10),
  complemento VARCHAR(60),
  bairro VARCHAR(80),
  cidade VARCHAR(80),
  uf CHAR(2),
  pep TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes_pj (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(150) NOT NULL,
  cnpj CHAR(14) NOT NULL,
  nome_fantasia VARCHAR(150),
  email_financeiro VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT NOT NULL,
  banco_codigo CHAR(3) NOT NULL,
  agencia VARCHAR(6) NOT NULL,
  numero VARCHAR(12) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  saldo DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes_pf(id),
  FOREIGN KEY (banco_codigo) REFERENCES bancos_ref(codigo_compe)
);

CREATE TABLE cartoes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conta_id BIGINT NOT NULL,
  numero_token VARCHAR(64) NOT NULL,
  validade CHAR(5) NOT NULL,
  bandeira VARCHAR(20),
  limite DECIMAL(12,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id) REFERENCES contas(id)
);

CREATE TABLE transacoes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  conta_id BIGINT NOT NULL,
  valor DECIMAL(14,2) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  pix_chave_destino VARCHAR(140),
  favorecido_nome VARCHAR(150),
  favorecido_documento VARCHAR(18),
  descricao VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conta_id) REFERENCES contas(id)
);

CREATE TABLE documentos_kyc (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cliente_id BIGINT NOT NULL,
  tipo_documento VARCHAR(20) NOT NULL,
  numero_documento VARCHAR(30),
  frente_url VARCHAR(255),
  verso_url VARCHAR(255),
  selfie_url VARCHAR(255),
  biometria_hash CHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes_pf(id)
);

CREATE TABLE logs_api (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45),
  endpoint VARCHAR(150),
  cliente_id BIGINT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
