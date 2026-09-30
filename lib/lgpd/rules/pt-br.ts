import type { ContextoTabela, Regra } from "../types";

/**
 * Dicionário de regras (versão pt-BR). Tudo aqui é DADO: o motor em classify.ts só pontua.
 *
 * Regras, não IA: cada decisão pode ser auditada olhando para este arquivo.
 *
 * Pontuação (resumo; o código está em classify.ts):
 *   peso da regra
 *   + 2 se o nome da coluna é exatamente o padrão, +1 se só contém
 *   + 1 se o padrão tem mais de uma palavra
 *   + 1 se o tipo SQL combina, −2 se não combina
 *   + 2 se o COMMENT da coluna contém o padrão
 *   + bônus/penalidade do contexto da tabela
 * Mínimo para marcar: 5. Confiança: baixa ≥ 5, média ≥ 7, alta ≥ 9.
 */

export const VERSAO_REGRAS = "pt-br/1";

// ---------- texto ----------

/** Abreviações comuns em schemas brasileiros e em inglês. */
export const APELIDOS: Readonly<Record<string, string>> = {
  nm: "nome",
  nr: "numero",
  num: "numero",
  nro: "numero",
  dt: "data",
  cd: "codigo",
  cod: "codigo",
  tp: "tipo",
  st: "status",
  vl: "valor",
  vlr: "valor",
  flg: "flag",
  sg: "sigla",
  tel: "telefone",
  fone: "telefone",
  cel: "celular",
  nasc: "nascimento",
  dob: "nascimento",
  bco: "banco",
  ag: "agencia",
  cc: "conta",
  obs: "observacao",
  observacoes: "observacao",
  desc: "descricao",
  qtd: "quantidade",
  doc: "documento",
  mail: "email",
  rua: "logradouro",
};

/** Prefixos de legado que não dizem nada sobre o dado (ds_email, tb_paciente, cad_cliente). */
export const DESCARTAR: ReadonlySet<string> = new Set(["ds", "in", "tb", "tab", "tbl", "cad", "col"]);

export const END_NAO_ENDERECO: ReadonlySet<string> = new Set(["date", "at", "time", "data", "hora", "of"]);

/** Palavras que terminam em "s" mas não são plural. */
export const NAO_PLURAL: ReadonlySet<string> = new Set([
  "status", "pis", "nis", "dados", "pais", "canvas", "atlas", "lapis", "virus", "campus", "corpus", "bonus", "cpfs",
]);

// ---------- contexto da tabela (palavras no singular) ----------

export const TABELA_PESSOA: ReadonlySet<string> = new Set([
  "cliente", "customer", "usuario", "user", "pessoa", "person", "paciente", "patient", "funcionario", "empregado",
  "employee", "colaborador", "aluno", "student", "estudante", "professor", "teacher", "medico", "doctor", "candidato",
  "dependente", "responsavel", "titular", "contato", "contact", "comprador", "buyer", "vendedor", "morador", "membro",
  "member", "hospede", "passageiro", "beneficiario", "socio", "lead", "motorista", "atendente", "corretor", "inquilino",
  "locatario", "proprietario", "autor", "author", "crianca", "menor", "adolescente", "pupil", "tutor", "doador",
  "eleitor", "assinante", "subscriber", "participante", "inscrito", "visitante", "visitor", "profile", "perfil",
  "motorista", "candidatura",
]);

export const TABELA_NAO_PESSOA: ReadonlySet<string> = new Set([
  "produto", "product", "categoria", "category", "loja", "store", "filial", "unidade", "departamento", "cargo", "turma",
  "curso", "disciplina", "feriado", "banco", "cidade", "estado", "pais", "country", "marca", "brand", "parceiro",
  "empresa", "company", "convenio", "sistema", "cfg", "config", "configuracao", "parametro", "setting", "moeda",
  "currency", "idioma", "locale", "tag", "vaga", "listing", "anuncio", "servico", "service", "plano", "regiao", "ref",
  "lookup", "dominio", "estoque", "city", "language", "department", "dept", "film", "genre", "fornecedor", "supplier", "cupom", "coupon", "permissao", "role", "menu",
]);

