import test from "node:test";
import assert from "node:assert/strict";
import { parseData, parseValor, mesAnoDaData } from "../src/utils/validacao.js";

test("parseValor aceita valores positivos com duas casas", () => {
  assert.equal(parseValor("12,50"), 12.5);
  assert.equal(parseValor("0"), null);
  assert.equal(parseValor("abc"), null);
});

test("parseData rejeita datas inexistentes", () => {
  assert.equal(parseData("2026-02-30"), null);
  assert.equal(parseData("26/10/2026"), null);
  assert.ok(parseData("2026-10-26") instanceof Date);
});

test("mesAnoDaData extrai mês e ano em UTC", () => {
  assert.deepEqual(mesAnoDaData(parseData("2026-10-26")), { mes: 10, ano: 2026 });
});
