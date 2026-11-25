export class TituloInvalido extends Error {}

export class TituloTarefa {
  readonly #valor: string;

  private constructor(valor: string) {
    this.#valor = valor;
  }

  static criar(texto: string): TituloTarefa {
    const valor = typeof texto === 'string' ? texto.trim() : '';
    if (valor === '') {
      throw new TituloInvalido('O título da tarefa é obrigatório.');
    }

    return new TituloTarefa(valor);
  }

  get valor(): string {
    return this.#valor;
  }

  igualA(outro: TituloTarefa): boolean {
    return this.#valor === outro.#valor;
  }
}
