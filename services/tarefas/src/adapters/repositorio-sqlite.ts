import type { DatabaseSync } from 'node:sqlite';
import type { RepositorioDeTarefas } from '../application/ports/repositorio-de-tarefas.ts';
import type { Tarefa } from '../domain/tarefa.ts';
import { TituloTarefa } from '../domain/titulo-tarefa.ts';
import { prepararBancoSqlite } from './banco-sqlite.ts';

export function criarRepositorioSqlite(banco: DatabaseSync): RepositorioDeTarefas {
  prepararBancoSqlite(banco);

  const inserir = banco.prepare('INSERT INTO tarefas (id_tarefa, titulo, status) VALUES (?, ?, ?)');
  const selecionar = banco.prepare('SELECT id_tarefa, titulo, status FROM tarefas ORDER BY id');
  const buscar = banco.prepare('SELECT id_tarefa, titulo, status FROM tarefas WHERE id_tarefa = ?');
  const atualizar = banco.prepare('UPDATE tarefas SET status = ? WHERE id_tarefa = ? AND status <> ?');
  const registrarEvento = banco.prepare('INSERT INTO outbox (tipo, tarefa_id) VALUES (?, ?)');

  return {
    salvar(tarefa) {
      inserir.run(tarefa.id, tarefa.titulo.valor, tarefa.status);
    },

    listar() {
      return selecionar.all().map(lerTarefa);
    },

    buscarPorId(id) {
      const linha = buscar.get(id);
      return linha && lerTarefa(linha);
    },

    atualizarStatus(id, status, evento) {
      banco.exec('BEGIN IMMEDIATE');
      try {
        const mudou = Boolean(atualizar.run(status, id, status).changes);
        if (!mudou && !buscar.get(id)) {
          throw new Error(`Tarefa ${id} não encontrada para atualização.`);
        }
        if (mudou && evento) {
          registrarEvento.run(evento.tipo, evento.tarefaId);
        }
        banco.exec('COMMIT');
        return mudou;
      } catch (erro) {
        banco.exec('ROLLBACK');
        throw erro;
      }
    },
  };
}

function lerTarefa({ id_tarefa: id, titulo, status }: Record<string, unknown>): Tarefa {
  if (typeof id !== 'string' || typeof titulo !== 'string' || (status !== 'pendente' && status !== 'concluida')) {
    throw new Error('O SQLite retornou uma tarefa fora do formato esperado.');
  }
  try {
    return { id, titulo: TituloTarefa.criar(titulo), status };
  } catch (erro) {
    throw new Error('O SQLite retornou um título inválido.', { cause: erro });
  }
}
