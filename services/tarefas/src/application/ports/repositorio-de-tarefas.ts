import type { Tarefa } from '../../domain/tarefa.ts';

export interface RepositorioDeTarefas {
  salvar(tarefa: Tarefa): void;
  /** Retorna as tarefas na ordem em que foram salvas. */
  listar(): Tarefa[];
}
