import { DatabaseSync } from 'node:sqlite';
import { eventosNoConsole } from './adapters/eventos-no-console.ts';
import { criarOutboxSqlite } from './adapters/outbox-sqlite.ts';
import { publicarEventosPendentes } from './application/publicar-eventos-pendentes.ts';

const banco = new DatabaseSync('tarefas.sqlite', { timeout: 5000 });
try {
  publicarEventosPendentes(criarOutboxSqlite(banco), eventosNoConsole);
} finally {
  banco.close();
}
