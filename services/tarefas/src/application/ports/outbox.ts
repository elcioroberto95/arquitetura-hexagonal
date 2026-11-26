import type { TarefaConcluida } from '../../domain/tarefa-concluida.ts';

export interface Outbox {
  listarPendentes(): { id: number; evento: TarefaConcluida }[];
  marcarComoPublicado(id: number): void;
}
