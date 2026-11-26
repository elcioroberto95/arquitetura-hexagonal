import type { Tarefa } from '../../domain/tarefa.ts';
import type { TarefaConcluida } from '../../domain/tarefa-concluida.ts';

export interface RepositorioDeTarefas {
  salvar(tarefa: Tarefa): void;
  /** Retorna as tarefas na ordem em que foram salvas. */
  listar(): Tarefa[];
  buscarPorId(id: string): Tarefa | undefined;
  /** Retorna se houve mudança. No armazenamento persistente, grava o evento da mudança junto com o status. */
  atualizarStatus(id: string, status: Tarefa['status'], evento?: TarefaConcluida): boolean;
}
