import type { RepositorioDeTarefas } from '../application/ports/repositorio-de-tarefas.ts';
import type { Tarefa } from '../domain/tarefa.ts';

export function criarRepositorioEmMemoria(): RepositorioDeTarefas {
  const tarefas = new Map<string, Tarefa>();

  return {
    salvar(tarefa) {
      if (tarefas.has(tarefa.id)) {
        throw new Error(`Já existe uma tarefa com o ID ${tarefa.id}.`);
      }
      tarefas.set(tarefa.id, { ...tarefa });
    },

    listar() {
      return Array.from(tarefas.values(), (tarefa) => ({ ...tarefa }));
    },

    buscarPorId(id) {
      const tarefa = tarefas.get(id);
      return tarefa && { ...tarefa };
    },

    atualizarStatus(id, status) {
      const tarefa = tarefas.get(id);
      if (!tarefa) {
        throw new Error(`Tarefa ${id} não encontrada para atualização.`);
      }
      tarefas.set(id, { ...tarefa, status });
    },
  };
}