export const TABELA_ENDERECO: ReadonlySet<string> = new Set(["endereco", "address", "logradouro", "localizacao"]);
export const TABELA_LOG: ReadonlySet<string> = new Set(["log", "auditoria", "audit", "historico", "history", "trilha", "tentativa"]);
export const TABELA_CARTAO: ReadonlySet<string> = new Set(["cartao", "card"]);
export const TABELA_CONTA: ReadonlySet<string> = new Set(["conta", "account"]);
export const TABELA_FINANCEIRO: ReadonlySet<string> = new Set([
  "transacao", "movimento", "mov", "movimentacao", "emprestimo", "folha", "extrato", "lancamento", "fatura", "financeira",
  "financeiro",
]);
export const TABELA_SAUDE: ReadonlySet<string> = new Set([
  "prontuario", "vacina", "exame", "atestado", "prescricao", "receita", "internacao", "diagnostico", "laudo", "consulta",
  "genetica",
]);
export const TABELA_RESPONSAVEL: ReadonlySet<string> = new Set(["responsavel", "guardian"]);

/** Nome de tabela que indica criança/adolescente (achado INDICIO_MENOR). */
export const TABELA_CRIANCA: ReadonlySet<string> = new Set(["aluno", "student", "crianca", "menor", "adolescente", "estudante", "pupil"]);

// ---------- regras ----------

const P = (...palavras: string[]): string[] => palavras;
const LEI_PESSOAL = ["LGPD-5-I"];
const LEI_SENSIVEL = ["LGPD-5-II", "LGPD-11"];
const LEI_FINANCEIRO = ["LGPD-5-I", "LGPD-5-II"];

const NOTA_FIN =
  "Dado financeiro não é sensível pela lei (não está na lista fechada do art. 5º, II), mas é de alto risco: exige cuidado extra.";

