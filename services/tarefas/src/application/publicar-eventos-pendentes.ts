import type { Outbox } from './ports/outbox.ts';
import type { PublicadorDeEventos } from './ports/publicador-de-eventos.ts';

export function publicarEventosPendentes(outbox: Outbox, publicador: PublicadorDeEventos): void {
  for (const { id, evento } of outbox.listarPendentes()) {
    publicador.publicar(evento);
    outbox.marcarComoPublicado(id);
  }
}
