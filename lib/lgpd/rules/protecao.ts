import type { Categoria, ClassificacaoColuna } from "../types";

/**
 * Sugestões de proteção e hipóteses de base legal. Também são DADOS.
 * Tudo aqui é sugestão: a decisão é do controlador, com apoio jurídico e de segurança.
 */

export type TecnicaId =
  | "minimizacao"
  | "mascaramento"
  | "criptografia_repouso"
  | "hash_com_sal"
  | "tokenizacao"
  | "pseudonimizacao";

export interface Tecnica {
  id: TecnicaId;
  nome: string;
  /** Quando faz sentido usar. */
  quando: string;
  /** Quando NÃO serve. */
  naoServe: string;
  fontes: string[];
}

export const TECNICAS: Readonly<Record<TecnicaId, Tecnica>> = {
  minimizacao: {
    id: "minimizacao",
    nome: "Minimização",
    quando:
      "Antes de qualquer outra coisa: pergunte se você precisa mesmo coletar e guardar isto. Dado que não existe não vaza, não precisa de prazo e não entra em pedido de titular.",
    naoServe: "Não serve quando o dado é indispensável para a finalidade ou exigido por lei.",
    fontes: ["LGPD-6-III", "ANPD-SEG-45"],
  },
  mascaramento: {
    id: "mascaramento",
    nome: "Mascaramento na exibição",
    quando:
      "Quando a tela, o relatório ou o suporte só precisam reconhecer o dado, não ler inteiro. Mostre só o necessário e deixe o valor completo para quem tem motivo.",
    naoServe: "Não protege o dado guardado no banco: quem acessa a tabela continua vendo tudo.",
    fontes: ["LGPD-6-VII", "LGPD-46"],
  },
  criptografia_repouso: {
    id: "criptografia_repouso",
    nome: "Criptografia em repouso",
    quando:
      "Quando o dado precisa ser lido de volta e vaza feio se o banco ou o backup escaparem (sensíveis, documentos, financeiro). Cifre na aplicação ou no disco e guarde a chave fora do banco.",
    naoServe: "Não protege de quem já tem acesso à aplicação e à chave. Cifrar a coluna dificulta buscar e ordenar por ela.",
    fontes: ["LGPD-46", "ANPD-SEG-46"],
  },
  hash_com_sal: {
    id: "hash_com_sal",
    nome: "Hash com sal",
    quando:
      "Quando você só precisa comparar (senha, conferir se um CPF já existe) e nunca ler o valor de volta. Use algoritmo próprio para senha (bcrypt, argon2) e sal único por registro.",
    naoServe:
      "Não serve para dado que precisa ser lido de volta. Hash sem sal de dado com poucas combinações (CPF, telefone) se desfaz por força bruta, então continua sendo dado pessoal.",
    fontes: ["LGPD-5-XI", "LGPD-12"],
  },
  tokenizacao: {
    id: "tokenizacao",
    nome: "Tokenização",
    quando:
      "Quando outro sistema (gateway de pagamento, cofre) pode guardar o dado real e entregar a você só um código sem valor fora dele. É o caminho certo para número de cartão.",
    naoServe: "Não serve se você precisa do valor real no seu próprio sistema. Depende de um terceiro confiável.",
    fontes: ["LGPD-46", "LGPD-13-4"],
  },
  pseudonimizacao: {
    id: "pseudonimizacao",
    nome: "Pseudonimização",
    quando:
      "Quando análise, teste ou estatística não precisam saber quem é a pessoa. Troque o identificador por um código e guarde a tabela de correspondência separada, com acesso restrito.",
    naoServe:
      "Dado pseudonimizado continua sendo dado pessoal: a ligação com a pessoa existe em outro lugar. Só anonimização de verdade tira o dado do alcance da lei.",
    fontes: ["LGPD-13-4", "ANPD-SEG-46"],
  },
};

export interface Sugestao {
  tecnica: TecnicaId;
  /** Como aplicar neste dado, com exemplo quando ajuda. */
  dica: string;
}

const MASCARAS: Readonly<Record<string, string>> = {
  "idd.cpf": "Mostre ***.123.456-** (esconda o começo e o dígito verificador).",
  "idd.cpf_ou_cnpj": "Mostre só o miolo e esconda as pontas, como ***.123.456-**.",
  "idd.rg": "Mostre só os últimos dígitos: ****4567.",
  "idd.cnh": "Mostre só os últimos dígitos: *******4567.",
  "idd.email": "Mostre j***@exemplo.com.",
  "idd.telefone": "Mostre (11) *****-1234.",
  "loc.ip": "Zere o último trecho do IPv4 (203.0.113.0) antes de exibir ou exportar.",
  "loc.coordenadas": "Arredonde para 2 casas decimais (cerca de 1 km) quando a precisão exata não for necessária.",
  "loc.cep": "Mostre só os 5 primeiros dígitos.",
  "loc.endereco": "Mostre só bairro e cidade.",
  "fin.cartao": "Mostre **** **** **** 1234.",
  "fin.conta_bancaria": "Mostre só os últimos dígitos da conta.",
  "out.nascimento": "Mostre só a idade ou a faixa etária quando a data exata não for necessária.",
};

