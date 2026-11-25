import type { Tarefa } from '../../domain/tarefa.ts';

export interface RepositorioDeTarefas {
  salvar(tarefa: Tarefa): void;
  /** Retorna as tarefas na ordem em que foram salvas. */
  listar(): Tarefa[];
  buscarPorId(id: string): Tarefa | undefined;
  /** Retorna true quando o status foi alterado e false quando já tinha o valor pedido. */
  atualizarStatus(id: string, status: Tarefa['status']): boolean;
}
