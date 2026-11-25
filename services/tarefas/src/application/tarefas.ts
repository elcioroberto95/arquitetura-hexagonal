import { criarTarefa, marcarComoConcluida } from '../domain/tarefa.ts';
import type { CasosDeUsoDeTarefas } from './ports/casos-de-uso-de-tarefas.ts';
import type { PublicadorDeEventos } from './ports/publicador-de-eventos.ts';
import type { RepositorioDeTarefas } from './ports/repositorio-de-tarefas.ts';

export function criarCasosDeUsoDeTarefas(
  repositorio: RepositorioDeTarefas,
  gerarId: () => string,
  publicador?: PublicadorDeEventos,
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

      const { tarefa: concluida, evento } = marcarComoConcluida(tarefa);
      if (evento && repositorio.atualizarStatus(concluida.id, concluida.status, evento)) {
        try {
          publicador?.publicar(evento);
        } catch {
          // A conclusão já foi salva. A publicação local é uma tentativa única.
        }
      }
      return concluida;
    },
  };
}
