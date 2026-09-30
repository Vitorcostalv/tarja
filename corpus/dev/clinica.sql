-- Clínica fictícia "Vida Serena". Dados inventados.
-- Estilo: DDL escrito à mão, minúsculas, sem crases.

CREATE TABLE pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_completo VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL,
  rg VARCHAR(15),
  data_nascimento DATE NOT NULL,
  sexo ENUM('F','M','O'),
  cor_raca ENUM('branca','preta','parda','amarela','indigena','nao_informada'),
  estado_civil VARCHAR(20),
  email VARCHAR(120),
  celular VARCHAR(20),
  telefone_emergencia VARCHAR(20) COMMENT 'Contato de um familiar',
  nome_responsavel VARCHAR(150) COMMENT 'Preenchido para pacientes menores de idade',
  plano_saude VARCHAR(60),
  numero_carteirinha VARCHAR(30),
  tipo_sanguineo VARCHAR(3),
  alergias TEXT,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE enderecos_pacientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  rua VARCHAR(150),
  numero VARCHAR(10),
  bairro VARCHAR(80),
  cidade VARCHAR(80),
  estado CHAR(2),
  cep CHAR(8),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

CREATE TABLE medicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  crm VARCHAR(15) NOT NULL,
  especialidade VARCHAR(60),
  email_profissional VARCHAR(120),
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE consultas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  data_hora DATETIME NOT NULL,
  tipo VARCHAR(30),
  queixa_principal TEXT,
  diagnostico TEXT,
  cid10 VARCHAR(8),
  conduta TEXT,
  retorno_em DATE,
  valor_cobrado DECIMAL(8,2),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescricoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consulta_id INT NOT NULL,
  medicamento VARCHAR(120) NOT NULL,
  dosagem VARCHAR(40),
  posologia VARCHAR(200),
  duracao_dias INT
);

CREATE TABLE exames (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  tipo_exame VARCHAR(80) NOT NULL,
  resultado TEXT,
  laudo_pdf_url VARCHAR(255),
  coletado_em DATETIME,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prontuarios_genetica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  resultado_dna LONGTEXT,
  marcadores_geneticos JSON,
  laboratorio VARCHAR(80),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  inicio DATETIME NOT NULL,
  fim DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL,
  canal VARCHAR(20),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auditoria_prontuario (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_email VARCHAR(120) NOT NULL,
  paciente_id INT NOT NULL,
  acao VARCHAR(30) NOT NULL,
  ip_origem VARCHAR(45),
  ocorreu_em DATETIME NOT NULL
);

CREATE TABLE unidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  endereco VARCHAR(200),
  cnpj CHAR(14),
  telefone VARCHAR(20)
) COMMENT='Unidades da clínica (pessoa jurídica).';
