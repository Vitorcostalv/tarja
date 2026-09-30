-- Escola fictícia "Instituto Aurora" (português e inglês misturados). Dados inventados.
-- CORPUS DE VALIDAÇÃO: congelado. Inclui armadilhas: tabelas de referência e dados de adultos.

CREATE TABLE students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  birthdate DATE NOT NULL,
  cpf CHAR(11),
  guardian_name VARCHAR(150),
  guardian_phone VARCHAR(20),
  school_year VARCHAR(15) COMMENT 'Ano/série em curso',
  health_notes TEXT COMMENT 'Condições de saúde informadas pela família',
  ethnicity VARCHAR(30),
  address VARCHAR(200),
  zip CHAR(8),
  photo VARCHAR(255),
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cursos (
  codigo VARCHAR(10) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  carga_horaria INT
);

CREATE TABLE frequencia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  data DATE NOT NULL,
  presente BOOLEAN NOT NULL,
  justificativa TEXT
);

CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  salary DECIMAL(10,2),
  degree VARCHAR(60),
  hired_on DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mensalidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  competencia CHAR(7) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  pago_em DATETIME,
  forma_pagamento VARCHAR(20),
  boleto_linha_digitavel VARCHAR(60),
  cpf_pagador CHAR(11),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE feriados (
  data DATE PRIMARY KEY,
  nome VARCHAR(80) NOT NULL
);
