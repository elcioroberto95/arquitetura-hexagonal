import type { DatabaseSync } from 'node:sqlite';
import type { Outbox } from '../application/ports/outbox.ts';
import { prepararBancoSqlite } from './banco-sqlite.ts';

export function criarOutboxSqlite(banco: DatabaseSync): Outbox {
  prepararBancoSqlite(banco);

  const selecionar = banco.prepare(`
    SELECT id, tipo, tarefa_id FROM outbox
    WHERE publicado = 0 AND proxima_tentativa_em <= ?
    ORDER BY id
  `);
  const marcar = banco.prepare('UPDATE outbox SET publicado = 1 WHERE id = ? AND publicado = 0');
  const registrarFalha = banco.prepare(`
    UPDATE outbox
    SET falhas = falhas + 1, proxima_tentativa_em = MAX(proxima_tentativa_em, ?)
    WHERE id = ? AND publicado = 0
  `);

  return {
    listarPendentes(agora = Date.now()) {
      return selecionar.all(agora).map(({ id, tipo, tarefa_id: tarefaId }) => {
        if (typeof id !== 'number' || tipo !== 'TarefaConcluida' || typeof tarefaId !== 'string') {
          throw new Error('O SQLite retornou um evento fora do formato esperado.');
        }
        return { id, evento: { tipo, tarefaId } };
      });
    },

    marcarComoPublicado(id) {
      marcar.run(id);
    },

    registrarFalha(id, proximaTentativaEm) {
      registrarFalha.run(proximaTentativaEm, id);
    },
  };
}
