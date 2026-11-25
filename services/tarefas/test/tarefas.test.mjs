import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarRepositorioEmMemoria } from '../src/adapters/repositorio-em-memoria.mjs';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.mjs';
import { TituloInvalido } from '../src/domain/tarefa.mjs';

test('adiciona e lista as tarefas na ordem em que foram criadas', () => {
  const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioEmMemoria());

  assert.deepEqual(tarefas.listarTarefas(), []);
  assert.deepEqual(tarefas.adicionarTarefa('  Estudar arquitetura hexagonal  '), {
    titulo: 'Estudar arquitetura hexagonal',
  });
  tarefas.adicionarTarefa('Revisar a PR');

  assert.deepEqual(tarefas.listarTarefas(), [
    { titulo: 'Estudar arquitetura hexagonal' },
    { titulo: 'Revisar a PR' },
  ]);
});

test('rejeita um título vazio antes de salvar', () => {
  const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioEmMemoria());

  assert.throws(() => tarefas.adicionarTarefa('   '), TituloInvalido);
  assert.deepEqual(tarefas.listarTarefas(), []);
});
