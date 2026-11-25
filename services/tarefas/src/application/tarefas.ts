import { criarTarefa, marcarComoConcluida } from '../domain/tarefa.ts';
import type { CasosDeUsoDeTarefas } from './ports/casos-de-uso-de-tarefas.ts';
import type { RepositorioDeTarefas } from './ports/repositorio-de-tarefas.ts';

export function criarCasosDeUsoDeTarefas(
  repositorio: RepositorioDeTarefas,
  gerarId: () => string,
): CasosDeUsoDeTarefas {
  return {
    adicionarTarefa(titulo) {
      const tarefa = criarTarefa(gerarId(), titulo);
      repositorio.salvar(tarefa);
      return tarefa;
    },

    listarTarefas() {
      return repositorio.listar();
    },

    concluirTarefa(id) {
      const tarefa = repositorio.buscarPorId(id);
      if (!tarefa) {
        return undefined;
      }

      const concluida = marcarComoConcluida(tarefa);
      repositorio.atualizarStatus(concluida.id, concluida.status);
      return concluida;
    },
  };
}
