-- Escola fictícia "Colégio Ipê Amarelo". Dados inventados.
-- Estilo: DDL escrito à mão, com comentários de coluna.

CREATE TABLE turmas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serie VARCHAR(20) NOT NULL,
  nome VARCHAR(10) NOT NULL,
  turno ENUM('manha','tarde','noite') NOT NULL,
  ano_letivo SMALLINT NOT NULL
);

CREATE TABLE alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(12) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf CHAR(11),
  certidao_nascimento VARCHAR(40),
  nome_mae VARCHAR(150),
  nome_pai VARCHAR(150),
  nome_responsavel VARCHAR(150) COMMENT 'Responsável legal do aluno',
  telefone_responsavel VARCHAR(20),
  cor_raca VARCHAR(20),
  religiao VARCHAR(40) COMMENT 'Usado para o ensino religioso',
  necessidade_especial VARCHAR(120) COMMENT 'Laudo e adaptações necessárias',
  alergia_alimentar VARCHAR(120),
  endereco VARCHAR(200),
  bairro VARCHAR(80),
  cep CHAR(8),
  foto_url VARCHAR(255),
  turma_id INT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE responsaveis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  parentesco VARCHAR(30),
  cpf CHAR(11),
  rg VARCHAR(15),
  telefone VARCHAR(20),
  email VARCHAR(120),
  profissao VARCHAR(60),
  renda_familiar DECIMAL(10,2),
  responsavel_financeiro BOOLEAN DEFAULT FALSE
);

CREATE TABLE professores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL,
  email VARCHAR(120),
  formacao VARCHAR(80),
  data_admissao DATE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  disciplina VARCHAR(60) NOT NULL,
  bimestre TINYINT NOT NULL,
  nota DECIMAL(4,2),
  lancado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ocorrencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  professor_id INT,
  data_ocorrencia DATE NOT NULL,
  tipo VARCHAR(40),
  descricao TEXT NOT NULL,
  providencias TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bolsas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  percentual DECIMAL(5,2) NOT NULL,
  renda_per_capita DECIMAL(10,2),
  comprovante_url VARCHAR(255),
  vigencia_fim DATE
);

CREATE TABLE usuarios_portal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(60) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  email VARCHAR(120) NOT NULL,
  perfil ENUM('aluno','responsavel','professor','secretaria') NOT NULL,
  ultimo_acesso DATETIME,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE log_portal (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  ip VARCHAR(45),
  acao VARCHAR(60),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
