import type { DatabaseSync } from 'node:sqlite';

export function prepararBancoSqlite(banco: DatabaseSync): void {
  banco.exec('BEGIN IMMEDIATE');
  try {
    const colunas = banco.prepare('PRAGMA table_info(tarefas)').all();
    const formatoAntigo = colunas.length > 0 && !colunas.some(({ name }) => name === 'id_tarefa');
    if (formatoAntigo) {
      banco.exec('ALTER TABLE tarefas RENAME TO tarefas_aula_3');
    }

    banco.exec(`
      CREATE TABLE IF NOT EXISTS tarefas (
        id INTEGER PRIMARY KEY,
        id_tarefa TEXT NOT NULL UNIQUE,
        titulo TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pendente', 'concluida'))
      ) STRICT
    `);

    banco.exec(`
      CREATE TABLE IF NOT EXISTS outbox (
        id INTEGER PRIMARY KEY,
        tipo TEXT NOT NULL,
        tarefa_id TEXT NOT NULL,
        publicado INTEGER NOT NULL DEFAULT 0 CHECK (publicado IN (0, 1))
      ) STRICT
    `);

    const colunasOutbox = banco.prepare('PRAGMA table_info(outbox)').all();
    if (!colunasOutbox.some(({ name }) => name === 'publicado')) {
      banco.exec('ALTER TABLE outbox ADD COLUMN publicado INTEGER NOT NULL DEFAULT 0 CHECK (publicado IN (0, 1))');
    }

    if (formatoAntigo) {
      banco.exec(`
        INSERT INTO tarefas (id, id_tarefa, titulo, status)
        SELECT id, 'legado-' || id, titulo, 'pendente' FROM tarefas_aula_3;
        DROP TABLE tarefas_aula_3;
      `);
    }

    banco.exec('COMMIT');
  } catch (erro) {
    banco.exec('ROLLBACK');
    throw erro;
  }
}
