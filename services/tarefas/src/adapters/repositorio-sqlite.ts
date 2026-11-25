import type { DatabaseSync } from 'node:sqlite';
import type { RepositorioDeTarefas } from '../application/ports/repositorio-de-tarefas.ts';

export function criarRepositorioSqlite(banco: DatabaseSync): RepositorioDeTarefas {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY,
      titulo TEXT NOT NULL
    ) STRICT
  `);

  const inserir = banco.prepare('INSERT INTO tarefas (titulo) VALUES (?)');
  const selecionar = banco.prepare('SELECT titulo FROM tarefas ORDER BY id');

  return {
    salvar(tarefa) {
      inserir.run(tarefa.titulo);
    },

    listar() {
      return selecionar.all().map(({ titulo }) => {
        if (typeof titulo !== 'string') {
          throw new Error('O SQLite retornou um título fora do formato esperado.');
        }
        return { titulo };
      });
    },
  };
}
