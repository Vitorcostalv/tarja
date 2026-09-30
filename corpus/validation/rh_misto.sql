-- RH fictício de uma rede de mercados ("Mercado Três Pinheiros"). Dados inventados.
-- CORPUS DE VALIDAÇÃO: congelado. Mistura PascalCase, snake_case, português e inglês.

CREATE TABLE `Empregado` (
  `EmpId` int NOT NULL AUTO_INCREMENT,
  `NomeFunc` varchar(150) NOT NULL,
  `DtNasc` date DEFAULT NULL,
  `CPF` varchar(14) NOT NULL,
  `Doc_Identidade` varchar(20) DEFAULT NULL,
  `EMail` varchar(120) DEFAULT NULL,
  `Tel` varchar(20) DEFAULT NULL,
  `Celular` varchar(20) DEFAULT NULL,
  `Salario` decimal(10,2) DEFAULT NULL,
  `Cargo` varchar(60) DEFAULT NULL,
  `DtAdmissao` date DEFAULT NULL,
  `Sindicalizado` char(1) DEFAULT 'N',
  `Religiao` varchar(30) DEFAULT NULL,
  `TipoSanguineo` varchar(3) DEFAULT NULL,
  `Deficiencia` varchar(100) DEFAULT NULL,
  `FotoCracha` varchar(200) DEFAULT NULL,
  `Obs` text,
  `CriadoEm` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`EmpId`)
);

CREATE TABLE emp_dependents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  nascimento DATE,
  cpf CHAR(11),
  tipo_parentesco VARCHAR(30)
);

CREATE TABLE vagas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT,
  salario_oferecido DECIMAL(10,2),
  area VARCHAR(50),
  aberta BOOLEAN DEFAULT TRUE,
  criada_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidatura (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vaga_id INT NOT NULL,
  nome_candidato VARCHAR(150) NOT NULL,
  email_candidato VARCHAR(120) NOT NULL,
  fone VARCHAR(20),
  curriculo LONGBLOB,
  pretensao DECIMAL(10,2),
  genero VARCHAR(20),
  raca_cor VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cfg_sistema (
  chave VARCHAR(60) PRIMARY KEY,
  valor VARCHAR(255),
  descricao VARCHAR(255)
);

CREATE TABLE tb_ponto_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  batida_em DATETIME NOT NULL,
  origem VARCHAR(20),
  ip VARCHAR(45),
  geo_lat DECIMAL(9,6),
  geo_lng DECIMAL(9,6)
);

CREATE TABLE beneficios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id INT NOT NULL,
  tipo VARCHAR(40) NOT NULL,
  valor DECIMAL(10,2),
  inicio DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
