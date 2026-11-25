# Aula 1 · Portas e adaptadores em uma lista de tarefas

Nesta aula, siga uma tarefa do teclado até a lista. Quando conseguir explicar quem lê o comando, quem valida o título e quem guarda a tarefa, você já terá entendido a divisão principal do projeto.

## 1. Experimente o serviço

Use Node.js 22.18+ na linha 22, ou Node.js 24 ou superior. Na raiz do repositório, entre na pasta do serviço e instale as dependências de desenvolvimento.

```sh
cd services/tarefas
npm ci
npm start
```

O Node executa os arquivos `.ts` deste exemplo removendo as anotações de tipo. O comando `npm run check` roda o compilador separadamente para verificar se os contratos foram respeitados. [Suporte a TypeScript no Node.js](https://nodejs.org/learn/typescript/run-natively)

Digite uma linha por vez.

```text
adicionar
adicionar Estudar arquitetura hexagonal
listar
sair
```

O primeiro `adicionar` mostra `O título da tarefa é obrigatório.`. Na listagem, aparece só `Estudar arquitetura hexagonal`. As tarefas ficam em memória e a lista começa vazia a cada execução.

## 2. Acompanhe um comando no código

1. O **adaptador de entrada** lê `adicionar Estudar arquitetura hexagonal`, separa o nome do comando do título e chama `tarefas.adicionarTarefa(titulo)`. [Terminal](src/adapters/terminal.ts)
2. O **caso de uso** `adicionarTarefa` chama `criarTarefa(titulo)`. O **domínio** valida o título e devolve a tarefa. Se o título estiver vazio, `criarTarefa` lança `TituloInvalido` e a execução para antes de salvar. [Aplicação](src/application/tarefas.ts) · [Domínio](src/domain/tarefa.ts)
3. O caso de uso passa a tarefa para `repositorio.salvar(tarefa)`. O **adaptador de saída** implementa esse método e guarda uma cópia da tarefa no array. [Repositório em memória](src/adapters/repositorio-em-memoria.ts)
4. O terminal exibe a confirmação ou, se recebeu `TituloInvalido`, mostra a mensagem de validação. [Terminal](src/adapters/terminal.ts)

## 3. Localize as portas e os adaptadores

Uma **porta** é um contrato de comunicação. Pela porta de entrada, alguém pede uma operação à aplicação. Pela porta de saída, a aplicação pede a uma implementação externa que faça algo de que o caso de uso precisa.

Em TypeScript, uma `interface` descreve os métodos que um objeto precisa oferecer. Por exemplo, `RepositorioDeTarefas` diz que um repositório precisa saber salvar e listar tarefas. O repositório em memória é o código que faz isso de verdade. O `npm run check` confere se o objeto tem os métodos exigidos pela interface. [Interface do repositório](src/application/ports/repositorio-de-tarefas.ts)

| Peça | Onde aparece | O que observar |
| --- | --- | --- |
| Porta de entrada | [`CasosDeUsoDeTarefas`](src/application/ports/casos-de-uso-de-tarefas.ts) | Declara `adicionarTarefa(titulo)` e `listarTarefas()`. A aplicação implementa a interface e o terminal a usa. |
| Porta de saída | [`RepositorioDeTarefas`](src/application/ports/repositorio-de-tarefas.ts) | Declara `salvar(tarefa)` e `listar()`. A aplicação usa a interface e o repositório em memória a implementa. |
| Adaptador de entrada | [`executarTerminal`](src/adapters/terminal.ts) | Interpreta os comandos e recebe as operações da aplicação como `CasosDeUsoDeTarefas`. |
| Adaptador de saída | [`criarRepositorioEmMemoria`](src/adapters/repositorio-em-memoria.ts) | Devolve um objeto com os métodos de `RepositorioDeTarefas`. |

O TypeScript permite implementar uma interface com um objeto que tenha os métodos e tipos declarados nela. Veja como a assinatura da função abaixo torna as duas portas visíveis. O parâmetro é a porta de saída que os casos de uso usam. O retorno é a porta de entrada que eles oferecem. [Aplicação](src/application/tarefas.ts)

```ts
criarCasosDeUsoDeTarefas(repositorio: RepositorioDeTarefas): CasosDeUsoDeTarefas
```

Abra `main.ts` e procure `criarCasosDeUsoDeTarefas(repositorio)`. É ali que o repositório concreto é passado para a aplicação. Durante a execução, a aplicação chama o repositório em memória. A dependência no código aponta para dentro, pois o repositório importa o contrato definido na aplicação. [Ponto de entrada](src/main.ts) · [Repositório em memória](src/adapters/repositorio-em-memoria.ts)

## 4. Decida onde cada responsabilidade entra

### `adapters` · Como o sistema se comunica com o exterior?

O nome vem de **adaptar** o formato de uma tecnologia ao contrato da aplicação. Aqui ficam a leitura de comandos, a formatação da saída e os detalhes de armazenamento. O terminal verifica se reconhece o comando `adicionar`. A regra de que toda tarefa precisa de título vive no domínio e vale para qualquer adaptador que chame o caso de uso.

### `application` · Quais operações o sistema oferece?

O nome vem das operações que a **aplicação** oferece, chamadas de casos de uso. Aqui se coordena a sequência de passos. Para adicionar uma tarefa, a aplicação pede ao domínio que a crie, pede ao repositório que a salve e devolve a tarefa. A regra do título fica no domínio. Os detalhes de interpretar o comando ou armazenar a tarefa ficam nos adaptadores.

### `domain` · Que regras valem para uma tarefa?

**Domínio** é a área do problema que o software resolve. Aqui, é o gerenciamento de tarefas. No código do domínio ficam os conceitos e suas regras. `criarTarefa` exige um título com conteúdo e remove espaços das extremidades. Se o título passar a exigir pelo menos três caracteres, mude a regra aqui para que ela valha tanto pelo terminal quanto por uma futura API. A aplicação decide quando salvar, e o adaptador de saída cuida de como salvar.

## 5. Veja duas ideias de SOLID no código

- **S · Responsabilidade única.** Para mudar o comando digitado, abra o terminal. Para mudar a regra do título, abra o domínio. Cada arquivo tem um motivo diferente para mudar.
- **D · Inversão de dependência.** Leia `repositorio.salvar(tarefa)` no caso de uso. A aplicação define o método de que precisa na interface `RepositorioDeTarefas`. O adaptador em memória segue esse contrato, e o `main.ts` passa a implementação para a aplicação. Esse ato de passar o objeto é a **injeção de dependência**.

Se quiser ver o efeito disso em um teste, abra `tarefas.test.ts`. O teste do título vazio passa um repositório de teste que falha se alguém chamar `salvar`. Assim dá para verificar se o caso de uso rejeita o título antes de tentar gravá-lo. [Testes](test/tarefas.test.ts)

## 6. Perguntas e respostas

Tente responder cada pergunta olhando o código. Depois abra a resposta para conferir.

<details>
<summary>1. Qual método o terminal chama quando você digita listar?</summary>

O terminal chama `listarTarefas()`, que faz parte da porta de entrada. Dentro do caso de uso, a aplicação chama `repositorio.listar()`, que faz parte da porta de saída.

</details>

<details>
<summary>2. Onde você faria o comando ls também listar tarefas?</summary>

Em `adapters/terminal.ts`. O terminal pode aceitar `ls` e chamar o mesmo `listarTarefas()`.

</details>

<details>
<summary>3. Onde está a regra que impede um título vazio?</summary>

Em `criarTarefa`, no arquivo `domain/tarefa.ts`. O caso de uso chama essa função antes de chamar `salvar`. É por isso que `adicionar` sem título mostra um erro e a lista fica como estava.

</details>

<details>
<summary>4. Quem guarda as tarefas e por que elas somem ao sair?</summary>

O repositório em memória guarda as tarefas em um array. Ao encerrar o programa, essa memória é liberada. Na próxima execução, `main.ts` cria outro repositório com um array vazio.

</details>

<details>
<summary>5. Onde você ligaria outro repositório que seguisse o mesmo contrato?</summary>

Em `main.ts`. É ali que o repositório é criado e passado para `criarCasosDeUsoDeTarefas(repositorio)`.

</details>

## 7. Faça uma experiência com a interface

Em `adapters/repositorio-em-memoria.ts`, renomeie `salvar` para `gravar` só nesse arquivo e rode `npm run check`. O compilador aponta o objeto que o adaptador devolve, porque o contrato `RepositorioDeTarefas` exige `salvar`. Volte o nome para `salvar` e rode a checagem de novo.

Na pasta `services/tarefas`, verifique os tipos e rode os testes de comportamento.

```sh
npm run check
npm test
```
