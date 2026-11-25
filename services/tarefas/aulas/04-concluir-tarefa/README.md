# Aula 4 · Identidade e estado de uma tarefa

Na [Aula 3](../03-sqlite/README.md), o SQLite usava um `id` interno para ordenar as linhas. Agora imagine duas tarefas chamadas `Revisar a aula`. Para concluir só uma delas, quem usa a API precisa conseguir apontar **qual tarefa** quer concluir. É por isso que o modelo de domínio passa a ter um `id` próprio.

## 1. Conclua só uma das tarefas

Na raiz do repositório, rode os comandos abaixo com a mesma versão de Node usada nas aulas anteriores.

```sh
cd services/tarefas
npm ci
npm run start:http:sqlite
```

Em outro PowerShell, crie duas tarefas com o mesmo título e use o `id` da segunda para concluí-la.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'
$corpo = '{"titulo":"Revisar a aula"}'

$primeira = Invoke-RestMethod $api -UseBasicParsing -Method Post -ContentType 'application/json' -Body $corpo
$segunda = Invoke-RestMethod $api -UseBasicParsing -Method Post -ContentType 'application/json' -Body $corpo

Invoke-RestMethod "$api/$($segunda.id)/concluir" -UseBasicParsing -Method Patch

(Invoke-RestMethod $api -UseBasicParsing) |
  Where-Object { $_.id -in @($primeira.id, $segunda.id) } |
  Format-Table id, titulo, status
```

Você deve ver dois IDs diferentes. A primeira tarefa continua `pendente`, e a segunda aparece como `concluida`. Repetir o mesmo `PATCH` devolve a mesma tarefa concluída. Se o ID não existir, a API responde `404`.

O SQLite preserva os dados já gravados na Aula 3. Quando o servidor abre o banco antigo, o adaptador atribui um ID como `legado-1` a cada tarefa existente e começa seu estado como `pendente`. Na inicialização, `main-http.ts` passa `randomUUID` à aplicação. O caso de uso chama essa função para gerar o ID de cada nova tarefa.

## 2. Siga a mudança de estado no código

1. O **adaptador HTTP** extrai o `id` de `PATCH /tarefas/:id/concluir` e chama `concluirTarefa(id)` pela **porta de entrada**. [HTTP](../../src/adapters/http.ts) · [Porta de entrada](../../src/application/ports/casos-de-uso-de-tarefas.ts)
2. A **aplicação** busca a tarefa pela **porta de saída**. Quando encontra a tarefa, chama `marcarComoConcluida` e pede ao repositório que grave o novo estado. [Caso de uso](../../src/application/tarefas.ts) · [Porta de saída](../../src/application/ports/repositorio-de-tarefas.ts)
3. O **domínio** define o estado inicial `pendente` e a operação que passa uma tarefa para `concluida`, preservando seu `id` e seu título. [Modelo de domínio](../../src/domain/tarefa.ts)
4. O **adaptador SQLite** grava o estado. A tabela tem um `id` numérico interno para a ordem da lista e uma coluna `id_tarefa` que guarda a identidade usada pelo domínio e pela API. [Repositório SQLite](../../src/adapters/repositorio-sqlite.ts)

Em DDD, chamamos de **entidade** algo que precisa manter sua identidade mesmo quando seus dados mudam. Aqui, a tarefa com o mesmo `id` continua sendo a mesma tarefa depois que seu estado muda. Dá para representar isso com um tipo e funções em `domain/tarefa.ts`.

## 3. Perguntas e respostas

<details>
<summary>1. DDD · O que permite distinguir duas tarefas com o mesmo título?</summary>

O `id` da tarefa. O título descreve o que fazer, e o `id` identifica qual tarefa deve mudar de estado.

</details>

<details>
<summary>2. DDD · Onde começa o estado pendente e onde ele muda para concluída?</summary>

No domínio. `criarTarefa` começa com `pendente` e `marcarComoConcluida` muda para `concluida` mantendo a identidade da tarefa.

</details>

<details>
<summary>3. Hexagonal · Qual porta o HTTP chama e qual a aplicação usa para gravar a conclusão?</summary>

O HTTP chama `concluirTarefa` na porta de entrada `CasosDeUsoDeTarefas`. A aplicação chama `atualizarStatus` na porta de saída `RepositorioDeTarefas`.

</details>

<details>
<summary>4. Hexagonal · Onde você mexeria para guardar o estado em outro banco?</summary>

No adaptador de saída. Ele implementaria a mesma porta de repositório. A escolha da implementação continuaria no ponto de inicialização.

</details>

## 4. Confira na review

Compare `marcarComoConcluida` com `concluirTarefa`. Uma função descreve a mudança de estado. A outra coordena a busca, a mudança e a gravação. Os testes conferem que concluir uma tarefa pelo ID deixa a outra intacta e que a alteração sobrevive à reabertura do SQLite. [Testes HTTP](../../test/http.test.ts) · [Testes do SQLite](../../test/repositorio-sqlite.test.ts)

Na pasta `services/tarefas`, rode:

```sh
npm run check
npm test
```
