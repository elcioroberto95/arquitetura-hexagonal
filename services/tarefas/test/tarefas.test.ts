import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criarRepositorioEmMemoria } from '../src/adapters/repositorio-em-memoria.ts';
import type { RepositorioDeTarefas } from '../src/application/ports/repositorio-de-tarefas.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';
import type { TarefaConcluida } from '../src/domain/tarefa-concluida.ts';
import { TituloInvalido } from '../src/domain/titulo-tarefa.ts';

test('adiciona e lista as tarefas na ordem em que foram criadas', () => {
  let sequencia = 0;
  const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioEmMemoria(), () => `tarefa-${++sequencia}`);

  assert.deepEqual(tarefas.listarTarefas(), []);
  const criada = tarefas.adicionarTarefa('  Estudar arquitetura hexagonal  ');
  assert.equal(criada.titulo.valor, 'Estudar arquitetura hexagonal');
  tarefas.adicionarTarefa('Revisar a PR');

  const lista = tarefas.listarTarefas().map((tarefa) => ({ ...tarefa, titulo: tarefa.titulo.valor }));
  assert.deepEqual(lista, [
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

test('publica TarefaConcluida uma vez, depois de gravar a mudança', () => {
  const repositorio = criarRepositorioEmMemoria();
  const publicados: TarefaConcluida[] = [];
  const tarefas = criarCasosDeUsoDeTarefas(repositorio, () => 'tarefa-1', {
    publicar(evento) {
      assert.equal(repositorio.buscarPorId(evento.tarefaId)?.status, 'concluida');
      publicados.push(evento);
    },
  });
  const tarefa = tarefas.adicionarTarefa('Revisar eventos');

  assert.equal(tarefas.concluirTarefa(tarefa.id)?.status, 'concluida');
  assert.equal(tarefas.concluirTarefa(tarefa.id)?.status, 'concluida');
  assert.equal(tarefas.concluirTarefa('ausente'), undefined);
  assert.deepEqual(publicados, [{ tipo: 'TarefaConcluida', tarefaId: tarefa.id }]);
});

test('deixa a tarefa pendente e não publica se a gravação falhar', () => {
  const repositorio = criarRepositorioEmMemoria();
  const publicados: TarefaConcluida[] = [];
  const tarefas = criarCasosDeUsoDeTarefas({
    ...repositorio,
    atualizarStatus() {
      throw new Error('Gravação indisponível.');
    },
  }, () => 'tarefa-1', {
    publicar(evento) {
      publicados.push(evento);
    },
  });
  const tarefa = tarefas.adicionarTarefa('Revisar eventos');

  assert.throws(() => tarefas.concluirTarefa(tarefa.id), /Gravação indisponível/);
  assert.equal(repositorio.buscarPorId(tarefa.id)?.status, 'pendente');
  assert.deepEqual(publicados, []);
});

test('mantém a conclusão gravada quando a publicação local falha', () => {
  const repositorio = criarRepositorioEmMemoria();
  let tentativas = 0;
  const tarefas = criarCasosDeUsoDeTarefas(repositorio, () => 'tarefa-1', {
    publicar() {
      tentativas++;
      throw new Error('Publicação indisponível.');
    },
  });
  const tarefa = tarefas.adicionarTarefa('Revisar eventos');

  assert.equal(tarefas.concluirTarefa(tarefa.id)?.status, 'concluida');
  assert.equal(tarefas.concluirTarefa(tarefa.id)?.status, 'concluida');
  assert.equal(repositorio.buscarPorId(tarefa.id)?.status, 'concluida');
  assert.equal(tentativas, 1);
});
