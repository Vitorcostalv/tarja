/**
 * Script de exemplo do modo "Padrões de DDL (v2)". Totalmente fictício, com erros de propósito
 * para mostrar o que o verificador acha: tabela legada, rotina com definer pessoal, DELETE sem archive.
 */
export const SCRIPT_EXEMPLO_PADROES = `-- Exemplo fictício para o modo "Padrões de DDL (v2)".

CREATE TABLE app_loja.tb_pedido (
  cod_pedido int(11) NOT NULL AUTO_INCREMENT,
  cod_projeto int(11) NOT NULL DEFAULT '0',
  cod_cliente int(11) NOT NULL,
  nm_pedido varchar(80) NOT NULL DEFAULT '',
  valor_total double NOT NULL DEFAULT '0',
  flag_pago tinyint(1) NOT NULL DEFAULT '0',
  dt_criacao datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cod_pedido),
  KEY idx_nome (nm_pedido),
  UNIQUE KEY i_numero (nm_pedido)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=latin1;

CREATE TABLE app_loja_hist.tb_pedido_hist (
  cod_pedido_hist int(11) NOT NULL AUTO_INCREMENT,
  cod_user_create_hist int(11) NOT NULL,
  cod_processo int(11) NOT NULL,
  dt_criacao_hist datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cod_pedido int(11) NOT NULL,
  cod_projeto int(11) NOT NULL,
  nm_pedido varchar(80) NOT NULL,
  ts_alteracao timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (cod_pedido_hist)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DELIMITER $$
CREATE DEFINER=\`ana.souza\`@\`10.20.30.40\` PROCEDURE app_loja.sp_alterar_pedido(IN p_cod INT, IN p_nome VARCHAR(80))
BEGIN
  UPDATE app_loja.tb_pedido SET nm_pedido = p_nome, cod_projeto = 2 WHERE cod_pedido = p_cod;
END$$

CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE app_loja.sp_apagar_pedido(IN p_cod INT)
BEGIN
  DELETE FROM app_loja.tb_pedido WHERE cod_pedido = p_cod;
  SELECT 1;
END$$
DELIMITER ;
`;
