import { describe, expect, it } from "vitest";
import { APELIDOS, DESCARTAR, END_NAO_ENDERECO, NAO_PLURAL } from "../../lib/lgpd/rules/pt-br";
import { contem, familiaDoTipo, igual, palavras, singular, tokens } from "../../lib/lgpd/text";

const dic = { apelidos: APELIDOS, descartar: DESCARTAR, endNaoEndereco: END_NAO_ENDERECO };

describe("palavras()", () => {
  const casos: Array<[string, string[]]> = [
    ["data_nascimento", ["data", "nascimento"]],
    ["DataNascimento", ["data", "nascimento"]],
    ["dataNascimento", ["data", "nascimento"]],
    ["DTNASC", ["dtnasc"]],
    ["DtNasc", ["dt", "nasc"]],
    ["CPFNumero", ["cpf", "numero"]],
    ["EMail", ["e", "mail"]],
    ["cid10", ["cid", "10"]],
    ["nº_do_endereço", ["n", "do", "endereco"]],
    ["número", ["numero"]],
    ["a--b__c", ["a", "b", "c"]],
    ["", []],
    ["___", []],
  ];
  for (const [entrada, saida] of casos) {
    it(`${JSON.stringify(entrada)} -> ${JSON.stringify(saida)}`, () => {
      expect(palavras(entrada)).toEqual(saida);
    });
  }
});

describe("tokens()", () => {
  it("aplica apelidos e descarta prefixos de legado", () => {
    expect(tokens("ds_email", dic)).toEqual(["email"]);
    expect(tokens("nm_paciente", dic)).toEqual(["nome", "paciente"]);
    expect(tokens("dt_nasc", dic)).toEqual(["data", "nascimento"]);
    expect(tokens("tb_paciente", dic)).toEqual(["paciente"]);
  });
  it("end vira endereco, menos em end_date", () => {
    expect(tokens("end_cob", dic)).toEqual(["endereco", "cob"]);
    expect(tokens("end_date", dic)).toEqual(["end", "date"]);
    expect(tokens("end", dic)).toEqual(["endereco"]);
  });
});

describe("singular()", () => {
  const casos: Array<[string, string]> = [
    ["clientes", "cliente"], ["usuarios", "usuario"], ["enderecos", "endereco"], ["pedidos", "pedido"],
    ["paises", "pais"], ["countries", "country"], ["cidades", "cidade"], ["funcionarios", "funcionario"],
    ["responsaveis", "responsavel"], ["pagamentos", "pagamento"], ["transacoes", "transacao"], ["status", "status"],
    ["pis", "pis"], ["dados", "dados"], ["log", "log"], ["ss", "ss"], ["aas", "aas"],
  ];
  for (const [a, b] of casos) {
    it(`${a} -> ${b}`, () => expect(singular(a, NAO_PLURAL)).toBe(b));
  }
});

describe("familiaDoTipo()", () => {
  it("separa as famílias de tipo", () => {
    expect(familiaDoTipo("varchar", "10")).toBe("texto");
    expect(familiaDoTipo("text", null)).toBe("texto_longo");
    expect(familiaDoTipo("longtext", null)).toBe("texto_longo");
    expect(familiaDoTipo("int", null)).toBe("numero");
    expect(familiaDoTipo("decimal", "10,2")).toBe("numero");
    expect(familiaDoTipo("datetime", null)).toBe("data");
    expect(familiaDoTipo("blob", null)).toBe("binario");
    expect(familiaDoTipo("varbinary", "16")).toBe("binario");
    expect(familiaDoTipo("tinyint", "1")).toBe("booleano");
    expect(familiaDoTipo("tinyint", "4")).toBe("numero");
    expect(familiaDoTipo("boolean", null)).toBe("booleano");
    expect(familiaDoTipo("geometry", null)).toBe("texto");
  });
});

describe("contem() e igual()", () => {
  it("contíguo e na ordem", () => {
    expect(contem(["a", "b", "c"], ["b", "c"])).toBe(true);
    expect(contem(["a", "b", "c"], ["a", "c"])).toBe(false);
    expect(contem(["a"], [])).toBe(false);
    expect(contem(["a"], ["a", "b"])).toBe(false);
    expect(igual(["a", "b"], ["a", "b"])).toBe(true);
    expect(igual(["a"], ["a", "b"])).toBe(false);
    expect(igual(["a", "c"], ["a", "b"])).toBe(false);
  });
});
