-- RH SaaS fictício "Folha Fácil". Dados inventados.
-- CORPUS DE VALIDAÇÃO v2: congelado; rodado uma única vez. Mistura português e inglês, com chaves estrangeiras declaradas.

CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razao_social VARCHAR(150) NOT NULL,
  cnpj CHAR(14) NOT NULL,
  plano VARCHAR(20) NOT NULL
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  cpf CHAR(11) NOT NULL,
  pis CHAR(11),
  email_corporativo VARCHAR(120),
  email_pessoal VARCHAR(120),
  telefone VARCHAR(20),
  data_nascimento DATE,
  genero VARCHAR(20),
  raca_cor_ibge VARCHAR(20),
  pcd TINYINT(1) DEFAULT 0,
  tipo_deficiencia VARCHAR(80),
  religiao VARCHAR(30),
  salario_base DECIMAL(10,2),
  banco CHAR(3),
  agencia VARCHAR(6),
  conta VARCHAR(14),
  pix_key VARCHAR(140),
  admitido_em DATE,
  demitido_em DATE,
  foto_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE vacancies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT,
  faixa_min DECIMAL(10,2),
  faixa_max DECIMAL(10,2),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vacancy_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(120) NOT NULL,
  telefone VARCHAR(20),
  linkedin VARCHAR(200),
  curriculo_url VARCHAR(255),
  pretensao DECIMAL(10,2),
  genero VARCHAR(20),
  raca_cor VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(id)
);

CREATE TABLE payroll_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  competencia CHAR(7) NOT NULL,
  bruto DECIMAL(10,2) NOT NULL,
  liquido DECIMAL(10,2) NOT NULL,
  inss DECIMAL(10,2),
  irrf DECIMAL(10,2),
  pensao_alimenticia DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE audit_trail (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_email VARCHAR(120) NOT NULL,
  action VARCHAR(40) NOT NULL,
  target_table VARCHAR(60),
  ip VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
