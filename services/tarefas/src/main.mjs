import { stdin, stdout } from 'node:process';
import { criarRepositorioEmMemoria } from './adapters/repositorio-em-memoria.mjs';
import { executarTerminal } from './adapters/terminal.mjs';
import { criarCasosDeUsoDeTarefas } from './application/tarefas.mjs';

const repositorio = criarRepositorioEmMemoria();
const tarefas = criarCasosDeUsoDeTarefas(repositorio);

await executarTerminal(tarefas, stdin, stdout);
