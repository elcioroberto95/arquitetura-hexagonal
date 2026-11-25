import type { TarefaConcluida } from '../domain/tarefa-concluida.ts';
import type { RegistroDeConclusoes } from './ports/registro-de-conclusoes.ts';

export function consumirTarefaConcluida(evento: TarefaConcluida, registro: RegistroDeConclusoes): boolean {
  return registro.registrar(evento.tarefaId);
}
