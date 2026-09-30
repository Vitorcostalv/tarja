-- Financeira fictícia "Crédito Bem-Te-Vi" (sistema antigo, nomes curtos e opacos). Dados inventados.
-- CORPUS DE VALIDAÇÃO: congelado. Aqui o COMMENT é a única pista em várias colunas.

CREATE TABLE cad_cliente (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  doc VARCHAR(18) NOT NULL COMMENT 'CPF ou CNPJ do cliente',
  campo1 VARCHAR(20) COMMENT 'Telefone principal',
  campo2 VARCHAR(120) COMMENT 'E-mail principal',
  campo3 DATE COMMENT 'Data de nascimento',
  end_cob VARCHAR(200) COMMENT 'Endereço de cobrança',
  end_ent VARCHAR(200),
  cep CHAR(8),
  renda DECIMAL(12,2),
  limite DECIMAL(12,2),
  dt_cad DATETIME DEFAULT CURRENT_TIMESTAMP,
  flg_ativo CHAR(1) DEFAULT 'S',
  PRIMARY KEY (id)
);

CREATE TABLE cad_conta (
  id INT NOT NULL AUTO_INCREMENT,
  id_cliente INT NOT NULL,
  bco CHAR(3),
  ag VARCHAR(6),
  cc VARCHAR(14),
  tp_conta CHAR(1),
  saldo_atual DECIMAL(14,2) DEFAULT 0,
  dt_abertura DATE,
  PRIMARY KEY (id)
);

CREATE TABLE mov_financeira (
  id BIGINT NOT NULL AUTO_INCREMENT,
  id_conta INT NOT NULL,
  vlr DECIMAL(14,2) NOT NULL,
  dt_mov DATETIME NOT NULL,
  hist VARCHAR(255),
  cod_barras VARCHAR(60),
  favorecido VARCHAR(120),
  cpf_cnpj_fav VARCHAR(18),
  PRIMARY KEY (id)
);

CREATE TABLE apolices (
  id INT NOT NULL AUTO_INCREMENT,
  id_cliente INT NOT NULL,
  beneficiario_nome VARCHAR(120),
  beneficiario_cpf CHAR(11),
  grau_parentesco VARCHAR(30),
  cid_causa VARCHAR(8) COMMENT 'CID da causa de sinistro, quando houver',
  valor_cobertura DECIMAL(14,2),
  dt_emissao DATE,
  PRIMARY KEY (id)
);

CREATE TABLE tab_bancos (
  cod CHAR(3) NOT NULL,
  nome VARCHAR(80) NOT NULL,
  ispb CHAR(8),
  PRIMARY KEY (cod)
);

CREATE TABLE tab_cidades (
  ibge CHAR(7) NOT NULL,
  cidade VARCHAR(80) NOT NULL,
  uf CHAR(2) NOT NULL,
  PRIMARY KEY (ibge)
);

CREATE TABLE tb_log_ws (
  id BIGINT NOT NULL AUTO_INCREMENT,
  endpoint VARCHAR(120),
  ip_origem VARCHAR(45),
  payload_req TEXT,
  dt_log DATETIME NOT NULL,
  PRIMARY KEY (id)
);
