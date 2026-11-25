import { criarServidorHttp } from './adapters/http.ts';
import { criarRepositorioEmMemoria } from './adapters/repositorio-em-memoria.ts';
import { criarCasosDeUsoDeTarefas } from './application/tarefas.ts';

const repositorio = criarRepositorioEmMemoria();
const tarefas = criarCasosDeUsoDeTarefas(repositorio);
const servidor = criarServidorHttp(tarefas);

servidor.listen(3000, '127.0.0.1', () => {
  console.log('API de tarefas em http://127.0.0.1:3000/tarefas');
});
