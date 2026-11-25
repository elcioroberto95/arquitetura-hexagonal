import type { PublicadorDeEventos } from '../application/ports/publicador-de-eventos.ts';

export const eventosNoConsole: PublicadorDeEventos = {
  publicar(evento) {
    console.log(JSON.stringify(evento));
  },
};
