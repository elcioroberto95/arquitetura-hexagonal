# Aula 5 · Título como objeto de valor

Na [Aula 4](../04-concluir-tarefa/README.md), usamos o ID para distinguir duas tarefas com o mesmo título. Agora vamos olhar para o **título**. Se duas tarefas se chamam `Revisar a aula`, são tarefas diferentes com títulos de mesmo valor.

## 1. Veja o valor pela regra do título

Ao criar um `TituloTarefa`, o domínio remove os espaços das extremidades e exige que sobre algum texto. A propriedade `valor` permite ler o texto. O método `igualA` compara o conteúdo de dois títulos.

```ts
const primeiro = TituloTarefa.criar('  Revisar a aula  ');
const segundo = TituloTarefa.criar('Revisar a aula');

primeiro.valor;           // 'Revisar a aula'
primeiro.igualA(segundo); // true
```

Isso é um **objeto de valor** em DDD. A comparação usa aquilo que o objeto representa. Para uma tarefa, o critério de identidade continua sendo o `id`. A função `criarTarefa` agora delega a criação do título a `TituloTarefa`. [Objeto de valor](../../src/domain/titulo-tarefa.ts) · [Tarefa](../../src/domain/tarefa.ts)

## 2. Acompanhe a conversão nos adaptadores

| Onde | O que acontece com o título |
| --- | --- |
| [HTTP](../../src/adapters/http.ts) | Lê `titulo` como texto do JSON e usa `titulo.valor` para devolver texto na resposta. |
| [Terminal](../../src/adapters/terminal.ts) | Envia o texto digitado para a aplicação e usa `titulo.valor` para imprimir a tarefa. |
| [SQLite](../../src/adapters/repositorio-sqlite.ts) | Grava `titulo.valor` na coluna de texto e reconstrói `TituloTarefa` ao ler uma linha. |

A porta de entrada continua recebendo um título em texto. A criação do objeto de valor acontece dentro do domínio. O repositório em memória pode guardar o próprio objeto, que expõe o texto para leitura. [Porta de entrada](../../src/application/ports/casos-de-uso-de-tarefas.ts) · [Repositório em memória](../../src/adapters/repositorio-em-memoria.ts)

## 3. Rode o exemplo

Na raiz do repositório, execute os comandos abaixo. O teste compara dois títulos com conteúdos equivalentes e rejeita um título que ficou vazio depois de remover os espaços.

```sh
cd services/tarefas
npm ci
node --test test/titulo-tarefa.test.ts
```

Você também pode rodar `npm run start:http:sqlite` e repetir os pedidos da Aula 4. Observe que o campo `titulo` da resposta continua sendo um texto. As tarefas gravadas nas aulas anteriores continuam sendo lidas pelo mesmo SQLite.

## 4. Perguntas e respostas

<details>
<summary>1. DDD · Duas tarefas com títulos iguais são a mesma tarefa?</summary>

Cada tarefa tem seu próprio `id`. Duas tarefas com IDs distintos podem ter títulos de mesmo valor.

</details>

<details>
<summary>2. DDD · Onde você mudaria a regra se o título precisasse ter pelo menos três caracteres?</summary>

Em `TituloTarefa.criar`. É ali que o domínio decide se o texto pode ser usado como título.

</details>

<details>
<summary>3. Hexagonal · Quem transforma TituloTarefa no texto da resposta JSON?</summary>

O adaptador HTTP. Ele lê `titulo.valor` e monta a resposta com o campo `titulo` em texto.

</details>

<details>
<summary>4. Hexagonal · Você cria a tarefa “Revisar a aula” e depois lista as tarefas. O que o SQLite guarda no campo titulo? O que a aplicação recebe nesse campo ao listar?</summary>

Em `salvar`, o adaptador grava o texto `'Revisar a aula'`, que lê de `tarefa.titulo.valor`. Quando `listar` consulta o banco, a função `lerTarefa` recebe esse texto e chama `TituloTarefa.criar(titulo)`. A aplicação recebe a tarefa com um `TituloTarefa` no campo `titulo`. [Adaptador SQLite](../../src/adapters/repositorio-sqlite.ts)

</details>

Para conferir os tipos e rodar todos os testes a partir de `services/tarefas`, use `npm run check` e `npm test`. [Testes do objeto de valor](../../test/titulo-tarefa.test.ts)
