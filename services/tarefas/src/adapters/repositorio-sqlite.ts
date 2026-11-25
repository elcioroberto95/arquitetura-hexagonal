import type { DatabaseSync } from 'node:sqlite';
import type { RepositorioDeTarefas } from '../application/ports/repositorio-de-tarefas.ts';
import type { Tarefa } from '../domain/tarefa.ts';

export function criarRepositorioSqlite(banco: DatabaseSync): RepositorioDeTarefas {
  prepararTabela(banco);

  const inserir = banco.prepare('INSERT INTO tarefas (id_tarefa, titulo, status) VALUES (?, ?, ?)');
  const selecionar = banco.prepare('SELECT id_tarefa, titulo, status FROM tarefas ORDER BY id');
  const buscar = banco.prepare('SELECT id_tarefa, titulo, status FROM tarefas WHERE id_tarefa = ?');
  const atualizar = banco.prepare('UPDATE tarefas SET status = ? WHERE id_tarefa = ?');

  return {
    salvar(tarefa) {
      inserir.run(tarefa.id, tarefa.titulo, tarefa.status);
    },

    listar() {
      return selecionar.all().map(lerTarefa);
    },

    buscarPorId(id) {
      const linha = buscar.get(id);
      return linha && lerTarefa(linha);
    },

    atualizarStatus(id, status) {
      if (!atualizar.run(status, id).changes) {
        throw new Error(`Tarefa ${id} não encontrada para atualização.`);
      }
    },
  };
}

function lerTarefa({ id_tarefa: id, titulo, status }: Record<string, unknown>): Tarefa {
  if (typeof id !== 'string' || typeof titulo !== 'string' || (status !== 'pendente' && status !== 'concluida')) {
    throw new Error('O SQLite retornou uma tarefa fora do formato esperado.');
  }
  return { id, titulo, status };
}

function prepararTabela(banco: DatabaseSync): void {
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
