import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { criarOutboxSqlite } from '../src/adapters/outbox-sqlite.ts';
import { criarRegistroDeConclusoesSqlite } from '../src/adapters/registro-de-conclusoes-sqlite.ts';
import { criarRepositorioSqlite } from '../src/adapters/repositorio-sqlite.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';

test('consumir o mesmo evento após reiniciar mantém uma conclusão por tarefa', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'hexagonal-conclusoes-'));
  const arquivo = join(pasta, 'conclusoes.sqlite');
  const comando = fileURLToPath(new URL('../src/consumir-eventos.ts', import.meta.url));

  function consumir(...ids: string[]): string {
    const entrada = ids.map((tarefaId) => JSON.stringify({ tipo: 'TarefaConcluida', tarefaId })).join('\n');
    const resultado = spawnSync(process.execPath, [comando], { cwd: pasta, input: entrada, encoding: 'utf8' });
    assert.equal(resultado.status, 0, resultado.stderr);
    return resultado.stdout;
  }

  try {
    assert.match(consumir('tarefa-1'), /Conclusão registrada para tarefa-1/);
    const saida = consumir('tarefa-1', 'tarefa-2');
    assert.match(saida, /Conclusão já registrada para tarefa-1/);
    assert.match(saida, /Conclusão registrada para tarefa-2/);

    const banco = new DatabaseSync(arquivo, { readOnly: true });
    try {
      const linhas = banco.prepare('SELECT tarefa_id FROM conclusoes ORDER BY tarefa_id').all();
      assert.deepEqual(linhas.map(({ tarefa_id }) => tarefa_id), ['tarefa-1', 'tarefa-2']);
    } finally {
      banco.close();
    }
  } finally {
    rmSync(arquivo, { force: true });
    rmdirSync(pasta);
  }
});

test('agenda nova tentativa após falha e confirma a outbox depois que o consumidor grava', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'hexagonal-entrega-'));
  const arquivoTarefas = join(pasta, 'tarefas.sqlite');
  const arquivoConclusoes = join(pasta, 'conclusoes.sqlite');
  const comando = fileURLToPath(new URL('../src/entregar-outbox.ts', import.meta.url));
  const bancoTarefas = new DatabaseSync(arquivoTarefas);
  const bancoConclusoes = new DatabaseSync(arquivoConclusoes);

  function entregar() {
    return spawnSync(process.execPath, [comando], { cwd: pasta, encoding: 'utf8' });
  }

  try {
    const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioSqlite(bancoTarefas), () => 'tarefa-1');
    tarefas.concluirTarefa(tarefas.adicionarTarefa('Confirmar a entrega').id);
    criarRegistroDeConclusoesSqlite(bancoConclusoes);
    const linhaOutbox = bancoTarefas.prepare('SELECT publicado, falhas, proxima_tentativa_em FROM outbox');
    const totalConclusoes = bancoConclusoes.prepare('SELECT COUNT(*) AS total FROM conclusoes');

    bancoConclusoes.exec(`
      CREATE TRIGGER rejeitar_registro BEFORE INSERT ON conclusoes
      BEGIN
        SELECT RAISE(ABORT, 'falha no consumidor');
      END
    `);
    const inicioDaTentativa = Date.now();
    const falhaNoRegistro = entregar();
    assert.equal(falhaNoRegistro.status, 1);
    assert.match(falhaNoRegistro.stderr, /falha no consumidor/);
    const pendente = linhaOutbox.get();
    assert.equal(pendente?.publicado, 0);
    assert.equal(pendente?.falhas, 1);
    const horario = pendente.proxima_tentativa_em;
    assert.ok(typeof horario === 'number' && horario >= inicioDaTentativa + 30_000);
    assert.equal(totalConclusoes.get()?.total, 0);

    bancoConclusoes.exec('DROP TRIGGER rejeitar_registro');
    const outbox = criarOutboxSqlite(bancoTarefas);
    assert.deepEqual(outbox.listarPendentes(horario - 1), []);
    assert.equal(outbox.listarPendentes(horario)[0]?.evento.tarefaId, 'tarefa-1');
    const antesDoHorario = entregar();
    assert.equal(antesDoHorario.status, 0, antesDoHorario.stderr);
    assert.equal(totalConclusoes.get()?.total, 0);
    assert.deepEqual(linhaOutbox.get(), pendente);

    // Simula o fim da espera no banco temporário para exercitar o comando sem um temporizador.
    bancoTarefas.exec('UPDATE outbox SET proxima_tentativa_em = 0');
    bancoTarefas.exec(`
      CREATE TRIGGER rejeitar_confirmacao BEFORE UPDATE OF publicado ON outbox
      BEGIN
        SELECT RAISE(ABORT, 'falha na marcacao');
      END
    `);
    const falhaNaMarcacao = entregar();
    assert.equal(falhaNaMarcacao.status, 1);
    assert.match(falhaNaMarcacao.stderr, /falha na marcacao/);
    assert.equal(linhaOutbox.get()?.publicado, 0);
    assert.equal(linhaOutbox.get()?.falhas, 1);
    assert.equal(totalConclusoes.get()?.total, 1);

    bancoTarefas.exec('DROP TRIGGER rejeitar_confirmacao');
    const novaTentativa = entregar();
    assert.equal(novaTentativa.status, 0, novaTentativa.stderr);
    assert.equal(linhaOutbox.get()?.publicado, 1);
    assert.equal(linhaOutbox.get()?.falhas, 1);
    assert.equal(totalConclusoes.get()?.total, 1);
  } finally {
    bancoConclusoes.close();
    bancoTarefas.close();
    rmSync(arquivoConclusoes, { force: true });
    rmSync(arquivoTarefas, { force: true });
    rmdirSync(pasta);
  }
});
