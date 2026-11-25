# Arquitetura hexagonal

Monorepo de estudos. Cada aula evolui um projeto pequeno e pode ser revisada em uma PR própria.

## Aula 1 · Portas e adaptadores

Na [aula da lista de tarefas](services/tarefas/README.md), você vai seguir um comando do terminal até o armazenamento, localizar as portas em TypeScript e revisar o que aprendeu com perguntas e respostas.

## Aula 2 · Um adaptador HTTP

Na [aula do adaptador HTTP](services/tarefas/aulas/02-http/README.md), você vai criar e listar tarefas por HTTP usando a mesma porta de entrada do terminal.

## Aula 3 · Um adaptador de saída com SQLite

Na [aula do SQLite](services/tarefas/aulas/03-sqlite/README.md), você vai trocar o repositório em memória por um banco em arquivo e conferir se as tarefas sobrevivem ao reinício do servidor.

## Aula 4 · Identidade e estado de uma tarefa

Na [aula sobre concluir tarefas](services/tarefas/aulas/04-concluir-tarefa/README.md), você vai concluir por ID uma de duas tarefas com o mesmo título e seguir a mudança de estado pelo código.

## Aula 5 · Título como objeto de valor

Na [aula sobre objetos de valor](services/tarefas/aulas/05-objeto-de-valor/README.md), você vai comparar títulos pelo conteúdo e acompanhar como o HTTP e o SQLite convertem esse valor em texto.

## Aula 6 · Evento de domínio

Na [aula sobre eventos de domínio](services/tarefas/aulas/06-evento-de-dominio/README.md), você vai concluir uma tarefa e acompanhar como o evento `TarefaConcluida` chega ao console.
