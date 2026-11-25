import { criarTarefa } from '../domain/tarefa.mjs';

export function criarCasosDeUsoDeTarefas(repositorio) {
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