export const REGRAS: readonly Regra[] = [
  // ===== não identificado explícito (chaves e pessoa jurídica) =====
  {
    id: "nid.chave",
    categoria: "nao_identificado",
    padroes: [P("id"), P("codigo")],
    peso: 9,
    rotulo: "chave ou código interno",
    fontes: LEI_PESSOAL,
    nota: "Chave substituta ou estrangeira não identifica ninguém sozinha. Quem tem a tabela de origem consegue ligar à pessoa.",
  },
  {
    id: "nid.pj",
    categoria: "nao_identificado",
    padroes: [P("razao", "social"), P("nome", "fantasia"), P("company", "name"), P("nome", "empresa"), P("business", "name")],
    peso: 8,
    pessoal: "nao",
    rotulo: "nome de empresa",
    fontes: LEI_PESSOAL,
    nota: "A lei protege pessoa natural. Nome de empresa (pessoa jurídica) não é dado pessoal, exceto empresário individual.",
  },

  // ===== identificador direto =====
  {
    id: "idd.cpf",
    categoria: "identificador_direto",
    padroes: [P("cpf")],
    peso: 7,
    tipos: ["texto", "numero"],
    evidenciaPessoa: true,
    rotulo: "CPF",
    fontes: LEI_PESSOAL,
    nota: "CPF é dado pessoal, mas NÃO é dado sensível (não está na lista do art. 5º, II).",
  },
  {
    id: "idd.cpf_ou_cnpj",
    categoria: "identificador_direto",
    padroes: [P("cpf", "cnpj"), P("cnpj", "cpf"), P("cpf", "ou", "cnpj"), P("cnpj", "ou", "cpf")],
    peso: 8,
    pessoal: "depende",
    rotulo: "CPF ou CNPJ",
    fontes: LEI_PESSOAL,
    nota: "Campo que guarda CPF ou CNPJ: é dado pessoal quando for CPF, ou CNPJ de empresário individual.",
  },
  {
    id: "idd.cnpj",
    categoria: "identificador_direto",
    padroes: [P("cnpj")],
    peso: 6,
    pessoal: "depende",
    rotulo: "CNPJ",
    fontes: LEI_PESSOAL,
    nota: "CNPJ é de pessoa jurídica, então em geral não é dado pessoal. Depende: pode ser de empresário individual ou de sócio.",
  },
  {
    id: "idd.rg",
    categoria: "identificador_direto",
    padroes: [P("rg"), P("identidade"), P("registro", "geral")],
    peso: 7,
    tipos: ["texto", "numero"],
    evidenciaPessoa: true,
    rotulo: "RG",
    fontes: LEI_PESSOAL,
    nota: "RG é dado pessoal, mas NÃO é dado sensível.",
  },
  {
    id: "idd.cnh",
    categoria: "identificador_direto",
    padroes: [P("cnh"), P("habilitacao"), P("carteira", "motorista")],
    peso: 7,
    rotulo: "CNH",
    fontes: LEI_PESSOAL,
    nota: "CNH é dado pessoal, mas NÃO é dado sensível.",
  },
  {
    id: "idd.passaporte",
    categoria: "identificador_direto",
    padroes: [P("passaporte"), P("passport")],
    peso: 7,
    rotulo: "passaporte",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.titulo_eleitor",
    categoria: "identificador_direto",
    padroes: [P("titulo", "eleitor")],
    peso: 7,
    rotulo: "título de eleitor",
    fontes: LEI_PESSOAL,
    nota: "O número do título é identificador. Não confundir com opinião política, que é dado sensível.",
  },
  {
    id: "idd.registros_trabalhistas",
    categoria: "identificador_direto",
    padroes: [P("pis"), P("nis"), P("pasep"), P("ctps")],
    peso: 7,
    rotulo: "documento trabalhista",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.certidao",
    categoria: "identificador_direto",
    padroes: [P("certidao")],
    peso: 7,
    rotulo: "certidão",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.registro_profissional",
    categoria: "identificador_direto",
    padroes: [P("crm"), P("oab"), P("crea"), P("coren")],
    peso: 6,
    contexto: { pessoa: 1 },
    rotulo: "registro profissional",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.matricula",
    categoria: "identificador_direto",
    padroes: [P("matricula")],
    peso: 3,
    contexto: { pessoa: 4, nao_pessoa: -9 },
    rotulo: "matrícula",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.nome",
    categoria: "identificador_direto",
    padroes: [
      P("nome"), P("name"), P("full", "name"), P("first", "name"), P("last", "name"), P("sobrenome"), P("surname"),
      P("nome", "completo"), P("nome", "mae"), P("nome", "pai"),
    ],
    peso: 3,
    tipos: ["texto"],
    contexto: { pessoa: 4, nao_pessoa: -9 },
    evidenciaPessoa: true,
    rotulo: "nome",
    fontes: LEI_PESSOAL,
    nota: "\"nome\" é dado pessoal em tabela de pessoas (clientes.nome) e não é em tabela de coisas (produtos.nome). Por isso o contexto da tabela pesa.",
  },
  {
    id: "idd.titular",
    categoria: "identificador_direto",
    padroes: [P("titular"), P("holder"), P("card", "holder"), P("favorecido"), P("beneficiario"), P("author"), P("autor")],
    peso: 5,
    tipos: ["texto"],
    rotulo: "titular ou favorecido",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.email",
    categoria: "identificador_direto",
    padroes: [P("email"), P("e", "email")],
    peso: 6,
    tipos: ["texto"],
    contexto: { nao_pessoa: -9 },
    evidenciaPessoa: true,
    rotulo: "e-mail",
    fontes: LEI_PESSOAL,
    nota: "E-mail corporativo genérico (contato@) não é dado pessoal; e-mail com nome de pessoa é.",
  },
  {
    id: "idd.telefone",
    categoria: "identificador_direto",
    padroes: [P("telefone"), P("celular"), P("phone"), P("mobile"), P("whatsapp"), P("phone", "number")],
    peso: 6,
    tipos: ["texto", "numero"],
    contexto: { nao_pessoa: -9 },
    evidenciaPessoa: true,
    rotulo: "telefone",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.login",
    categoria: "identificador_direto",
    padroes: [P("login"), P("username"), P("user", "name")],
    peso: 4,
    tipos: ["texto"],
    rotulo: "login",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.perfil_social",
    categoria: "identificador_direto",
    padroes: [P("linkedin"), P("facebook"), P("instagram"), P("twitter")],
    peso: 5,
    rotulo: "perfil em rede social",
    fontes: LEI_PESSOAL,
  },
  {
    id: "idd.documento",
    categoria: "identificador_direto",
    padroes: [P("documento")],
    peso: 4,
    tipos: ["texto", "numero"],
    rotulo: "documento",
    fontes: LEI_PESSOAL,
    nota: "\"documento\" sozinho não diz qual é. Confira o COMMENT da coluna.",
  },

  // ===== localização =====
  {
    id: "loc.endereco",
    categoria: "localizacao",
    padroes: [P("endereco"), P("address"), P("logradouro"), P("street"), P("avenida")],
    peso: 6,
    contexto: { nao_pessoa: -9 },
    rotulo: "endereço",
    fontes: LEI_PESSOAL,
    nota: "Endereço de loja ou filial não é dado pessoal; endereço de cliente, paciente ou funcionário é.",
  },
  {
    id: "loc.cep",
    categoria: "localizacao",
    padroes: [P("cep"), P("zip"), P("zip", "code"), P("codigo", "postal"), P("postal")],
    peso: 6,
    contexto: { nao_pessoa: -9 },
    rotulo: "CEP",
    fontes: LEI_PESSOAL,
  },
  {
    id: "loc.bairro",
    categoria: "localizacao",
    padroes: [P("bairro"), P("neighborhood"), P("district")],
    peso: 6,
    contexto: { nao_pessoa: -9 },
    rotulo: "bairro",
    fontes: LEI_PESSOAL,
  },
  {
    id: "loc.cidade",
    categoria: "localizacao",
    padroes: [P("cidade"), P("city"), P("municipio")],
    peso: 4,
    contexto: { endereco: 3, pessoa: 2, nao_pessoa: -9 },
    rotulo: "cidade",
    fontes: LEI_PESSOAL,
  },
  {
    id: "loc.uf",
    categoria: "localizacao",
    padroes: [P("uf")],
    peso: 4,
    contexto: { endereco: 3, pessoa: 2, nao_pessoa: -9 },
    rotulo: "UF",
    fontes: LEI_PESSOAL,
  },
  {
    id: "loc.parte_do_endereco",
    categoria: "localizacao",
    padroes: [
      P("numero"), P("complemento"), P("estado"), P("state"), P("pais"), P("country"), P("apartment"), P("house"), P("region"),
    ],
    peso: 1,
    contexto: { endereco: 6, nao_pessoa: -9 },
    rotulo: "parte do endereço",
    fontes: LEI_PESSOAL,
    nota: "Só conta como endereço dentro de uma tabela de endereços. Sozinho, \"numero\" e \"estado\" podem ser qualquer coisa.",
  },
  {
    id: "loc.ip",
    categoria: "localizacao",
    padroes: [P("ip")],
    peso: 7,
    tipos: ["texto", "numero", "binario"],
    rotulo: "endereço IP",
    fontes: LEI_PESSOAL,
    nota: "IP é dado pessoal quando permite ligar o acesso a uma pessoa. Em logs, costuma permitir.",
  },
  {
    id: "loc.coordenadas",
    categoria: "localizacao",
    padroes: [P("latitude"), P("longitude"), P("lat"), P("lng"), P("lon"), P("geolocalizacao"), P("geolocation")],
    peso: 6,
    tipos: ["numero", "texto"],
    contexto: { nao_pessoa: -9 },
    rotulo: "coordenadas",
    fontes: LEI_PESSOAL,
  },

  // ===== financeiro =====
  {
    id: "fin.cartao",
    categoria: "financeiro",
    padroes: [P("cartao"), P("card")],
    peso: 7,
    rotulo: "cartão",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.cvv",
    categoria: "financeiro",
    padroes: [P("cvv"), P("cvc"), P("cvv2")],
    peso: 7,
    rotulo: "código de segurança do cartão",
    fontes: LEI_FINANCEIRO,
    nota: `${NOTA_FIN} O CVV não deve ser guardado de jeito nenhum depois da autorização.`,
  },
  {
    id: "fin.dados_do_cartao",
    categoria: "financeiro",
    padroes: [P("numero"), P("token"), P("ultimos"), P("digitos"), P("validade"), P("expiracao")],
    peso: 1,
    contexto: { cartao: 6 },
    rotulo: "dado de cartão",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.pix",
    categoria: "financeiro",
    padroes: [P("pix")],
    peso: 6,
    rotulo: "chave Pix",
    fontes: LEI_FINANCEIRO,
    nota: `${NOTA_FIN} A chave Pix costuma ser CPF, e-mail ou telefone.`,
  },
  {
    id: "fin.conta_bancaria",
    categoria: "financeiro",
    padroes: [P("conta", "bancaria"), P("bank", "account"), P("iban"), P("agencia"), P("banco"), P("numero", "conta")],
    peso: 6,
    contexto: { nao_pessoa: -9 },
    rotulo: "conta bancária",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.conta",
    categoria: "financeiro",
    padroes: [P("conta")],
    peso: 4,
    exata: true,
    contexto: { conta: 3 },
    rotulo: "conta",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.saldo_e_credito",
    categoria: "financeiro",
    padroes: [P("saldo"), P("balance"), P("limite", "credito"), P("score", "credito"), P("score"), P("divida"), P("patrimonio")],
    peso: 6,
    contexto: { nao_pessoa: -9 },
    rotulo: "saldo ou crédito",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.limite",
    categoria: "financeiro",
    padroes: [P("limite")],
    peso: 4,
    rotulo: "limite",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.renda",
    categoria: "financeiro",
    padroes: [P("salario"), P("salary"), P("salarial"), P("renda"), P("income"), P("remuneracao"), P("holerite"), P("contracheque"), P("pensao")],
    peso: 7,
    contexto: { nao_pessoa: -9 },
    rotulo: "renda ou salário",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.pretensao",
    categoria: "financeiro",
    padroes: [P("pretensao")],
    peso: 5,
    rotulo: "pretensão salarial",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.boleto",
    categoria: "financeiro",
    padroes: [P("boleto"), P("linha", "digitavel")],
    peso: 5,
    rotulo: "boleto",
    fontes: LEI_FINANCEIRO,
    nota: NOTA_FIN,
  },
  {
    id: "fin.valor_em_tabela_financeira",
    categoria: "financeiro",
    padroes: [P("valor"), P("amount"), P("descontos"), P("liquido"), P("bruto")],
    peso: 1,
    contexto: { financeiro: 6 },
    rotulo: "valor financeiro",
    fontes: LEI_FINANCEIRO,
    nota: `${NOTA_FIN} \"valor\" só foi marcado por estar numa tabela de movimentação, empréstimo ou folha.`,
  },

  // ===== sensível (art. 5º, II: lista fechada) =====
  {
    id: "sen.racial",
    categoria: "sensivel",
    subtipo: "racial_etnica",
    padroes: [P("raca"), P("etnia"), P("ethnicity"), P("race"), P("cor", "raca"), P("raca", "cor")],
    peso: 7,
    rotulo: "raça, cor ou etnia",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.religiao",
    categoria: "sensivel",
    subtipo: "religiao",
    padroes: [P("religiao"), P("religion"), P("credo")],
    peso: 7,
    rotulo: "religião",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.politica",
    categoria: "sensivel",
    subtipo: "politica",
    padroes: [P("orientacao", "politica"), P("opiniao", "politica"), P("filiacao", "partidaria"), P("partido"), P("political")],
    peso: 7,
    rotulo: "opinião política",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.sindical",
    categoria: "sensivel",
    subtipo: "sindical",
    padroes: [P("sindicalizado"), P("sindicato"), P("sindical"), P("filiado", "sindicato")],
    peso: 7,
    rotulo: "filiação sindical",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.saude",
    categoria: "sensivel",
    subtipo: "saude",
    padroes: [
      P("saude"), P("health"), P("diagnostico"), P("diagnosis"), P("cid"), P("doenca"), P("patologia"), P("alergia"),
      P("allergy"), P("medicamento"), P("remedio"), P("posologia"), P("dosagem"), P("sanguineo"), P("tipo", "sangue"),
      P("hiv"), P("deficiencia"), P("disability"), P("necessidade", "especial"), P("queixa"), P("sintoma"), P("laudo"),
      P("afastamento"), P("atestado"), P("vacina"), P("prontuario"), P("gravidez"), P("gestante"), P("cirurgia"),
      P("internacao"), P("plano", "saude"), P("historico", "medico"), P("obito"),
    ],
    peso: 7,
    rotulo: "saúde",
    fontes: LEI_SENSIVEL,
    nota: "Dado de saúde é sensível (art. 5º, II) e o tratamento tem bases legais próprias (art. 11).",
  },
  {
    id: "sen.saude_fraca",
    categoria: "sensivel",
    subtipo: "saude",
    padroes: [P("exame"), P("pcd"), P("tratamento"), P("carteirinha")],
    peso: 5,
    rotulo: "possível dado de saúde",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.saude_em_tabela_de_saude",
    categoria: "sensivel",
    subtipo: "saude",
    padroes: [P("resultado"), P("aplicacao"), P("conduta")],
    peso: 2,
    contexto: { saude: 5 },
    rotulo: "dado de saúde (pela tabela)",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.vida_sexual",
    categoria: "sensivel",
    subtipo: "vida_sexual",
    padroes: [P("orientacao", "sexual"), P("vida", "sexual"), P("sexual"), P("sexualidade")],
    peso: 7,
    rotulo: "vida sexual",
    fontes: LEI_SENSIVEL,
    nota: "\"sexo\" ou \"gênero\" (masculino/feminino) NÃO é vida sexual. Orientação sexual é.",
  },
  {
    id: "sen.genetico",
    categoria: "sensivel",
    subtipo: "genetico",
    padroes: [P("dna"), P("genetico"), P("geneticos"), P("genetic"), P("genoma"), P("genome")],
    peso: 7,
    rotulo: "dado genético",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.biometrico",
    categoria: "sensivel",
    subtipo: "biometrico",
    padroes: [
      P("biometria"), P("biometrico"), P("biometric"), P("impressao", "digital"), P("template", "facial"), P("iris"),
      P("reconhecimento", "facial"),
    ],
    peso: 7,
    rotulo: "biometria",
    fontes: LEI_SENSIVEL,
  },
  {
    id: "sen.biometrico_fraco",
    categoria: "sensivel",
    subtipo: "biometrico",
    padroes: [P("facial"), P("digital")],
    peso: 3,
    rotulo: "possível biometria",
    fontes: LEI_SENSIVEL,
    nota: "\"digital\" e \"facial\" sozinhos são ambíguos. Só viram biometria com ajuda do COMMENT.",
  },

  // ===== criança e adolescente (indício) =====
  {
    id: "cri.responsavel",
    categoria: "crianca_adolescente",
    padroes: [P("responsavel"), P("guardian"), P("tutor")],
    peso: 9,
    contexto: { responsavel: -10 },
    rotulo: "responsável legal",
    fontes: ["LGPD-14"],
    nota: "Indício: coluna de responsável legal costuma existir porque o titular é menor. Não prova que o dado é de criança.",
  },
  {
    id: "cri.menor",
    categoria: "crianca_adolescente",
    padroes: [P("menor"), P("minor"), P("crianca"), P("adolescente")],
    peso: 7,
    rotulo: "indicação de menor de idade",
    fontes: ["LGPD-14"],
    nota: "Indício de dado de criança ou adolescente (art. 14).",
  },
  {
    id: "cri.ano_escolar",
    categoria: "crianca_adolescente",
    padroes: [P("school", "year"), P("ano", "escolar"), P("serie")],
    peso: 6,
    contexto: { nao_pessoa: -9 },
    rotulo: "série ou ano escolar",
    fontes: ["LGPD-14"],
    nota: "Indício fraco: série escolar sugere aluno, que pode ser menor ou adulto (EJA, faculdade).",
  },

  // ===== outro dado pessoal =====
  {
    id: "out.nascimento",
    categoria: "outro_dado_pessoal",
    padroes: [P("nascimento"), P("birth"), P("birthday"), P("birthdate"), P("date", "of", "birth")],
    peso: 6,
    tipos: ["data", "texto"],
    evidenciaPessoa: true,
    rotulo: "data de nascimento",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.idade",
    categoria: "outro_dado_pessoal",
    padroes: [P("idade"), P("age")],
    peso: 5,
    tipos: ["numero", "texto"],
    rotulo: "idade",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.sexo_genero",
    categoria: "outro_dado_pessoal",
    padroes: [P("sexo"), P("genero"), P("gender")],
    peso: 5,
    tipos: ["texto", "booleano"],
    rotulo: "sexo ou gênero",
    fontes: LEI_PESSOAL,
    nota: "Sexo ou gênero (masculino/feminino) é dado pessoal, mas NÃO é sensível pela lei.",
  },
  {
    id: "out.estado_civil",
    categoria: "outro_dado_pessoal",
    padroes: [P("estado", "civil"), P("marital")],
    peso: 6,
    rotulo: "estado civil",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.origem_e_profissao",
    categoria: "outro_dado_pessoal",
    padroes: [P("nacionalidade"), P("naturalidade"), P("profissao"), P("occupation"), P("ocupacao")],
    peso: 6,
    rotulo: "nacionalidade ou profissão",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.vida_funcional",
    categoria: "outro_dado_pessoal",
    padroes: [P("admissao"), P("demissao"), P("hired"), P("hire"), P("formacao"), P("degree"), P("escolaridade")],
    peso: 5,
    rotulo: "vida funcional ou formação",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.cargo_e_especialidade",
    categoria: "outro_dado_pessoal",
    padroes: [P("cargo"), P("especialidade")],
    peso: 4,
    contexto: { pessoa: 2, nao_pessoa: -9 },
    rotulo: "cargo ou especialidade",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.parentesco",
    categoria: "outro_dado_pessoal",
    padroes: [P("parentesco")],
    peso: 5,
    rotulo: "parentesco",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.curriculo",
    categoria: "outro_dado_pessoal",
    padroes: [P("curriculo"), P("resume")],
    peso: 5,
    rotulo: "currículo",
    fontes: LEI_PESSOAL,
  },
  {
    id: "out.imagem",
    categoria: "outro_dado_pessoal",
    padroes: [P("foto"), P("photo"), P("picture"), P("avatar"), P("selfie")],
    peso: 6,
    rotulo: "foto",
    fontes: LEI_PESSOAL,
    nota: "Foto é dado pessoal. Só seria biometria (sensível) se for processada para identificar a pessoa, como um vetor facial.",
  },
  {
    id: "out.dispositivo",
    categoria: "outro_dado_pessoal",
    padroes: [P("device", "id"), P("user", "agent")],
    peso: 8,
    rotulo: "identificador de dispositivo",
    fontes: LEI_PESSOAL,
    pessoal: "depende",
    nota: "Identificador de dispositivo e user-agent podem identificar uma pessoa quando combinados com outros dados.",
  },
];

