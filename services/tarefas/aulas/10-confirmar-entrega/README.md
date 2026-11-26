# Aula 10 · Confirmação de entrega

Na [Aula 9](../09-consumidor-idempotente/README.md), você capturou a saída do publicador e entregou o JSON ao consumidor. Agora o comando `outbox:entregar` chama o consumidor diretamente e só marca a linha da outbox depois que a gravação no banco do consumidor termina.

## 1. Entregue um evento e confira os dois bancos

Na pasta `services/tarefas`, inicie a API com `npm run start:http:sqlite`. Em outro PowerShell, na mesma pasta, crie uma tarefa, conclua e entregue seu evento.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'
$tarefa = Invoke-RestMethod $api -UseBasicParsing -Method Post -ContentType 'application/json' `
  -Body '{"titulo":"Confirmar a entrega"}'
Invoke-RestMethod "$api/$($tarefa.id)/concluir" -UseBasicParsing -Method Patch
npm run outbox:entregar
```

O comando processa os eventos pendentes. Use o ID que a API devolveu para confirmar a gravação nos dois bancos.

```powershell
$tarefa.id
@'
import { DatabaseSync } from 'node:sqlite';

const tarefas = new DatabaseSync('tarefas.sqlite', { readOnly: true });
const conclusoes = new DatabaseSync('conclusoes.sqlite', { readOnly: true });
console.table(tarefas.prepare('SELECT tarefa_id, publicado FROM outbox').all());
console.table(conclusoes.prepare('SELECT tarefa_id FROM conclusoes').all());
tarefas.close();
conclusoes.close();
'@ | node --input-type=module
```

Na primeira tabela, a linha do seu evento tem `publicado = 1`. Na segunda, o mesmo ID aparece no registro de conclusões. Neste comando, o retorno de `publicar` sem erro é a **confirmação de entrega**.

## 2. Siga a confirmação pelo código

1. `entregar-outbox.ts` conecta um publicador local à porta `PublicadorDeEventos`. Ao receber um evento, esse publicador chama `consumirTarefaConcluida`, que registra a conclusão em `conclusoes.sqlite`. [Comando de entrega](../../src/entregar-outbox.ts) · [Consumidor](../../src/application/consumir-tarefa-concluida.ts)
2. Assim que a chamada retorna, `publicarEventosPendentes` pede à porta `Outbox` que marque a linha. O adaptador SQLite grava `publicado = 1` em `tarefas.sqlite`. [Caso de uso](../../src/application/publicar-eventos-pendentes.ts) · [Adaptador da outbox](../../src/adapters/outbox-sqlite.ts)

As duas gravações acontecem em bancos separados. Se o consumidor falhar, a outbox continua pendente. Se a gravação do consumidor funcionar e só a marcação falhar, rode `npm run outbox:entregar` novamente. O consumidor reconhece a conclusão já registrada e a outbox pode confirmar a entrega nessa nova tentativa.

## 3. Perguntas e respostas

**1. DDD ·** Você conclui “Confirmar a entrega” pela API. Antes de rodar o comando, a tarefa já está `concluida` e a linha da outbox tem `publicado = 0`. Qual fato já aconteceu para o domínio? Consulte `marcarComoConcluida` em `tarefa.ts`.

<details>
<summary>Ver resposta</summary>

A tarefa foi concluída. `TarefaConcluida` registra esse fato, e a linha ainda aguarda a entrega ao consumidor.

</details>

**2. DDD ·** O consumidor já registrou a conclusão de `tarefa-1`. Na próxima execução, recebe de novo o mesmo `TarefaConcluida`. Quantas conclusões esse ID representa e qual regra de `marcarComoConcluida` sustenta essa interpretação?

<details>
<summary>Ver resposta</summary>

Uma. A tarefa só muda de `pendente` para `concluida` uma vez. Pedir a conclusão de novo devolve a tarefa sem criar um novo fato.

</details>

**3. Hexagonal ·** Em `entregar-outbox.ts`, o comando monta o publicador local. Qual contrato da aplicação ele implementa, quem o chama e o que ele faz para entregar o evento?

<details>
<summary>Ver resposta</summary>

Ele implementa `PublicadorDeEventos`, definido pela aplicação. `publicarEventosPendentes` chama `publicar`, que encaminha o evento para `consumirTarefaConcluida`.

</details>

**4. Hexagonal ·** O consumidor gravou `tarefa-1`, mas o SQLite rejeitou `marcarComoPublicado`. Ao rodar o comando de novo, qual linha `listarPendentes` devolve e o que acontece depois em `publicarEventosPendentes`?

<details>
<summary>Ver resposta</summary>

A outbox devolve a mesma linha pendente. O consumidor aceita a repetição sem inserir outra conclusão. Quando `publicar` retorna, o caso de uso tenta marcar a linha de novo.

</details>

Rode `npm test` para acompanhar uma falha na gravação do consumidor, outra na marcação da outbox e a nova tentativa que confirma a entrega. [Teste do comando](../../test/consumir-eventos.test.ts)
