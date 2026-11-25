import type { TarefaConcluida } from '../../domain/tarefa-concluida.ts';

export interface PublicadorDeEventos {
  publicar(evento: TarefaConcluida): void;
}
