export class TituloInvalido extends Error {}

export function criarTarefa(titulo) {
  if (typeof titulo !== 'string' || titulo.trim() === '') {
    throw new TituloInvalido('O título da tarefa é obrigatório.');
  }

  return { titulo: titulo.trim() };
}
