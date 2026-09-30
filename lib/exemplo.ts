/**
 * Schema de exemplo do botão "Usar schema de exemplo". É o mesmo do print do README.
 * Totalmente fictício: "Clínica Exemplo" não é empresa real, e nada aqui parece dado de alguém.
 */
export const SCHEMA_EXEMPLO = `-- Clínica Exemplo (fictícia). Schema inventado para demonstração.

CREATE TABLE pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_completo VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL,
  data_nascimento DATE NOT NULL,
  email VARCHAR(120),
  celular VARCHAR(20),
  cep CHAR(8),
  cor_raca VARCHAR(20),
  tipo_sanguineo VARCHAR(3),
  nome_responsavel VARCHAR(150) COMMENT 'Preenchido para pacientes menores de idade',
  observacoes TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE consultas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  data_hora DATETIME NOT NULL,
  queixa_principal TEXT,
  diagnostico TEXT,
  cid10 VARCHAR(8),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

CREATE TABLE medicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  crm VARCHAR(15) NOT NULL,
  especialidade VARCHAR(60),
  email VARCHAR(120)
);

CREATE TABLE pagamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consulta_id INT NOT NULL,
  cartao_token VARCHAR(64),
  chave_pix VARCHAR(140),
  valor DECIMAL(10,2) NOT NULL,
  pago_em DATETIME,
  FOREIGN KEY (consulta_id) REFERENCES consultas(id)
);

CREATE TABLE logs_acesso (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_email VARCHAR(120) NOT NULL,
  ip VARCHAR(45),
  acao VARCHAR(40) NOT NULL,
  criado_em DATETIME NOT NULL
);

CREATE TABLE unidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  endereco VARCHAR(200),
  cnpj CHAR(14)
);
`;
