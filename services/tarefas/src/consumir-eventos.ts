import { stdin } from 'node:process';
import { createInterface } from 'node:readline';
import { DatabaseSync } from 'node:sqlite';
import { criarRegistroDeConclusoesSqlite } from './adapters/registro-de-conclusoes-sqlite.ts';
import { consumirTarefaConcluida } from './application/consumir-tarefa-concluida.ts';
import type { TarefaConcluida } from './domain/tarefa-concluida.ts';

function lerEvento(linha: string): TarefaConcluida {
  const dados: unknown = JSON.parse(linha);
  if (
    typeof dados !== 'object' || dados === null
    || !('tipo' in dados) || dados.tipo !== 'TarefaConcluida'
    || !('tarefaId' in dados) || typeof dados.tarefaId !== 'string'
  ) {
    throw new Error('A entrada deve conter um evento TarefaConcluida com tarefaId em texto.');
  }
  return { tipo: dados.tipo, tarefaId: dados.tarefaId };
}

const banco = new DatabaseSync('conclusoes.sqlite', { timeout: 5000 });
try {
  const registro = criarRegistroDeConclusoesSqlite(banco);
  const linhas = createInterface({ input: stdin, crlfDelay: Infinity });
  for await (const linha of linhas) {
    if (!linha.trim()) {
      continue;
    }
    const evento = lerEvento(linha);
    const registrada = consumirTarefaConcluida(evento, registro);
    const resultado = registrada ? 'Conclusão registrada' : 'Conclusão já registrada';
    console.log(`${resultado} para ${evento.tarefaId}.`);
  }
} finally {
  banco.close();
}
