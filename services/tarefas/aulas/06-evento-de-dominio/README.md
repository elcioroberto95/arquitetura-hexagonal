# Aula 6 · Evento de domínio ao concluir uma tarefa

Na [Aula 4](../04-concluir-tarefa/README.md), aprendemos que concluir uma tarefa muda seu estado. Nesta aula, vamos representar essa mudança como um **evento de domínio**. `TarefaConcluida` é um fato que descreve algo que aconteceu e identifica a tarefa pelo ID.

## 1. Conclua a mesma tarefa duas vezes

Na raiz do repositório, rode os comandos abaixo para subir a API em memória.

```sh
cd services/tarefas
npm ci
npm run start:http
```

Em outro PowerShell, crie uma tarefa e envie o mesmo pedido de conclusão duas vezes.

```powershell
$api = 'http://127.0.0.1:3000/tarefas'
$tarefa = Invoke-RestMethod $api -UseBasicParsing -Method Post -ContentType 'application/json' `
  -Body '{"titulo":"Revisar eventos"}'

Invoke-RestMethod "$api/$($tarefa.id)/concluir" -UseBasicParsing -Method Patch
Invoke-RestMethod "$api/$($tarefa.id)/concluir" -UseBasicParsing -Method Patch
```

Os dois pedidos devolvem a tarefa `concluida`. No terminal do servidor, aparece **uma linha** com o evento e o ID da tarefa. Só o primeiro pedido mudou o estado.

```json
{"tipo":"TarefaConcluida","tarefaId":"<id da tarefa>"}
```

## 2. Acompanhe o evento pelo código

1. `marcarComoConcluida` decide se houve mudança. Uma tarefa que estava `pendente` sai dessa função como `concluida`, acompanhada do evento. [Domínio](../../src/domain/tarefa.ts) · [Evento](../../src/domain/tarefa-concluida.ts)
2. O caso de uso `concluirTarefa` chama `atualizarStatus` pela porta do repositório. Quando o repositório confirma a mudança, a aplicação chama `publicar(evento)` pela porta `PublicadorDeEventos`. [Caso de uso](../../src/application/tarefas.ts) · [Porta de publicação](../../src/application/ports/publicador-de-eventos.ts)
3. `main-http.ts` conecta a porta à implementação desta aula. O adaptador converte o evento em JSON e o escreve no console. [Inicialização](../../src/main-http.ts) · [Adaptador](../../src/adapters/eventos-no-console.ts)

Nesta aula, o evento é entregue por uma chamada de função dentro do processo. O adaptador faz uma tentativa depois da gravação. Se o processo parar nesse intervalo ou a publicação falhar, a tarefa continua concluída e o evento pode se perder. Isso será importante quando quisermos entregar eventos a outro serviço.

## 3. Perguntas e respostas

<details>
<summary>1. DDD · Você conclui “Revisar eventos”. Qual fato a função marcarComoConcluida produz? Que dado identifica a tarefa?</summary>

Ela produz `TarefaConcluida`, com o ID no campo `tarefaId`.

</details>

<details>
<summary>2. DDD · Você envia o mesmo PATCH de novo. O que marcarComoConcluida encontra no status dessa vez?</summary>

Ela encontra `concluida`. Como a tarefa já está nesse estado, devolve a tarefa sem criar outro evento.

</details>

<details>
<summary>3. Hexagonal · Se atualizarStatus falhar no repositório, em que ponto concluirTarefa para? O console recebe o evento?</summary>

A gravação falha antes que o caso de uso chame `publicar`. O console só recebe o evento quando a mudança foi gravada com sucesso.

</details>

<details>
<summary>4. Hexagonal · Você quer mostrar os eventos em outro destino. Qual porta o novo adaptador implementaria e onde seria conectado?</summary>

Ele implementaria `PublicadorDeEventos`. Em `main-http.ts`, você passaria essa implementação para `criarCasosDeUsoDeTarefas` no lugar de `eventosNoConsole`.

</details>

Na pasta `services/tarefas`, use `npm run check` para checar os tipos e `npm test` para rodar os testes. [Testes da conclusão](../../test/tarefas.test.ts)
