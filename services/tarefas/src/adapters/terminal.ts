import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import type { CasosDeUsoDeTarefas } from '../application/ports/casos-de-uso-de-tarefas.ts';
import { TituloInvalido } from '../domain/tarefa.ts';

export async function executarTerminal(
  tarefas: CasosDeUsoDeTarefas,
  entrada: Readable,
  saida: Writable,
): Promise<void> {
  const linhas = createInterface({ input: entrada, crlfDelay: Infinity });
  saida.write('Comandos: adicionar <título>, listar, sair\n');

  for await (const linha of linhas) {
    const comando = linha.trim();

    if (comando === 'sair') {
      break;
    }

    if (comando === 'listar') {
      const lista = tarefas.listarTarefas();
      if (lista.length === 0) {
        saida.write('Nenhuma tarefa cadastrada.\n');
      }
      for (const tarefa of lista) {
        saida.write(`- ${tarefa.titulo}\n`);
      }
      continue;
    }

    const [acao, ...palavras] = comando.split(' ');
    if (acao === 'adicionar') {
      try {
        const tarefa = tarefas.adicionarTarefa(palavras.join(' '));
        saida.write(`Tarefa adicionada: ${tarefa.titulo}\n`);
      } catch (erro) {
        if (!(erro instanceof TituloInvalido)) {
          throw erro;
        }
        saida.write(`${erro.message}\n`);
      }
      continue;
    }

    if (comando !== '') {
      saida.write('Comando desconhecido.\n');
    }
  }
}
