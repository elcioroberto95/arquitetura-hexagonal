import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('consumir o mesmo evento após reiniciar mantém uma conclusão por tarefa', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'hexagonal-conclusoes-'));
  const arquivo = join(pasta, 'conclusoes.sqlite');
  const comando = fileURLToPath(new URL('../src/consumir-eventos.ts', import.meta.url));

  function consumir(...ids: string[]): string {
    const entrada = ids.map((tarefaId) => JSON.stringify({ tipo: 'TarefaConcluida', tarefaId })).join('\n');
    const resultado = spawnSync(process.execPath, [comando], { cwd: pasta, input: entrada, encoding: 'utf8' });
    assert.equal(resultado.status, 0, resultado.stderr);
    return resultado.stdout;
  }

  try {
    assert.match(consumir('tarefa-1'), /Conclusão registrada para tarefa-1/);
    const saida = consumir('tarefa-1', 'tarefa-2');
    assert.match(saida, /Conclusão já registrada para tarefa-1/);
    assert.match(saida, /Conclusão registrada para tarefa-2/);

    const banco = new DatabaseSync(arquivo, { readOnly: true });
    try {
      const linhas = banco.prepare('SELECT tarefa_id FROM conclusoes ORDER BY tarefa_id').all();
      assert.deepEqual(linhas.map(({ tarefa_id }) => tarefa_id), ['tarefa-1', 'tarefa-2']);
    } finally {
      banco.close();
    }
  } finally {
    rmSync(arquivo, { force: true });
    rmdirSync(pasta);
  }
});
