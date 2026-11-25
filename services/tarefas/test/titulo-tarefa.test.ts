import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TituloInvalido, TituloTarefa } from '../src/domain/titulo-tarefa.ts';

test('compara títulos pelo texto após remover os espaços das extremidades', () => {
  const titulo = TituloTarefa.criar('  Revisar a aula  ');
  const outro = TituloTarefa.criar('Revisar a aula');

  assert.equal(titulo.valor, 'Revisar a aula');
  assert.notEqual(titulo, outro);
  assert.equal(titulo.igualA(outro), true);
  assert.equal(titulo.igualA(TituloTarefa.criar('Estudar DDD')), false);
});

test('rejeita um título que fica vazio após remover os espaços', () => {
  assert.throws(() => TituloTarefa.criar(' \t '), TituloInvalido);
});
