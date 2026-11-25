import { criarTarefa } from '../domain/tarefa.ts';
import type { CasosDeUsoDeTarefas } from './ports/casos-de-uso-de-tarefas.ts';
import type { RepositorioDeTarefas } from './ports/repositorio-de-tarefas.ts';

export function criarCasosDeUsoDeTarefas(
  repositorio: RepositorioDeTarefas,
): CasosDeUsoDeTarefas {
  return {
    adicionarTarefa(titulo) {
      const tarefa = criarTarefa(titulo);
      repositorio.salvar(tarefa);
      return tarefa;
    },

    listarTarefas() {
      return repositorio.listar();
    },
  };
}
