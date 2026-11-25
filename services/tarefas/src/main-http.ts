import { DatabaseSync } from 'node:sqlite';
import { criarServidorHttp } from './adapters/http.ts';
import { criarRepositorioEmMemoria } from './adapters/repositorio-em-memoria.ts';
import { criarRepositorioSqlite } from './adapters/repositorio-sqlite.ts';
import { criarCasosDeUsoDeTarefas } from './application/tarefas.ts';

const banco = process.argv.includes('--sqlite') ? new DatabaseSync('tarefas.sqlite') : undefined;
const repositorio = banco ? criarRepositorioSqlite(banco) : criarRepositorioEmMemoria();
const tarefas = criarCasosDeUsoDeTarefas(repositorio);
const servidor = criarServidorHttp(tarefas);

if (banco) {
  servidor.once('close', () => banco.close());
  process.once('SIGINT', () => servidor.close());
  process.once('SIGTERM', () => servidor.close());
}

servidor.listen(3000, '127.0.0.1', () => {
  console.log('API de tarefas em http://127.0.0.1:3000/tarefas');
});
