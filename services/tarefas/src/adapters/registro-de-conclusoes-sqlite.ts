import type { DatabaseSync } from 'node:sqlite';
import type { RegistroDeConclusoes } from '../application/ports/registro-de-conclusoes.ts';

export function criarRegistroDeConclusoesSqlite(banco: DatabaseSync): RegistroDeConclusoes {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS conclusoes (
      tarefa_id TEXT PRIMARY KEY
    ) STRICT
  `);
  const inserir = banco.prepare(`
    INSERT INTO conclusoes (tarefa_id) VALUES (?)
    ON CONFLICT (tarefa_id) DO NOTHING
  `);

  return {
    registrar(tarefaId) {
      return Boolean(inserir.run(tarefaId).changes);
    },
  };
}
