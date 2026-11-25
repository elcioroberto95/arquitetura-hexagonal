import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarRepositorioEmMemoria } from '../src/adapters/repositorio-em-memoria.ts';
import type { RepositorioDeTarefas } from '../src/application/ports/repositorio-de-tarefas.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';
import { TituloInvalido } from '../src/domain/tarefa.ts';

test('adiciona e lista as tarefas na ordem em que foram criadas', () => {
  let sequencia = 0;
  const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioEmMemoria(), () => `tarefa-${++sequencia}`);

  assert.deepEqual(tarefas.listarTarefas(), []);
  assert.deepEqual(tarefas.adicionarTarefa('  Estudar arquitetura hexagonal  '), {
    id: 'tarefa-1',
    titulo: 'Estudar arquitetura hexagonal',
    status: 'pendente',
  });
  tarefas.adicionarTarefa('Revisar a PR');

  assert.deepEqual(tarefas.listarTarefas(), [
    { id: 'tarefa-1', titulo: 'Estudar arquitetura hexagonal', status: 'pendente' },
    { id: 'tarefa-2', titulo: 'Revisar a PR', status: 'pendente' },
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
    buscarPorId() {
      return undefined;
    },
    atualizarStatus() {
      assert.fail('O repositório recebeu uma atualização inesperada.');
    },
  };
  const tarefas = criarCasosDeUsoDeTarefas(repositorio, () => 'tarefa-1');

  assert.throws(() => tarefas.adicionarTarefa('   '), TituloInvalido);
});
