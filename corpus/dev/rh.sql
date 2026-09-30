-- Sistema de RH fictício da "Metalúrgica Quatro Rios". Dados inventados.
-- Estilo: misto, nomes em português, alguns em inglês.

CREATE TABLE `departamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(80) NOT NULL,
  `centro_custo` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `cargos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(80) NOT NULL,
  `faixa_salarial_min` decimal(10,2) DEFAULT NULL,
  `faixa_salarial_max` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `funcionarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `matricula` varchar(12) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `nome_mae` varchar(150) DEFAULT NULL,
  `cpf` char(11) NOT NULL,
  `rg` varchar(15) DEFAULT NULL,
  `pis` varchar(14) DEFAULT NULL,
  `ctps_numero` varchar(15) DEFAULT NULL,
  `titulo_eleitor` varchar(14) DEFAULT NULL,
  `data_nascimento` date NOT NULL,
  `genero` varchar(15) DEFAULT NULL,
  `estado_civil` varchar(20) DEFAULT NULL,
  `nacionalidade` varchar(40) DEFAULT NULL,
  `email_pessoal` varchar(120) DEFAULT NULL,
  `email_corporativo` varchar(120) DEFAULT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `departamento_id` int DEFAULT NULL,
  `cargo_id` int DEFAULT NULL,
  `data_admissao` date NOT NULL,
  `data_demissao` date DEFAULT NULL,
  `salario` decimal(10,2) NOT NULL,
  `banco` varchar(40) DEFAULT NULL,
  `agencia` varchar(10) DEFAULT NULL,
  `conta_bancaria` varchar(20) DEFAULT NULL,
  `pcd` tinyint(1) DEFAULT '0' COMMENT 'Pessoa com deficiência',
  `tipo_deficiencia` varchar(80) DEFAULT NULL,
  `filiado_sindicato` tinyint(1) DEFAULT '0',
  `foto_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `dependentes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cpf` char(11) DEFAULT NULL,
  `data_nascimento` date NOT NULL,
  `parentesco` varchar(30) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `folha_pagamento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `competencia` char(7) NOT NULL,
  `salario_bruto` decimal(10,2) NOT NULL,
  `descontos` decimal(10,2) NOT NULL,
  `salario_liquido` decimal(10,2) NOT NULL,
  `pensao_alimenticia` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `ponto_registros` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `registrado_em` datetime NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `digital_hash` varchar(128) DEFAULT NULL COMMENT 'Hash do template da impressão digital do relógio de ponto',
  PRIMARY KEY (`id`)
);

CREATE TABLE `atestados_medicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `cid` varchar(8) DEFAULT NULL,
  `dias_afastamento` int NOT NULL,
  `inicio` date NOT NULL,
  `arquivo_url` varchar(255) DEFAULT NULL,
  `observacao` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `candidatos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `vaga_id` int NOT NULL,
  `nome` varchar(150) NOT NULL,
  `email` varchar(120) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `curriculo_texto` longtext,
  `pretensao_salarial` decimal(10,2) DEFAULT NULL,
  `linkedin_url` varchar(200) DEFAULT NULL,
  `religiao` varchar(40) DEFAULT NULL,
  `orientacao_politica` varchar(40) DEFAULT NULL,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE `historico_login` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `funcionario_id` int NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `sucesso` tinyint(1) NOT NULL,
  `tentativa_em` datetime NOT NULL,
  PRIMARY KEY (`id`)
);
