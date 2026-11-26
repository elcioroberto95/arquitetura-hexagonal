import { DatabaseSync } from 'node:sqlite';
import { criarOutboxSqlite } from './adapters/outbox-sqlite.ts';
import { criarRegistroDeConclusoesSqlite } from './adapters/registro-de-conclusoes-sqlite.ts';
import { consumirTarefaConcluida } from './application/consumir-tarefa-concluida.ts';
import type { PublicadorDeEventos } from './application/ports/publicador-de-eventos.ts';
import { publicarEventosPendentes } from './application/publicar-eventos-pendentes.ts';

const bancoTarefas = new DatabaseSync('tarefas.sqlite', { timeout: 5000 });
try {
  const outbox = criarOutboxSqlite(bancoTarefas);
  const bancoConclusoes = new DatabaseSync('conclusoes.sqlite', { timeout: 5000 });
  try {
    const registro = criarRegistroDeConclusoesSqlite(bancoConclusoes);
    const publicadorLocal: PublicadorDeEventos = {
      publicar(evento) {
        consumirTarefaConcluida(evento, registro);
      },
    };
    publicarEventosPendentes(outbox, publicadorLocal);
  } finally {
    bancoConclusoes.close();
  }
} finally {
  bancoTarefas.close();
}