function mascara(c: ClassificacaoColuna): string | null {
  return (c.ruleId && MASCARAS[c.ruleId]) || null;
}

/** Sugestões de proteção para uma coluna, na ordem em que valem a pena. */
export function sugerirProtecao(c: ClassificacaoColuna): Sugestao[] {
  if (c.pessoal === "nao" || c.categoria === "nao_identificado") return [];
  const lista: Sugestao[] = [];
  const add = (tecnica: TecnicaId, dica: string) => lista.push({ tecnica, dica });

  const minimizacao = "Você precisa mesmo coletar isso? Se a finalidade funciona sem este campo, tire-o.";
  add("minimizacao", minimizacao);

  const m = mascara(c);
  const cat: Categoria = c.categoria;

  switch (cat) {
    case "sensivel":
      add("criptografia_repouso", "A ANPD sugere solução que dificulte identificar o titular em dado sensível, como criptografia. Cifre a coluna e guarde a chave fora do banco.");
      add("pseudonimizacao", "Para análises e testes, separe o dado sensível do identificador da pessoa e ligue os dois por um código.");
      if (m) add("mascaramento", m);
      break;
    case "financeiro":
      if (c.ruleId === "fin.cartao" || c.ruleId === "fin.cvv" || c.ruleId === "fin.dados_do_cartao") {
        add("tokenizacao", "Deixe o gateway de pagamento guardar o cartão e fique só com o token. Nunca guarde o CVV.");
      } else {
        add("criptografia_repouso", "Dado financeiro não é sensível pela lei, mas é de alto risco: cifre em repouso.");
      }
      if (m) add("mascaramento", m);
      break;
    case "crianca_adolescente":
      add("criptografia_repouso", "Dado de criança ou adolescente pede cuidado redobrado: limite o acesso e cifre o que for possível.");
      break;
    case "identificador_direto":
      if (m) add("mascaramento", m);
      if (c.ruleId === "idd.cpf" || c.ruleId === "idd.rg" || c.ruleId === "idd.cnh" || c.ruleId === "idd.registros_trabalhistas") {
        add("criptografia_repouso", "Documento de identificação é alvo de fraude: cifre em repouso se o banco tiver muitos acessos.");
        add("hash_com_sal", "Se você só precisa saber se o documento já foi cadastrado, guarde um hash com sal e não o número.");
      }
      if (c.ruleId === "idd.nome") {
        add("pseudonimizacao", "Em bases de teste e de análise, troque o nome por um código.");
      }
      break;
    case "localizacao":
      if (m) add("mascaramento", m);
      if (c.ruleId === "loc.ip") add("pseudonimizacao", "Em logs antigos, troque o IP por um identificador de sessão.");
      break;
    case "outro_dado_pessoal":
      if (m) add("mascaramento", m);
      break;
    default:
      break;
  }
  return lista;
}

export const RETENCAO_PADRAO = "a definir pelo controlador";
export const FINALIDADE_PADRAO = "";

export interface HipoteseBaseLegal {
  /** Texto curto para a coluna "base legal (hipótese)". */
  texto: string;
  fontes: string[];
}

/**
 * Hipótese de base legal por CATEGORIA, nunca por coluna. Depende da finalidade, então
 * sempre sai marcada como hipótese. Quem decide é o controlador com o jurídico.
 */
export const BASE_LEGAL_POR_CATEGORIA: Readonly<Record<Categoria, HipoteseBaseLegal>> = {
  identificador_direto: {
    texto:
      "Hipótese: execução de contrato (art. 7º, V), obrigação legal (art. 7º, II), legítimo interesse (art. 7º, IX) ou consentimento (art. 7º, I). Depende da finalidade.",
    fontes: ["LGPD-7"],
  },
  localizacao: {
    texto:
      "Hipótese: execução de contrato, como para entregar um pedido (art. 7º, V), ou legítimo interesse (art. 7º, IX). Depende da finalidade.",
    fontes: ["LGPD-7"],
  },
  financeiro: {
    texto:
      "Hipótese: execução de contrato (art. 7º, V), obrigação legal (art. 7º, II) ou proteção do crédito (art. 7º, X). Não é dado sensível, mas é de alto risco.",
    fontes: ["LGPD-7", "LGPD-5-II"],
  },
  crianca_adolescente: {
    texto:
      "Hipótese: tratamento no melhor interesse da criança ou do adolescente (art. 14). Para criança, consentimento específico e em destaque de um dos pais ou do responsável (art. 14, § 1º).",
    fontes: ["LGPD-14"],
  },
  sensivel: {
    texto:
      "Hipótese: consentimento específico e destacado (art. 11, I) ou, sem consentimento, só nos casos do art. 11, II (obrigação legal, tutela da saúde por profissionais de saúde, exercício regular de direitos, proteção da vida etc.).",
    fontes: ["LGPD-11"],
  },
  outro_dado_pessoal: {
    texto:
      "Hipótese: execução de contrato (art. 7º, V), legítimo interesse (art. 7º, IX) ou consentimento (art. 7º, I). Depende da finalidade.",
    fontes: ["LGPD-7"],
  },
  nao_identificado: {
    texto: "Não se aplica: a Tarja não encontrou indício de dado pessoal nesta coluna.",
    fontes: ["LGPD-5-I"],
  },
};
