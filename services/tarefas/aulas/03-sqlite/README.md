# Aula 3 · Um adaptador de saída com SQLite

Na [Aula 2](../02-http/README.md), trocamos o jeito de entrar no serviço. Agora vamos trocar o jeito de **guardar** as tarefas. Você vai usar os mesmos comandos HTTP e conferir que a lista sobrevive ao reinício.

## 1. Crie uma tarefa e reinicie o servidor

Na raiz do repositório, abra um terminal e rode estes comandos usando Node.js 22.18+ na linha 22, ou Node.js 24 ou superior. O SQLite vem no módulo `node:sqlite` do próprio Node.js. [Documentação do módulo SQLite](https://nodejs.org/download/release/v22.18.0/docs/api/sqlite.html)

```sh
cd services/tarefas
npm ci
npm run start:http:sqlite
```

Em outro PowerShell, crie e liste a tarefa com as mesmas rotas da Aula 2.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'

Invoke-WebRequest $api -UseBasicParsing -Method Post -ContentType 'application/json' `
  -Body '{"titulo":"Revisar persistencia"}' | Select-Object StatusCode, Content

Invoke-WebRequest $api -UseBasicParsing | Select-Object StatusCode, Content
```

Pare o servidor com `Ctrl+C`, rode `npm run start:http:sqlite` de novo e repita **só o `GET`**. A tarefa continua na lista porque o banco leu o mesmo arquivo `services/tarefas/tarefas.sqlite`.

Para comparar, pare o servidor e rode `npm run start:http`. Esse comando usa o repositório em memória da Aula 2 e começa com uma lista vazia.

## 2. Siga a troca no código

1. `main-http.ts` lê a opção `--sqlite` do comando desta aula e passa o repositório escolhido para `criarCasosDeUsoDeTarefas`. [Inicialização do HTTP](../../src/main-http.ts)
2. A aplicação continua usando `salvar(tarefa)` e `listar()`. Esses métodos formam a **porta de saída** `RepositorioDeTarefas`. [Porta de saída](../../src/application/ports/repositorio-de-tarefas.ts)
3. O adaptador SQLite traduz `salvar` em um `INSERT` e `listar` em um `SELECT`. Ele recria a forma `{ titulo }` esperada pela aplicação e devolve as tarefas na ordem em que foram salvas, como pede a porta. [Adaptador SQLite](../../src/adapters/repositorio-sqlite.ts)

O SQLite usa uma coluna `id` para ordenar as linhas. Uma tarefa, no modelo desta aula, continua sendo representada pelo seu `titulo`. A estrutura da tabela fica no adaptador, e a regra do título obrigatório continua em `criarTarefa`. [Domínio](../../src/domain/tarefa.ts)

## 3. Perguntas e respostas

<details>
<summary>1. Hexagonal · Qual porta permite trocar o repositório em memória por SQLite?</summary>

A porta de saída `RepositorioDeTarefas`. A aplicação conhece `salvar` e `listar`. O `main-http.ts` escolhe quem vai implementar essas operações na execução.

</details>

<details>
<summary>2. Hexagonal · Onde você procuraria o código que ordena as tarefas no banco?</summary>

No adaptador `repositorio-sqlite.ts`. A porta pede ordem de criação. O adaptador cumpre essa parte do contrato com `ORDER BY id`.

</details>

<details>
<summary>3. DDD · Onde você mudaria a regra se toda tarefa precisasse de um título de pelo menos três caracteres?</summary>

Em `criarTarefa`, no domínio. É uma regra do que vale como tarefa, então precisa valer com qualquer entrada e qualquer repositório.

</details>

<details>
<summary>4. DDD · O que o título representa no modelo? Qual é o papel do id nesta aula?</summary>

O título descreve a tarefa para quem usa o serviço. O `id` que aparece no SQL serve para ordenar as linhas do banco. Por enquanto, as operações do serviço falam só do título da tarefa.

</details>

## 4. Confira na review

Compare os dois repositórios. Ambos cumprem a mesma porta e a aplicação pode receber qualquer um deles. O teste do SQLite salva tarefas, fecha o banco e abre o mesmo arquivo para conferir a persistência e a ordem. [Teste do SQLite](../../test/repositorio-sqlite.test.ts)

Na pasta `services/tarefas`, rode a checagem de tipos e os testes.

```sh
npm run check
npm test
```
