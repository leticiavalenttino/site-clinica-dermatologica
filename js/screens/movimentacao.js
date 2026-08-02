import { state } from '../state.js';
import { removerMovimentacao } from '../models/movimentacoes.js';

export function renderMovimentacao(){
  const ordenadas = [...state.movimentacoes].sort((a,b) => b.data.localeCompare(a.data));
  return `
    <h1>Movimentação</h1>
    <div class="panel">
      <h3>Histórico de entradas e saídas</h3>
      ${ordenadas.length === 0 ? '<p>Nenhuma movimentação registrada ainda.</p>' : `
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th><th>Usuário</th><th>Papel</th><th>Produto</th><th>Tipo</th><th>Qtd</th>
              ${state.currentUser.papel === 'admin' ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${ordenadas.map(m => `
              <tr>
                <td>${new Date(m.data).toLocaleString('pt-BR')}</td>
                <td>${m.usuario}</td>
                <td>${m.papel}</td>
                <td>${m.produtoNome}</td>
                <td>${m.tipo}</td>
                <td>${m.quantidade}</td>
                ${state.currentUser.papel === 'admin' ? `<td><button class="btn btn-danger" data-remove-mov="${m.id}">Remover</button></td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

export function wireMovimentacao(render){
  document.querySelectorAll('[data-remove-mov]').forEach(btn => {
    btn.addEventListener('click', () => {
      removerMovimentacao(btn.dataset.removeMov).then(render);
    });
  });
}