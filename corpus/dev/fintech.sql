-- Fintech fictícia "Cofrinho Digital". Dados inventados.
-- Estilo: dump do MySQL com crases, nomes em português e alguns em inglês.

CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(150) NOT NULL,
  `cpf` varchar(11) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `data_nascimento` date NOT NULL,
  `renda_mensal` decimal(12,2) DEFAULT NULL,
  `profissao` varchar(80) DEFAULT NULL,
  `pep` tinyint(1) DEFAULT '0' COMMENT 'Pessoa politicamente exposta',
  `menor_de_idade` tinyint(1) NOT NULL DEFAULT '0',
  `responsavel_legal_id` bigint DEFAULT NULL,
  `selfie_url` varchar(255) DEFAULT NULL,
  `biometria_facial_template` blob,
  `senha_hash` varchar(255) NOT NULL,
  `pin_hash` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `documentos_kyc` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `tipo` enum('rg','cnh','passaporte','comprovante_residencia') NOT NULL,
  `numero_documento` varchar(30) DEFAULT NULL,
  `arquivo_frente_url` varchar(255) DEFAULT NULL,
  `arquivo_verso_url` varchar(255) DEFAULT NULL,
  `validado` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `contas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `agencia` varchar(6) NOT NULL,
  `numero_conta` varchar(12) NOT NULL,
  `saldo` decimal(14,2) NOT NULL DEFAULT '0.00',
  `limite_credito` decimal(12,2) DEFAULT NULL,
  `score_credito` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `cartoes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conta_id` bigint NOT NULL,
  `numero_token` varchar(64) NOT NULL,
  `ultimos_digitos` char(4) NOT NULL,
  `validade` char(5) NOT NULL,
  `nome_impresso` varchar(60) NOT NULL,
  `bloqueado` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `transacoes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conta_id` bigint NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `valor` decimal(14,2) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `contraparte_nome` varchar(150) DEFAULT NULL,
  `contraparte_documento` varchar(18) DEFAULT NULL,
  `chave_pix_destino` varchar(140) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `emprestimos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conta_id` bigint NOT NULL,
  `valor_solicitado` decimal(12,2) NOT NULL,
  `taxa_juros_mes` decimal(5,2) NOT NULL,
  `parcelas` int NOT NULL,
  `status` varchar(20) NOT NULL,
  `motivo_recusa` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `dispositivos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `device_id` varchar(100) NOT NULL,
  `modelo` varchar(60) DEFAULT NULL,
  `ultimo_ip` varchar(45) DEFAULT NULL,
  `push_token` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `audit_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `evento` varchar(60) NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `parceiros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `razao_social` varchar(150) NOT NULL,
  `cnpj` char(14) NOT NULL,
  `email_comercial` varchar(150) DEFAULT NULL,
  `taxa_percentual` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) COMMENT='Empresas parceiras (pessoa jurídica).';
