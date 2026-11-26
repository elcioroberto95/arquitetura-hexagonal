# Aula 11 · Nova tentativa com espera

Na [Aula 10](../10-confirmar-entrega/README.md), um erro no consumidor deixava o evento pendente. Agora `outbox:entregar` registra a falha e dá ao evento um horário para a próxima tentativa, **30 segundos** após o erro.

## 1. Faça uma previsão e rode o teste

Imagine a tarefa “Confirmar a entrega”. A API já salvou seu status como `concluida`, mas o consumidor rejeita a primeira tentativa de registrar o evento. Antes de rodar o teste, tente prever o que vai aparecer em `publicado` e `falhas` e o que acontece se você rodar o comando antes do horário gravado.

Na pasta `services/tarefas`, rode no PowerShell:

```powershell
node --test --test-name-pattern "agenda nova tentativa" test/consumir-eventos.test.ts
```

O teste cria bancos temporários, força uma falha no consumidor e confere `publicado = 0`, `falhas = 1` e o horário em `proxima_tentativa_em`. Na execução seguinte, antes do horário, o comando pula a linha. O teste também simula o fim da espera para exercitar a entrega sem aguardar 30 segundos. [Teste da nova tentativa](../../test/consumir-eventos.test.ts)

## 2. Siga a falha pelo código

1. Se `publicar` lança um erro, o caso de uso calcula a próxima tentativa com `Date.now() + esperaAposFalhaMs`, pede à porta `Outbox` que registre a falha e repassa o erro. O comando termina com erro. [Caso de uso](../../src/application/publicar-eventos-pendentes.ts) · [Configuração](../../src/entregar-outbox.ts)
2. O adaptador incrementa `falhas` e guarda o horário no SQLite. Para eventos novos e registros vindos de aulas anteriores, `proxima_tentativa_em` começa em `0`, o que permite a primeira tentativa imediata. [Adaptador](../../src/adapters/outbox-sqlite.ts) · [Preparação do banco](../../src/adapters/banco-sqlite.ts)
3. Quando você roda `npm run outbox:entregar` novamente, o adaptador só devolve eventos com `publicado = 0` e horário menor ou igual ao momento atual. A espera fica no banco entre execuções. [Consulta da outbox](../../src/adapters/outbox-sqlite.ts)

## 3. Perguntas e respostas

**1. DDD ·** Você conclui “Confirmar a entrega”. Depois, o consumidor falha e a outbox guarda `falhas = 1`. Qual fato continua verdadeiro para a tarefa? Consulte `marcarComoConcluida`, em `tarefa.ts`.

<details>
<summary>Ver resposta</summary>

A tarefa foi concluída. A falha pertence à tentativa de entregar o evento que representa esse fato.

</details>

**2. DDD ·** Depois de 30 segundos, você roda `outbox:entregar` de novo. O consumidor recebe uma nova conclusão ou outra tentativa de entrega da conclusão anterior? Consulte o campo `tarefaId` em `tarefa-concluida.ts` e o evento lido por `listarPendentes`.

<details>
<summary>Ver resposta</summary>

É outra tentativa de entregar o mesmo fato, com o mesmo `tarefaId`. O comando lê a linha já gravada na outbox.

</details>

**3. Hexagonal ·** O consumidor lança um erro às 14h. Em `publicarEventosPendentes`, quem calcula que a entrega pode ser tentada às 14h00min30s, qual porta recebe esse horário e quem grava no banco?

<details>
<summary>Ver resposta</summary>

O caso de uso calcula o horário e chama `Outbox.registrarFalha`. A aplicação define a porta, e o adaptador SQLite persiste o horário e incrementa `falhas`.

</details>

**4. Hexagonal ·** Você roda o comando às 14h00min10s e depois às 14h00min30s. Em `outbox-sqlite.ts`, qual condição de `listarPendentes` faz o evento aparecer apenas na segunda execução, se ele ainda estiver pendente?

<details>
<summary>Ver resposta</summary>

O SQL exige `proxima_tentativa_em <= agora`. Às 14h00min10s o horário ainda está no futuro. Às 14h00min30s a linha pode ser lida.

</details>
