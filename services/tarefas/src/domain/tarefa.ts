import { TituloTarefa } from './titulo-tarefa.ts';

export type Tarefa = Readonly<{
  id: string;
  titulo: TituloTarefa;
  status: 'pendente' | 'concluida';
}>;

export function criarTarefa(id: string, titulo: string): Tarefa {
  return { id, titulo: TituloTarefa.criar(titulo), status: 'pendente' };
}

export function marcarComoConcluida(tarefa: Tarefa): Tarefa {
  return { ...tarefa, status: 'concluida' };
}
