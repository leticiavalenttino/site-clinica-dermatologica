import { state } from '../state.js';
import { removerMovimentacao } from '../models/movimentacoes.js';

const TIPOS_ENTRADA = new Set(['Entrada', 'Produto cadastrado']);

function formatarData(iso){
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function renderTabelaMovimentacao(titulo, lista){
  return `
    <div class="panel">
      <h3>${titulo}</h3>
      ${lista.length === 0 ? '<p>Nenhuma movimentação registrada ainda.</p>' : `
        <table class="tabela-mov">
          <thead>
            <tr>
              <th>Data/Hora</th><th>Usuário</th><th>Papel</th><th>Produto</th><th>Tipo</th><th>Qtd</th>
              ${state.currentUser.papel === 'admin' ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${lista.map(m => {
              const produto = state.produtos.find(p => p.nome === m.produtoNome);
              return `
              <tr>
                <td>${formatarData(m.data)}</td>
                <td>${m.usuario}</td>
                <td>${m.papel}</td>
                <td>${m.produtoNome}</td>
                <td>${produto ? produto.tipo : '-'}</td>
                <td>${m.quantidade}</td>
                ${state.currentUser.papel === 'admin' ? `<td><button class="btn btn-danger" data-remove-mov="${m.id}">Remover</button></td>` : ''}
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

export function renderMovimentacao(){
  const ordenadas = [...state.movimentacoes].sort((a,b) => b.data.localeCompare(a.data));
  const entradas = ordenadas.filter(m => TIPOS_ENTRADA.has(m.tipo));
  const saidas = ordenadas.filter(m => !TIPOS_ENTRADA.has(m.tipo));
  return `
    <h1>Movimentação</h1>
    ${renderTabelaMovimentacao('Entradas', entradas)}
    ${renderTabelaMovimentacao('Saídas', saidas)}
  `;
}

export function wireMovimentacao(render){
  document.querySelectorAll('[data-remove-mov]').forEach(btn => {
    btn.addEventListener('click', () => {
      removerMovimentacao(btn.dataset.removeMov).then(render);
    });
  });
}