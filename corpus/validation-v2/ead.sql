-- Plataforma de ensino a distância fictícia "Trilha Aberta". Dados inventados.
-- CORPUS DE VALIDAÇÃO v2: congelado; rodado uma única vez. Alunos adultos e menores na mesma tabela.

CREATE TABLE alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cpf CHAR(11),
  email VARCHAR(120) NOT NULL,
  nascimento DATE,
  telefone VARCHAR(20),
  cidade VARCHAR(80),
  uf CHAR(2),
  is_menor TINYINT(1) DEFAULT 0,
  responsavel_nome VARCHAR(150),
  responsavel_cpf CHAR(11),
  responsavel_email VARCHAR(120),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cursos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  carga_horaria INT,
  preco DECIMAL(8,2)
);

CREATE TABLE matriculas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  curso_id INT NOT NULL,
  inicio DATE NOT NULL,
  progresso DECIMAL(5,2) DEFAULT 0,
  nota_final DECIMAL(4,2),
  FOREIGN KEY (aluno_id) REFERENCES alunos(id),
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

CREATE TABLE certificados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricula_id INT NOT NULL,
  codigo_validacao CHAR(12) NOT NULL,
  emitido_em DATETIME NOT NULL,
  pdf_url VARCHAR(255),
  FOREIGN KEY (matricula_id) REFERENCES matriculas(id)
);

CREATE TABLE tickets_suporte (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  assunto VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

CREATE TABLE log_visualizacao (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  aula_id INT NOT NULL,
  ip VARCHAR(45),
  dispositivo VARCHAR(80),
  assistido_em DATETIME NOT NULL,
  FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);
