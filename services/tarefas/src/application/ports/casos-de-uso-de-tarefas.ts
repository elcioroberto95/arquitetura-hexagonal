import type { Tarefa } from '../../domain/tarefa.ts';

export interface CasosDeUsoDeTarefas {
  adicionarTarefa(titulo: string): Tarefa;
  listarTarefas(): Tarefa[];
  concluirTarefa(id: string): Tarefa | undefined;
}
