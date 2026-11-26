import type { Outbox } from './ports/outbox.ts';
import type { PublicadorDeEventos } from './ports/publicador-de-eventos.ts';

export function publicarEventosPendentes(
  outbox: Outbox,
  publicador: PublicadorDeEventos,
  esperaAposFalhaMs?: number,
): void {
  for (const { id, evento } of outbox.listarPendentes(Date.now())) {
    try {
      publicador.publicar(evento);
    } catch (erro) {
      if (esperaAposFalhaMs !== undefined) {
        outbox.registrarFalha(id, Date.now() + esperaAposFalhaMs);
      }
      throw erro;
    }
    outbox.marcarComoPublicado(id);
  }
}
