# Aula 9 · Consumidor idempotente

Na [Aula 8](../08-publicar-outbox/README.md), vimos que um evento pode ser publicado novamente se o processo parar antes de gravar a marcação na outbox. Nesta aula, vamos entregar duas vezes o mesmo `TarefaConcluida`. O consumidor é **idempotente** quando a segunda entrega deixa o registro de conclusões no mesmo estado que a primeira.

## 1. Entregue o mesmo evento duas vezes

Na pasta `services/tarefas`, inicie a API com `npm run start:http:sqlite`. Em outro PowerShell, na mesma pasta, crie e conclua uma tarefa.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'
$tarefa = Invoke-RestMethod $api -UseBasicParsing -Method Post -ContentType 'application/json' `
  -Body '{"titulo":"Testar entrega repetida"}'
Invoke-RestMethod "$api/$($tarefa.id)/concluir" -UseBasicParsing -Method Patch
```

Guarde a saída do publicador e envie as mesmas linhas JSON a duas execuções do consumidor. Se a outbox tiver outros eventos pendentes, eles também farão parte do exercício.

```powershell
$eventos = npm run --silent outbox:publicar
$eventos | npm run --silent eventos:consumir
$eventos | npm run --silent eventos:consumir
```

Procure o ID da tarefa nas duas saídas. Na primeira, aparece “Conclusão registrada”. Na segunda, aparece “Conclusão já registrada”. O consumidor consulta e grava em `conclusoes.sqlite`, o seu próprio arquivo SQLite.

## 2. Siga a entrega pelo código

1. O comando lê cada linha JSON da entrada e verifica se ela contém um evento `TarefaConcluida` com `tarefaId` em texto. [Comando do consumidor](../../src/consumir-eventos.ts)
2. `consumirTarefaConcluida` usa o ID da tarefa para pedir um registro pela porta `RegistroDeConclusoes`. [Caso de uso](../../src/application/consumir-tarefa-concluida.ts) · [Porta](../../src/application/ports/registro-de-conclusoes.ts)
3. O adaptador SQLite tenta inserir a linha. Como `tarefa_id` é a chave primária, o segundo `INSERT` para o mesmo ID usa `ON CONFLICT DO NOTHING` e deixa o registro intacto. A própria inserção resolve a disputa quando duas entregas chegam ao mesmo tempo. [Adaptador SQLite](../../src/adapters/registro-de-conclusoes-sqlite.ts)

> **Anotação.** A chave primária já impede que o mesmo `tarefa_id` seja cadastrado duas vezes. Um `INSERT` simples para um ID já registrado gera um erro. Com `ON CONFLICT (tarefa_id) DO NOTHING`, o SQLite afeta zero linhas. Nesse caso, `registrar` retorna `false`, o comando mostra “Conclusão já registrada” e segue para o próximo evento.

O ID da tarefa serve de chave porque, nas regras deste projeto, cada tarefa só pode ser concluída uma vez. Se no futuro uma tarefa puder ser reaberta e concluída de novo, cada conclusão precisará de uma identidade própria para o consumidor reconhecer quais entregas repetem o mesmo fato.

## 3. Perguntas e respostas

**1. DDD ·** Você entrega duas vezes um `TarefaConcluida` com `tarefaId` igual a `tarefa-1`. Que regra de `marcarComoConcluida`, em `tarefa.ts`, permite usar esse ID como chave do registro neste exemplo?

<details>
<summary>Ver resposta</summary>

A tarefa só passa de `pendente` para `concluida` uma vez. Depois disso, o domínio devolve a tarefa sem gerar outro evento.

</details>

**2. DDD ·** Você conclui duas tarefas com o título “Revisar eventos”, uma com ID `tarefa-1` e outra com ID `tarefa-2`. Ao entregar os dois eventos, quantas conclusões `consumirTarefaConcluida` deve registrar? Consulte o campo `tarefaId` em `tarefa-concluida.ts`.

<details>
<summary>Ver resposta</summary>

Duas. Cada ID identifica uma tarefa e, neste projeto, sua única conclusão.

</details>

**3. Hexagonal ·** O comando lê o JSON de `tarefa-1` e chama `consumirTarefaConcluida`. Em seguida, qual porta o caso de uso chama, quem define o contrato e qual adaptador executa o `INSERT`?

<details>
<summary>Ver resposta</summary>

O caso de uso chama `RegistroDeConclusoes.registrar`. A aplicação define a porta em `registro-de-conclusoes.ts`. O adaptador `registro-de-conclusoes-sqlite.ts` executa o `INSERT`.

</details>

**4. Hexagonal ·** O primeiro comando registra `tarefa-1` e termina. Você abre o consumidor de novo e entrega o mesmo evento. O que acontece na segunda chamada a `registrar` e como o comando sabe qual mensagem mostrar?

<details>
<summary>Ver resposta</summary>

O SQLite encontra a chave já gravada e a inserção afeta zero linhas. `registrar` devolve `false`, e `consumir-eventos.ts` mostra “Conclusão já registrada”.

</details>

Rode `npm test` para conferir a entrega repetida em dois processos e o registro de uma tarefa com outro ID. [Teste do consumidor](../../test/consumir-eventos.test.ts)
