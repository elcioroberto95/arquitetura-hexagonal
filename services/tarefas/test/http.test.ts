import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { criarServidorHttp } from '../src/adapters/http.ts';
import { criarRepositorioEmMemoria } from '../src/adapters/repositorio-em-memoria.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';

async function iniciarApi(contexto: TestContext): Promise<string> {
  let sequencia = 0;
  const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioEmMemoria(), () => `tarefa-${++sequencia}`);
  const servidor = criarServidorHttp(tarefas);
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  contexto.after(async () => {
    const fechado = once(servidor, 'close');
    servidor.close();
    await fechado;
  });

  const endereco = servidor.address();
  assert(endereco && typeof endereco === 'object');
  return `http://127.0.0.1:${endereco.port}`;
}

test('cria uma tarefa por HTTP e a devolve na listagem', async (contexto) => {
  const api = await iniciarApi(contexto);

  const criada = await fetch(`${api}/tarefas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: '  Estudar portas e adaptadores  ' }),
  });
  assert.equal(criada.status, 201);
  const esperada = { id: 'tarefa-1', titulo: 'Estudar portas e adaptadores', status: 'pendente' };
  assert.deepEqual(await criada.json(), esperada);

  const lista = await fetch(`${api}/tarefas`);
  assert.equal(lista.status, 200);
  assert.deepEqual(await lista.json(), [esperada]);
});

test('conclui por ID só uma das tarefas com o mesmo título', async (contexto) => {
  const api = await iniciarApi(contexto);
  const titulo = 'Revisar a aula';
  for (const id of ['tarefa-1', 'tarefa-2']) {
    const criada = await fetch(`${api}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo }),
    });
    assert.equal(criada.status, 201);
    assert.deepEqual(await criada.json(), { id, titulo, status: 'pendente' });
  }

  const esperada = { id: 'tarefa-2', titulo, status: 'concluida' };
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const concluida = await fetch(`${api}/tarefas/tarefa-2/concluir`, { method: 'PATCH' });
    assert.equal(concluida.status, 200);
    assert.deepEqual(await concluida.json(), esperada);
  }

  const ausente = await fetch(`${api}/tarefas/inexistente/concluir`, { method: 'PATCH' });
  assert.equal(ausente.status, 404);
  assert.deepEqual(await ausente.json(), { erro: 'Tarefa não encontrada.' });

  const lista = await fetch(`${api}/tarefas`);
  assert.deepEqual(await lista.json(), [{ id: 'tarefa-1', titulo, status: 'pendente' }, esperada]);
});

test('rejeita JSON inválido, formato inválido, título vazio e corpo grande', async (contexto) => {
  const api = await iniciarApi(contexto);
  const entradas = [
    { corpo: '{', status: 400, erro: 'Envie um JSON com o campo titulo em texto.' },
    { corpo: '{"titulo":1}', status: 400, erro: 'Envie um JSON com o campo titulo em texto.' },
    { corpo: '{"titulo":"  "}', status: 400, erro: 'O título da tarefa é obrigatório.' },
    { corpo: JSON.stringify({ titulo: 'a'.repeat(8192) }), status: 413, erro: 'Corpo maior que 8 KiB.' },
  ];

  for (const entrada of entradas) {
    const resposta = await fetch(`${api}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: entrada.corpo,
    });
    assert.equal(resposta.status, entrada.status);
    assert.deepEqual(await resposta.json(), { erro: entrada.erro });
  }

  const lista = await fetch(`${api}/tarefas`);
  assert.deepEqual(await lista.json(), []);
});

test('distingue rota inexistente de método não permitido', async (contexto) => {
  const api = await iniciarApi(contexto);

  const outraRota = await fetch(`${api}/outra-rota`);
  assert.equal(outraRota.status, 404);
  assert.deepEqual(await outraRota.json(), { erro: 'Rota não encontrada.' });

  const outroMetodo = await fetch(`${api}/tarefas`, { method: 'PUT' });
  assert.equal(outroMetodo.status, 405);
  assert.equal(outroMetodo.headers.get('Allow'), 'GET, POST');
  assert.deepEqual(await outroMetodo.json(), { erro: 'Método não permitido.' });

  const concluirComGet = await fetch(`${api}/tarefas/tarefa-1/concluir`);
  assert.equal(concluirComGet.status, 405);
  assert.equal(concluirComGet.headers.get('Allow'), 'PATCH');
  assert.deepEqual(await concluirComGet.json(), { erro: 'Método não permitido.' });
});
