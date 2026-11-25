import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CasosDeUsoDeTarefas } from '../application/ports/casos-de-uso-de-tarefas.ts';
import type { Tarefa } from '../domain/tarefa.ts';
import { TituloInvalido } from '../domain/titulo-tarefa.ts';

const LIMITE_CORPO_BYTES = 8 * 1024;

export function criarServidorHttp(tarefas: CasosDeUsoDeTarefas) {
  return createServer(async (requisicao, resposta) => {
    try {
      const caminho = requisicao.url?.split('?')[0];
      const id = caminho?.match(/^\/tarefas\/([\w-]+)\/concluir$/)?.[1];
      if (id) {
        if (requisicao.method !== 'PATCH') {
          resposta.setHeader('Allow', 'PATCH');
          responderJson(resposta, 405, { erro: 'Método não permitido.' });
          return;
        }

        const concluida = tarefas.concluirTarefa(id);
        if (!concluida) {
          responderJson(resposta, 404, { erro: 'Tarefa não encontrada.' });
          return;
        }

        responderJson(resposta, 200, tarefaParaJson(concluida));
        return;
      }

      if (caminho !== '/tarefas') {
        responderJson(resposta, 404, { erro: 'Rota não encontrada.' });
        return;
      }

      if (requisicao.method === 'GET') {
        responderJson(resposta, 200, tarefas.listarTarefas().map(tarefaParaJson));
        return;
      }

      if (requisicao.method !== 'POST') {
        resposta.setHeader('Allow', 'GET, POST');
        responderJson(resposta, 405, { erro: 'Método não permitido.' });
        return;
      }

      const corpo = await lerCorpo(requisicao);
      if (corpo === null) {
        requisicao.resume();
        responderJson(resposta, 413, { erro: 'Corpo maior que 8 KiB.' });
        return;
      }

      const titulo = extrairTitulo(corpo);
      if (titulo === undefined) {
        responderJson(resposta, 400, { erro: 'Envie um JSON com o campo titulo em texto.' });
        return;
      }

      const tarefa = tarefas.adicionarTarefa(titulo);
      responderJson(resposta, 201, tarefaParaJson(tarefa));
    } catch (erro) {
      if (erro instanceof TituloInvalido) {
        responderJson(resposta, 400, { erro: erro.message });
        return;
      }

      console.error(erro);
      responderJson(resposta, 500, { erro: 'Erro interno ao processar a requisição.' });
    }
  });
}

function tarefaParaJson({ id, titulo, status }: Tarefa) {
  return { id, titulo: titulo.valor, status };
}

async function lerCorpo(requisicao: IncomingMessage): Promise<string | null> {
  const partes: Buffer[] = [];
  let tamanho = 0;

  // Mantém a conexão aberta ao atingir o limite para poder enviar o 413.
  const fluxo = requisicao.iterator({ destroyOnReturn: false }) as AsyncIterable<Buffer>;
  for await (const parte of fluxo) {
    tamanho += parte.length;
    if (tamanho > LIMITE_CORPO_BYTES) {
      return null;
    }
    partes.push(parte);
  }

  return Buffer.concat(partes).toString('utf8');
}

function extrairTitulo(corpo: string): string | undefined {
  let dados: unknown;
  try {
    dados = JSON.parse(corpo);
  } catch {
    return undefined;
  }

  if (typeof dados === 'object' && dados !== null && 'titulo' in dados) {
    if (typeof dados.titulo === 'string') {
      return dados.titulo;
    }
  }
  return undefined;
}

function responderJson(resposta: ServerResponse, status: number, valor: unknown): void {
  const corpo = JSON.stringify(valor);
  resposta.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  resposta.end(corpo);
}