// ---------- achados estruturais (vocabulário, em tokens canônicos) ----------

/** Coluna que registra quando a linha passou a existir ou quando o evento ocorreu. */
export const VOCAB_CRIACAO: ReadonlySet<string> = new Set([
  "criado", "criada", "criacao", "created", "cadastro", "cadastrado", "inserido", "inserted", "registrado", "registro",
  "abertura", "emissao", "ocorreu", "ocorrencia", "tentativa", "batida", "lancado", "enrolled", "timestamp", "paid",
  "pago", "sent", "enviado",
]);

/** Coluna de exclusão lógica. "ativo" NÃO entra: pode ser só status, não exclusão. */
export const VOCAB_EXCLUSAO: ReadonlySet<string> = new Set([
  "deleted", "excluido", "exclusao", "removido", "removed", "deletado", "closed", "encerrado", "desativado", "inativado",
]);

/** Nomes típicos de campo de texto livre. */
export const VOCAB_TEXTO_LIVRE: ReadonlySet<string> = new Set([
  "observacao", "obs", "descricao", "comentario", "comentarios", "notes", "note", "notas", "mensagem", "anotacao",
  "detalhes", "justificativa", "relato", "remarks", "comment", "comments", "message", "description", "memo",
]);

/** Indícios de que a coluna já guarda o dado protegido (hash, cifra, token). */
export const VOCAB_PROTECAO: ReadonlySet<string> = new Set([
  "hash", "criptografado", "criptografada", "cript", "cifrado", "cifrada", "encrypted", "enc", "sha", "sha256", "bcrypt",
  "argon", "salt", "token", "tokenizado", "pseudonimizado",
]);
