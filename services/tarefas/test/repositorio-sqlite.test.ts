import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { criarRepositorioSqlite } from '../src/adapters/repositorio-sqlite.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';
import type { Tarefa } from '../src/domain/tarefa.ts';

function comTituloEmTexto(tarefa: Tarefa) {
  return { ...tarefa, titulo: tarefa.titulo.valor };
}

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
    const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioSqlite(bancoReaberto), gerarId);
    assert.deepEqual(tarefas.listarTarefas().map(comTituloEmTexto), [
      { id: 'tarefa-1', titulo: "Revisar o exemplo d'água", status: 'pendente' },
      { id: 'tarefa-2', titulo: 'Estudar SQLite', status: 'pendente' },
      { id: 'tarefa-3', titulo: 'Estudar SQLite', status: 'concluida' },
    ]);
  } finally {
    bancoReaberto.close();
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
