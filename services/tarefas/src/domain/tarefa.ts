export type Tarefa = Readonly<{
  id: string;
  titulo: string;
  status: 'pendente' | 'concluida';
}>;

export class TituloInvalido extends Error {}

export function criarTarefa(id: string, titulo: string): Tarefa {
  if (typeof titulo !== 'string' || titulo.trim() === '') {
    throw new TituloInvalido('O título da tarefa é obrigatório.');
  }

  return { id, titulo: titulo.trim(), status: 'pendente' };
}

export function marcarComoConcluida(tarefa: Tarefa): Tarefa {
  return { ...tarefa, status: 'concluida' };
}
