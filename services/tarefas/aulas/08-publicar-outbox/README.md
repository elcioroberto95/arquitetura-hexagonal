# Aula 8 · Publicação da outbox

Na [Aula 7](../07-outbox/README.md), o SQLite guardou o evento `TarefaConcluida` junto com a conclusão da tarefa. Nesta aula, um comando lê os eventos pendentes, publica cada um no console e registra a publicação no banco.

## 1. Publique o mesmo conjunto de eventos duas vezes

Na pasta `services/tarefas`, inicie a API com `npm run start:http:sqlite`. Em outro PowerShell, na mesma pasta, crie e conclua uma tarefa.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'
$tarefa = Invoke-RestMethod $api -UseBasicParsing -Method Post -ContentType 'application/json' `
  -Body '{"titulo":"Publicar eventos pendentes"}'
Invoke-RestMethod "$api/$($tarefa.id)/concluir" -UseBasicParsing -Method Patch
```

Execute o comando de publicação duas vezes.

```powershell
npm run outbox:publicar
npm run outbox:publicar
```

Na primeira execução, procure a linha JSON com o ID da tarefa recém-concluída. Eventos pendentes de aulas anteriores também aparecem. Na segunda execução, se nenhuma outra tarefa foi concluída nesse intervalo, o comando termina sem imprimir eventos. O SQLite mantém as linhas na `outbox` com `publicado = 1`.

## 2. Siga um evento da outbox até o console

1. O comando abre o mesmo `tarefas.sqlite` da API e conecta os dois adaptadores ao caso de uso. Ao abrir um banco da Aula 7, o SQLite adiciona a coluna `publicado` com valor inicial `0`. [Inicialização](../../src/publicar-outbox.ts) · [Preparação do banco](../../src/adapters/banco-sqlite.ts)
2. `publicarEventosPendentes` pede à porta `Outbox` as linhas pendentes. O adaptador SQLite lê essas linhas em ordem de ID e monta os eventos. [Caso de uso](../../src/application/publicar-eventos-pendentes.ts) · [Adaptador SQLite](../../src/adapters/outbox-sqlite.ts)
3. Para cada linha, a aplicação chama `PublicadorDeEventos.publicar`. Assim que a chamada retorna, a aplicação pede à `Outbox` que marque a linha como publicada. [Porta de publicação](../../src/application/ports/publicador-de-eventos.ts) · [Adaptador de console](../../src/adapters/eventos-no-console.ts)

Se `publicar` lançar um erro, o comando para e a linha continua pendente. Se o processo parar depois de publicar e antes de gravar a marcação, a próxima execução pode publicar o mesmo evento de novo. Dois comandos rodando ao mesmo tempo também podem ler a mesma linha pendente.

## 3. Perguntas e respostas

**1. DDD ·** Você conclui “Publicar eventos pendentes” e consulta a outbox antes de rodar o comando. A tarefa está `concluida` e a linha tem `publicado = 0`. O que cada estado descreve? Consulte `tarefa.ts` e `outbox-sqlite.ts`.

<details>
<summary>Ver resposta</summary>

`concluida` é o estado da tarefa no domínio. `publicado = 0` indica que a linha do evento ainda está pendente de publicação.

</details>

**2. DDD ·** Você conclui a tarefa de ID `tarefa-1` e depois roda o comando. Qual fato chega ao console e que campo mantém o vínculo com a tarefa? Consulte `tarefa-concluida.ts` e `listarPendentes` em `outbox-sqlite.ts`.

<details>
<summary>Ver resposta</summary>

`TarefaConcluida` informa que a tarefa foi concluída. `tarefaId` vale `tarefa-1`.

</details>

**3. Hexagonal ·** O comando encontra uma linha pendente e vai publicar seu evento. Quais portas `publicarEventosPendentes` chama, em que ordem, e quem define os contratos?

<details>
<summary>Ver resposta</summary>

A aplicação define as duas portas. O caso de uso lê pela `Outbox`, publica por `PublicadorDeEventos` e volta à `Outbox` para marcar a linha.

</details>

**4. Hexagonal ·** O caso de uso lê a linha, chama `publicar` e o adaptador de publicação lança um erro. Quando você roda o comando de novo, o que o adaptador SQLite encontra em `listarPendentes`?

<details>
<summary>Ver resposta</summary>

A marcação só acontece quando `publicar` retorna. A linha continua com `publicado = 0` e aparece na próxima leitura.

</details>

Use `npm test` para conferir a leitura de eventos da Aula 7 e a nova tentativa após uma falha de publicação. [Testes do SQLite](../../test/repositorio-sqlite.test.ts)
