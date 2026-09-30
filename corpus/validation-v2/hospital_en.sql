-- Hospital fictício "Riverside General" (nomes em inglês). Dados inventados.
-- CORPUS DE VALIDAÇÃO v2: congelado; rodado uma única vez. Sem chaves estrangeiras declaradas.

CREATE TABLE patients (
  patient_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  dob DATE NOT NULL,
  ssn CHAR(11),
  gender VARCHAR(20),
  blood_type VARCHAR(3),
  hiv_status VARCHAR(10),
  home_phone VARCHAR(25),
  email VARCHAR(150),
  street_address VARCHAR(200),
  zip CHAR(9),
  insurance_number VARCHAR(30),
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(25),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);

CREATE TABLE physicians (
  physician_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  license_number VARCHAR(20) NOT NULL,
  specialty VARCHAR(80),
  email VARCHAR(150)
);

CREATE TABLE admissions (
  admission_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  admitted_at DATETIME NOT NULL,
  discharged_at DATETIME,
  diagnosis_code VARCHAR(10),
  ward VARCHAR(30),
  attending_physician_id INT
);

CREATE TABLE lab_results (
  result_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  result_value VARCHAR(100),
  taken_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE billing (
  invoice_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid TINYINT(1) DEFAULT 0,
  insurance_claim_no VARCHAR(30),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wards (
  ward_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  floor INT,
  beds INT
);
