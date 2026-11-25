import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarRepositorioEmMemoria } from '../src/adapters/repositorio-em-memoria.ts';
import type { RepositorioDeTarefas } from '../src/application/ports/repositorio-de-tarefas.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';
import { TituloInvalido } from '../src/domain/tarefa.ts';

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
  const repositorio: RepositorioDeTarefas = {
    salvar() {
      assert.fail('O repositório recebeu um título inválido.');
    },
    listar() {
      return [];
    },
  };
  const tarefas = criarCasosDeUsoDeTarefas(repositorio);

  assert.throws(() => tarefas.adicionarTarefa('   '), TituloInvalido);
});
