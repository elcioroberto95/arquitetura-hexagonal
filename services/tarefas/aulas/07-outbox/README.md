# Aula 7 · Outbox transacional

Na [Aula 6](../06-evento-de-dominio/README.md), o evento `TarefaConcluida` podia se perder se o processo parasse entre a gravação e a publicação. Agora o SQLite grava a conclusão e o evento na mesma transação. Chamamos a tabela que guarda os eventos para publicação posterior de **outbox**.

## 1. Conclua uma tarefa e consulte a outbox

Na pasta `services/tarefas`, inicie a API com SQLite. Se o arquivo `tarefas.sqlite` já existir, o adaptador cria a tabela `outbox` na abertura do banco.

```powershell
npm run start:http:sqlite
```

Em outro PowerShell, na mesma pasta, crie uma tarefa e peça a conclusão duas vezes.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'
$tarefa = Invoke-RestMethod $api -UseBasicParsing -Method Post -ContentType 'application/json' `
  -Body '{"titulo":"Revisar a transação"}'

Invoke-RestMethod "$api/$($tarefa.id)/concluir" -UseBasicParsing -Method Patch
Invoke-RestMethod "$api/$($tarefa.id)/concluir" -UseBasicParsing -Method Patch
```

Pare a API com Ctrl+C e consulte o banco com o SQLite do próprio Node.js.

```powershell
@'
import { DatabaseSync } from 'node:sqlite';

const banco = new DatabaseSync('tarefas.sqlite', { readOnly: true });
console.table(banco.prepare('SELECT tipo, tarefa_id FROM outbox ORDER BY id').all());
banco.close();
'@ | node --input-type=module
```

Você verá uma linha `TarefaConcluida` com o ID da tarefa que acabou de concluir. A linha fica no banco para uma etapa posterior de publicação. Na API em memória, os eventos continuam saindo pelo console.

## 2. Siga as gravações

1. `marcarComoConcluida` devolve a tarefa concluída com seu evento. [Domínio](../../src/domain/tarefa.ts)
2. `concluirTarefa` passa o novo estado e o evento para `atualizarStatus`, pela porta do repositório. [Caso de uso](../../src/application/tarefas.ts) · [Porta](../../src/application/ports/repositorio-de-tarefas.ts)
3. O adaptador SQLite abre a transação, atualiza o status, insere o evento se houve mudança e confirma as duas gravações com `COMMIT`. Se a inserção falhar, o `ROLLBACK` desfaz a atualização. [Adaptador](../../src/adapters/repositorio-sqlite.ts)

## 3. Perguntas e respostas

**1. DDD ·** Você conclui “Revisar a transação”. Em `marcarComoConcluida`, qual fato o domínio registra e como o evento identifica a tarefa?

<details>
<summary>Ver resposta</summary>

O fato é que a tarefa foi concluída. O evento `TarefaConcluida` leva o ID no campo `tarefaId`.

</details>

**2. DDD ·** Depois da primeira conclusão, você envia outro `PATCH` para o mesmo ID. O que `marcarComoConcluida` encontra e o que `concluirTarefa` faz em seguida?

<details>
<summary>Ver resposta</summary>

A função encontra o status `concluida` e devolve a tarefa sem evento. O caso de uso retorna essa tarefa sem chamar `atualizarStatus`.

</details>

**3. Hexagonal ·** Você envia um `PATCH` de conclusão para uma tarefa pendente. Depois de receber o evento do domínio, qual porta `concluirTarefa` chama e quem define esse contrato?

<details>
<summary>Ver resposta</summary>

O caso de uso chama `atualizarStatus` da porta `RepositorioDeTarefas`, que a aplicação define em `application/ports/repositorio-de-tarefas.ts`.

</details>

**4. Hexagonal ·** Em `repositorio-sqlite.ts`, o `UPDATE` faz a mudança para `concluida`, mas o `INSERT` na outbox falha. O que o adaptador faz e qual status fica gravado?

<details>
<summary>Ver resposta</summary>

O adaptador executa `ROLLBACK` e repassa o erro. A tarefa permanece `pendente`.

</details>

O teste de rollback provoca essa falha no SQLite e depois repete a conclusão com sucesso. Rode `npm test` na pasta `services/tarefas`. [Teste do repositório](../../test/repositorio-sqlite.test.ts)
