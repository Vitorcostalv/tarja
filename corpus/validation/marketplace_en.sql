-- Marketplace fictício "Bazaar North" (nomes em inglês). Dados inventados.
-- CORPUS DE VALIDAÇÃO: congelado. Não ajustar regras olhando para este arquivo.

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone_number VARCHAR(25),
  date_of_birth DATE,
  gender VARCHAR(20),
  password_hash CHAR(60) NOT NULL,
  avatar_url VARCHAR(300),
  locale VARCHAR(8) DEFAULT 'pt-BR',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB;

CREATE TABLE addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  street VARCHAR(160) NOT NULL,
  house_no VARCHAR(12),
  apartment VARCHAR(20),
  city VARCHAR(80) NOT NULL,
  state VARCHAR(40),
  zip_code VARCHAR(10) NOT NULL,
  country CHAR(2) NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  is_default TINYINT(1) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE sellers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(160) NOT NULL,
  tax_id VARCHAR(20) NOT NULL COMMENT 'CNPJ ou CPF, conforme o tipo de vendedor',
  contact_name VARCHAR(120),
  contact_email VARCHAR(190),
  contact_phone VARCHAR(25),
  payout_iban VARCHAR(34),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  seller_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  description MEDIUMTEXT,
  price DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  stock INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  buyer_id BIGINT UNSIGNED NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'BRL',
  ip_address VARCHAR(45),
  shipping_zip VARCHAR(10),
  customer_notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  card_number VARCHAR(19),
  card_holder VARCHAR(120),
  card_expiry CHAR(5),
  cvv CHAR(4),
  billing_email VARCHAR(190),
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  token_hash CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE access_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED,
  ip_address VARCHAR(45) NOT NULL,
  path VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE countries (
  code CHAR(2) NOT NULL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  phone_prefix VARCHAR(6)
) ENGINE=InnoDB;
