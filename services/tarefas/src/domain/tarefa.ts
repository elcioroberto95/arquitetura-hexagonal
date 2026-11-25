import { TituloTarefa } from './titulo-tarefa.ts';
import type { TarefaConcluida } from './tarefa-concluida.ts';

export type Tarefa = Readonly<{
  id: string;
  titulo: TituloTarefa;
  status: 'pendente' | 'concluida';
}>;

export function criarTarefa(id: string, titulo: string): Tarefa {
  return { id, titulo: TituloTarefa.criar(titulo), status: 'pendente' };
}

export function marcarComoConcluida(tarefa: Tarefa): { tarefa: Tarefa; evento?: TarefaConcluida } {
  if (tarefa.status === 'concluida') {
    return { tarefa };
  }

  return {
    tarefa: { ...tarefa, status: 'concluida' },
    evento: { tipo: 'TarefaConcluida', tarefaId: tarefa.id },
  };
}
