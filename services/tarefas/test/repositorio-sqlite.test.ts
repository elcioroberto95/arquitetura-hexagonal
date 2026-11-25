import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { criarOutboxSqlite } from '../src/adapters/outbox-sqlite.ts';
import { criarRepositorioSqlite } from '../src/adapters/repositorio-sqlite.ts';
import { publicarEventosPendentes } from '../src/application/publicar-eventos-pendentes.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';
import type { Tarefa } from '../src/domain/tarefa.ts';

function comTituloEmTexto(tarefa: Tarefa) {
  return { ...tarefa, titulo: tarefa.titulo.valor };
}

test('publica eventos da outbox da Aula 7 e não repete os já marcados', () => {
  const banco = new DatabaseSync(':memory:');
  try {
    banco.exec(`
      CREATE TABLE outbox (id INTEGER PRIMARY KEY, tipo TEXT NOT NULL, tarefa_id TEXT NOT NULL) STRICT;
      INSERT INTO outbox (tipo, tarefa_id) VALUES ('TarefaConcluida', 'tarefa-1'), ('TarefaConcluida', 'tarefa-2');
    `);
    const outbox = criarOutboxSqlite(banco);
    const publicados: string[] = [];
    publicarEventosPendentes(outbox, {
      publicar(evento) {
        publicados.push(evento.tarefaId);
      },
    });

    assert.deepEqual(publicados, ['tarefa-1', 'tarefa-2']);
    assert.deepEqual(criarOutboxSqlite(banco).listarPendentes(), []);
    assert.equal(banco.prepare('SELECT COUNT(*) AS total FROM outbox WHERE publicado = 1').get()?.total, 2);
  } finally {
    banco.close();
  }
});

test('deixa pendente a publicação que falhou e permite tentar novamente', () => {
  const banco = new DatabaseSync(':memory:');
  try {
    let sequencia = 0;
    const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioSqlite(banco), () => `tarefa-${++sequencia}`);
    const primeira = tarefas.adicionarTarefa('Revisar a outbox');
    const segunda = tarefas.adicionarTarefa('Testar a publicação');
    tarefas.concluirTarefa(primeira.id);
    tarefas.concluirTarefa(segunda.id);
    const outbox = criarOutboxSqlite(banco);

    assert.throws(() => publicarEventosPendentes(outbox, {
      publicar(evento) {
        if (evento.tarefaId === segunda.id) {
          throw new Error('Destino indisponível');
        }
      },
    }), /Destino indisponível/);

    assert.deepEqual(outbox.listarPendentes().map(({ evento }) => evento.tarefaId), [segunda.id]);
    const publicados: string[] = [];
    publicarEventosPendentes(outbox, {
      publicar(evento) {
        publicados.push(evento.tarefaId);
      },
    });
    assert.deepEqual(publicados, [segunda.id]);
    assert.deepEqual(outbox.listarPendentes(), []);
  } finally {
    banco.close();
  }
});

test('mantém identidade, estado e ordem de criação ao reabrir o banco', (contexto) => {
  const pasta = mkdtempSync(join(tmpdir(), 'hexagonal-tarefas-'));
  const caminho = join(pasta, 'tarefas.sqlite');
  contexto.after(() => {
    rmSync(caminho, { force: true });
    rmdirSync(pasta);
  });

  let sequencia = 0;
  const gerarId = () => `tarefa-${++sequencia}`;
  const banco = new DatabaseSync(caminho);
  try {
    const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioSqlite(banco), gerarId);
    assert.deepEqual(tarefas.listarTarefas(), []);
    tarefas.adicionarTarefa("  Revisar o exemplo d'água  ");
    tarefas.adicionarTarefa('Estudar SQLite');
    const ultima = tarefas.adicionarTarefa('Estudar SQLite');
    tarefas.concluirTarefa(ultima.id);
  } finally {
    banco.close();
  }

  const bancoReaberto = new DatabaseSync(caminho);
  try {
    const repositorio = criarRepositorioSqlite(bancoReaberto);
    const tarefas = criarCasosDeUsoDeTarefas(repositorio, gerarId);
    assert.deepEqual(tarefas.listarTarefas().map(comTituloEmTexto), [
      { id: 'tarefa-1', titulo: "Revisar o exemplo d'água", status: 'pendente' },
      { id: 'tarefa-2', titulo: 'Estudar SQLite', status: 'pendente' },
      { id: 'tarefa-3', titulo: 'Estudar SQLite', status: 'concluida' },
    ]);
    assert.equal(repositorio.atualizarStatus('tarefa-3', 'concluida'), false);
    tarefas.concluirTarefa('tarefa-3');
    const eventos = bancoReaberto.prepare('SELECT tipo, tarefa_id FROM outbox ORDER BY id').all();
    assert.deepEqual(eventos.map((evento) => ({ ...evento })), [
      { tipo: 'TarefaConcluida', tarefa_id: 'tarefa-3' },
    ]);
  } finally {
    bancoReaberto.close();
  }
});

test('reverte a conclusão se o SQLite rejeitar o registro na outbox', () => {
  const banco = new DatabaseSync(':memory:');
  try {
    const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioSqlite(banco), () => 'tarefa-1');
    const tarefa = tarefas.adicionarTarefa('Revisar a transação');
    banco.exec(`
      CREATE TRIGGER rejeitar_evento BEFORE INSERT ON outbox
      BEGIN
        SELECT RAISE(ABORT, 'falha ao registrar evento');
      END
    `);

    assert.throws(() => tarefas.concluirTarefa(tarefa.id), /falha ao registrar evento/);
    assert.equal(tarefas.listarTarefas()[0].status, 'pendente');
    assert.deepEqual(banco.prepare('SELECT id FROM outbox').all(), []);

    banco.exec('DROP TRIGGER rejeitar_evento');
    assert.equal(tarefas.concluirTarefa(tarefa.id)?.status, 'concluida');
    assert.equal(banco.prepare('SELECT id FROM outbox').all().length, 1);
  } finally {
    banco.close();
  }
});

test('preserva tarefas da Aula 3 e reaproveita seus IDs depois da migração', () => {
  const banco = new DatabaseSync(':memory:');
  try {
    banco.exec(`
      CREATE TABLE tarefas (id INTEGER PRIMARY KEY, titulo TEXT NOT NULL) STRICT;
      INSERT INTO tarefas (id, titulo) VALUES (2, 'Mesmo título'), (12, 'Mesmo título');
    `);

    const repositorio = criarRepositorioSqlite(banco);
    assert.deepEqual(repositorio.listar().map(comTituloEmTexto), [
      { id: 'legado-2', titulo: 'Mesmo título', status: 'pendente' },
      { id: 'legado-12', titulo: 'Mesmo título', status: 'pendente' },
    ]);

    const tarefas = criarCasosDeUsoDeTarefas(repositorio, () => 'nova-1');
    tarefas.concluirTarefa('legado-12');
    tarefas.adicionarTarefa('Tarefa nova');

    const repositorioReinicializado = criarRepositorioSqlite(banco);
    assert.deepEqual(repositorioReinicializado.listar().map(comTituloEmTexto), [
      { id: 'legado-2', titulo: 'Mesmo título', status: 'pendente' },
      { id: 'legado-12', titulo: 'Mesmo título', status: 'concluida' },
      { id: 'nova-1', titulo: 'Tarefa nova', status: 'pendente' },
    ]);
  } finally {
    banco.close();
  }
});
