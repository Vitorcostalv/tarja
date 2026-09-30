-- Sistema legado fictício de uma clínica ("Policlínica Horizonte"). Dados inventados.
-- CORPUS DE VALIDAÇÃO: congelado. Nomes abreviados no padrão antigo (nm_, dt_, nr_, ds_, cd_, st_, in_).

CREATE TABLE tb_paciente (
  cd_paciente INT NOT NULL AUTO_INCREMENT,
  nm_paciente VARCHAR(120) NOT NULL,
  dt_nasc DATE,
  nr_cpf CHAR(11),
  nr_rg VARCHAR(14),
  ds_email VARCHAR(100),
  nr_telefone VARCHAR(15),
  nr_celular VARCHAR(15),
  ds_endereco VARCHAR(150),
  nr_cep CHAR(8),
  nm_cidade VARCHAR(60),
  sg_uf CHAR(2),
  ds_sexo CHAR(1),
  ds_raca VARCHAR(20),
  st_hiv CHAR(1) COMMENT 'S/N/I - resultado informado pelo paciente',
  tp_sanguineo CHAR(3),
  ds_alergia VARCHAR(200),
  nm_responsavel VARCHAR(120),
  ds_observacao TEXT,
  in_ativo CHAR(1) DEFAULT 'S',
  dt_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cd_paciente)
);

CREATE TABLE tb_medico (
  cd_medico INT NOT NULL AUTO_INCREMENT,
  nm_medico VARCHAR(120) NOT NULL,
  nr_crm VARCHAR(12) NOT NULL,
  ds_especialidade VARCHAR(60),
  ds_email VARCHAR(100),
  in_ativo CHAR(1) DEFAULT 'S',
  PRIMARY KEY (cd_medico)
);

CREATE TABLE tb_consulta (
  cd_consulta INT NOT NULL AUTO_INCREMENT,
  cd_paciente INT NOT NULL,
  cd_medico INT NOT NULL,
  dt_consulta DATETIME NOT NULL,
  ds_queixa TEXT,
  ds_diagnostico TEXT,
  cd_cid VARCHAR(8),
  vl_consulta DECIMAL(8,2),
  dt_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cd_consulta)
);

CREATE TABLE tb_convenio (
  cd_convenio INT NOT NULL AUTO_INCREMENT,
  nm_convenio VARCHAR(80) NOT NULL,
  nr_cnpj CHAR(14),
  ds_contato VARCHAR(100),
  PRIMARY KEY (cd_convenio)
);

CREATE TABLE tb_vacina (
  cd_vacina INT NOT NULL AUTO_INCREMENT,
  cd_paciente INT NOT NULL,
  nm_vacina VARCHAR(60) NOT NULL,
  dt_aplicacao DATE,
  nr_lote VARCHAR(20),
  dt_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cd_vacina)
);

CREATE TABLE tb_log_acesso (
  cd_log BIGINT NOT NULL AUTO_INCREMENT,
  cd_usuario INT,
  nr_ip VARCHAR(45),
  ds_acao VARCHAR(80),
  dt_log DATETIME NOT NULL,
  PRIMARY KEY (cd_log)
);
