import type { RepositorioDeTarefas } from '../application/ports/repositorio-de-tarefas.ts';
import type { Tarefa } from '../domain/tarefa.ts';

export function criarRepositorioEmMemoria(): RepositorioDeTarefas {
  const tarefas: Tarefa[] = [];

  return {
    salvar(tarefa) {
      tarefas.push({ ...tarefa });
    },

    listar() {
      return tarefas.map((tarefa) => ({ ...tarefa }));
    },
  };
}
