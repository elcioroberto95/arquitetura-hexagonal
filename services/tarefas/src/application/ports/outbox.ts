import type { TarefaConcluida } from '../../domain/tarefa-concluida.ts';

export interface Outbox {
  listarPendentes(agora?: number): { id: number; evento: TarefaConcluida }[];
  marcarComoPublicado(id: number): void;
  registrarFalha(id: number, proximaTentativaEm: number): void;
}
