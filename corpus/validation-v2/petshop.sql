-- Petshop fictício "Bicho Feliz". Dados inventados.
-- CORPUS DE VALIDAÇÃO v2: escrito depois de a v1 ter sido "queimada". Congelado; rodado uma única vez.
-- Armadilhas de propósito: saúde e raça de ANIMAL não são dado sensível de pessoa; "tutor" é o dono do pet.

CREATE TABLE `tutores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(120) NOT NULL,
  `cpf` char(11) DEFAULT NULL,
  `email` varchar(120) NOT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `cep` char(8) DEFAULT NULL,
  `endereco_entrega` varchar(200) DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `especies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(40) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `pets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tutor_id` int NOT NULL,
  `especie_id` int NOT NULL,
  `nome` varchar(60) NOT NULL,
  `raca` varchar(60) DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `peso_kg` decimal(5,2) DEFAULT NULL,
  `alergias` text,
  `vacinas_em_dia` tinyint(1) DEFAULT '0',
  `microchip` varchar(20) DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pet_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `tutores` (`id`),
  CONSTRAINT `fk_pet_especie` FOREIGN KEY (`especie_id`) REFERENCES `especies` (`id`)
) ENGINE=InnoDB;

CREATE TABLE `veterinarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(120) NOT NULL,
  `crmv` varchar(15) NOT NULL,
  `email` varchar(120) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `atendimentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pet_id` int NOT NULL,
  `veterinario_id` int NOT NULL,
  `data_hora` datetime NOT NULL,
  `diagnostico` text,
  `prescricao` text,
  `valor` decimal(8,2) DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_at_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`),
  CONSTRAINT `fk_at_vet` FOREIGN KEY (`veterinario_id`) REFERENCES `veterinarios` (`id`)
) ENGINE=InnoDB;

CREATE TABLE `agendamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tutor_id` int NOT NULL,
  `pet_id` int NOT NULL,
  `inicio` datetime NOT NULL,
  `observacao` text,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ag_tutor` FOREIGN KEY (`tutor_id`) REFERENCES `tutores` (`id`),
  CONSTRAINT `fk_ag_pet` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`)
) ENGINE=InnoDB;

CREATE TABLE `pagamentos_pix` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agendamento_id` int NOT NULL,
  `chave_pix` varchar(140) DEFAULT NULL,
  `txid` varchar(35) NOT NULL,
  `valor` decimal(8,2) NOT NULL,
  `pago_em` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pix_ag` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`)
) ENGINE=InnoDB;
