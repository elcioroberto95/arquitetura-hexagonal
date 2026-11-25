# Aula 2 · Um adaptador HTTP para a lista de tarefas

Na [Aula 1](../../README.md), você usou `adicionar` e `listar` no terminal. Nesta aula, vai fazer as mesmas operações por HTTP. Observe quais partes do projeto precisaram mudar para receber os pedidos de outra forma.

## 1. Faça um pedido à API

Na raiz do repositório, abra um terminal e rode os comandos abaixo. Use Node.js 22.18+ na linha 22, ou Node.js 24 ou superior.

```sh
cd services/tarefas
npm ci
npm run start:http
```

Com o servidor rodando, execute os pedidos em outro PowerShell.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'

Invoke-WebRequest $api -UseBasicParsing | Select-Object StatusCode, Content

Invoke-WebRequest $api -UseBasicParsing -Method Post -ContentType 'application/json' `
  -Body '{"titulo":"Estudar HTTP"}' | Select-Object StatusCode, Content

Invoke-WebRequest $api -UseBasicParsing | Select-Object StatusCode, Content
```

No primeiro `GET`, você recebe `200` com `[]`. O `POST` recebe um JSON com o título e responde `201` com a tarefa criada. O segundo `GET` responde `200` com a tarefa na lista.

O comando `npm start` ainda abre o terminal da Aula 1. Cada execução cria seu próprio repositório em memória. Uma tarefa criada pelo HTTP fica disponível no processo do servidor em que foi criada.

## 2. Compare as duas entradas

| Entrada | O que recebe | O que chama na aplicação |
| --- | --- | --- |
| Terminal | `adicionar Estudar HTTP` | `adicionarTarefa('Estudar HTTP')` |
| HTTP | `POST /tarefas` com `{"titulo":"Estudar HTTP"}` | `adicionarTarefa('Estudar HTTP')` |

O adaptador HTTP lê o método e a rota, interpreta o JSON e extrai o título. A partir daí, chama a mesma operação da interface `CasosDeUsoDeTarefas` que o terminal chama. Quando o caso de uso devolve a tarefa, o HTTP escreve uma resposta JSON com status `201`. [Adaptador HTTP](../../src/adapters/http.ts) · [Porta de entrada](../../src/application/ports/casos-de-uso-de-tarefas.ts)

Abra `main-http.ts` e compare com `main.ts`. Os dois criam um repositório em memória, passam esse repositório à aplicação e entregam os casos de uso ao adaptador de entrada. No diff desta aula, procure a nova ligação e confira se havia motivo para editar `application/` ou `domain/`. [Entrada HTTP](../../src/main-http.ts) · [Entrada pelo terminal](../../src/main.ts)

## 3. Veja onde cada validação acontece

| Corpo do `POST` | Quem decide | Resposta |
| --- | --- | --- |
| `{"titulo":123}` | O adaptador HTTP verifica se o JSON tem um título em texto. | `400` com uma mensagem sobre o formato esperado. |
| `{"titulo":"  "}` | O domínio recebe um texto e verifica se ele tem conteúdo. | O adaptador transforma o erro do domínio em `400`. |

O formato da requisição depende de como você entrou no sistema. A regra de título obrigatório vale para uma tarefa criada por qualquer entrada. É por isso que o terminal e o HTTP conseguem reaproveitar a mesma regra. [Regra do título](../../src/domain/tarefa.ts)

## 4. Perguntas e respostas

<details>
<summary>1. Hexagonal · Qual porta o terminal e o HTTP usam?</summary>

A porta de entrada `CasosDeUsoDeTarefas`. Os dois adaptadores podem chamar `adicionarTarefa` e `listarTarefas`.

</details>

<details>
<summary>2. Hexagonal · Onde você mudaria a rota de /tarefas para /lista?</summary>

Em `adapters/http.ts`. O caminho faz parte da comunicação HTTP, e a rota continua chamando o mesmo caso de uso pela porta de entrada.

</details>

<details>
<summary>3. DDD · Qual regra define se uma tarefa pode ser criada sem título?</summary>

Toda tarefa precisa ter um título com conteúdo. A regra fica em `criarTarefa`, no domínio, e vale para pedidos do terminal e do HTTP. O adaptador HTTP comunica a rejeição com status `400`.

</details>

<details>
<summary>4. DDD · Como a palavra “tarefa” aparece nas conversas sobre o serviço e no código?</summary>

Você fala em adicionar uma tarefa e encontra essa ideia em `adicionarTarefa`, `criarTarefa` e `Tarefa`. Usar os mesmos termos do problema nas conversas e no código é o começo do que o DDD chama de **linguagem ubíqua**.

</details>

## 5. Confira na review

O diff desta aula mostra uma aplicação do princípio **Aberto para Extensão** do SOLID. O serviço ganhou uma forma de receber pedidos, e os mesmos casos de uso atenderam a nova entrada.

Na pasta `services/tarefas`, rode a checagem de tipos e os testes. Os testes HTTP sobem o adaptador localmente, enviam requisições e conferem a criação, a listagem e as respostas de erro. [Testes HTTP](../../test/http.test.ts)

```sh
npm run check
npm test
```
