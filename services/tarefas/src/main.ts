import { stdin, stdout } from 'node:process';
import { criarRepositorioEmMemoria } from './adapters/repositorio-em-memoria.ts';
import { executarTerminal } from './adapters/terminal.ts';
import { criarCasosDeUsoDeTarefas } from './application/tarefas.ts';

const repositorio = criarRepositorioEmMemoria();
const tarefas = criarCasosDeUsoDeTarefas(repositorio);

await executarTerminal(tarefas, stdin, stdout);
