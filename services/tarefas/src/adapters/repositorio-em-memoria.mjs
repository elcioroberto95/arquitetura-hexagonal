export function criarRepositorioEmMemoria() {
  const tarefas = [];

  return {
    salvar(tarefa) {
      tarefas.push({ ...tarefa });
    },

    listar() {
      return tarefas.map((tarefa) => ({ ...tarefa }));
    },
  };
}
