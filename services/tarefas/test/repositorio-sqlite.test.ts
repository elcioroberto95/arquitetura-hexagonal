import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { criarRepositorioSqlite } from '../src/adapters/repositorio-sqlite.ts';
import { criarCasosDeUsoDeTarefas } from '../src/application/tarefas.ts';

test('mantém as tarefas na ordem de criação ao reabrir o banco', (contexto) => {
  const pasta = mkdtempSync(join(tmpdir(), 'hexagonal-tarefas-'));
  const caminho = join(pasta, 'tarefas.sqlite');
  contexto.after(() => {
    rmSync(caminho, { force: true });
    rmdirSync(pasta);
  });

  const banco = new DatabaseSync(caminho);
  try {
    const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioSqlite(banco));
    assert.deepEqual(tarefas.listarTarefas(), []);
    tarefas.adicionarTarefa("  Revisar o exemplo d'água  ");
    tarefas.adicionarTarefa('Estudar SQLite');
    tarefas.adicionarTarefa('Estudar SQLite');
  } finally {
    banco.close();
  }

  const bancoReaberto = new DatabaseSync(caminho);
  try {
    const tarefas = criarCasosDeUsoDeTarefas(criarRepositorioSqlite(bancoReaberto));
    assert.deepEqual(tarefas.listarTarefas(), [
      { titulo: "Revisar o exemplo d'água" },
      { titulo: 'Estudar SQLite' },
      { titulo: 'Estudar SQLite' },
    ]);
  } finally {
    bancoReaberto.close();
  }
});
