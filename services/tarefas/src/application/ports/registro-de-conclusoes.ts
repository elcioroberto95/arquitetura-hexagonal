export interface RegistroDeConclusoes {
  /** Retorna true se esta foi a primeira vez que a conclusão foi registrada. */
  registrar(tarefaId: string): boolean;
}
