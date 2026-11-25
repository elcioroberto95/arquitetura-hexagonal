# Aula 1 · Lista de tarefas

Na raiz do repositório, rode com Node.js 22 ou superior. O serviço usa a biblioteca padrão do Node.js e dispensa instalação de dependências.

```sh
node services/tarefas/src/main.mjs
```

Experimente digitar uma linha por vez:

```text
adicionar Estudar arquitetura hexagonal
listar
sair
```

Digite `adicionar` sem título para ver a validação. Depois, digite `listar` para conferir o conteúdo da lista. As tarefas ficam em memória e a lista começa vazia a cada execução.

## Como seguir o código

1. O [adaptador de terminal](src/adapters/terminal.mjs) lê `adicionar Estudar arquitetura hexagonal` e chama `adicionarTarefa(titulo)`. As funções `adicionarTarefa` e `listarTarefas` são as **portas de entrada** que a aplicação oferece para quem a chama.
2. O [caso de uso](src/application/tarefas.mjs) pede ao [domínio](src/domain/tarefa.mjs) que crie uma tarefa. A regra do domínio exige um título com conteúdo e remove espaços das extremidades.
3. O caso de uso chama `repositorio.salvar(tarefa)`. `salvar(tarefa)` e `listar()` formam a **porta de saída** que a aplicação espera receber. Em JavaScript, esse contrato aparece nos métodos que o caso de uso chama.
4. O [adaptador em memória](src/adapters/repositorio-em-memoria.mjs) implementa esses métodos. O [ponto de entrada](src/main.mjs) cria o adaptador, passa-o à aplicação e liga a aplicação ao terminal.

O fluxo de execução passa do caso de uso para o armazenamento. A dependência no código funciona de outro jeito: o caso de uso recebe o repositório e conhece somente os métodos do contrato. Quem importa a implementação em memória e escolhe usá-la é o `main.mjs`. Um futuro adaptador de banco pode implementar os mesmos métodos sem mudar a regra do título.

## Para revisar na PR

- Onde você mudaria a regra de validação do título?
- Para chamar o mesmo caso de uso por HTTP, qual adaptador você adicionaria?
- Qual arquivo você abriria para trocar o adaptador em memória por outro?

Os testes chamam os casos de uso diretamente e verificam a criação, a listagem e a rejeição de um título vazio.

```sh
node --test services/tarefas/test/tarefas.test.mjs
```
