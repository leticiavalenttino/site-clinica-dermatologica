import { state } from '../state.js';
import { addProduto, removeProduto } from '../models/produtos.js';
import { renderAlertBanner } from './dashboard.js';

export function renderProdutos(){
  return `
    <h1>Produtos</h1>
    ${renderAlertBanner()}
    <div class="panel">
      <h3>Catálogo</h3>
      ${state.produtos.length === 0 ? '<p>Nenhum produto cadastrado.</p>' : `
        <table>
          <thead><tr><th>Nome</th><th>Tipo</th><th>Valor</th><th>Estoque</th><th>Limite</th><th></th></tr></thead>
          <tbody>
            ${state.produtos.map(p => `
              <tr>
                <td class="${p.estoque < p.limite ? 'nome-baixo' : ''}">${p.nome}</td>
                <td>${p.tipo}</td>
                <td>R$ ${p.valor.toFixed(2)}</td>
                <td>${p.estoque}</td>
                <td>${p.limite}</td>
                <td><button class="btn btn-danger" data-remove-produto="${p.id}">Remover</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
    <div class="panel">
      <h3>Novo produto</h3>
      <form id="form-produto">
        <div class="field"><label>Nome</label><input id="pf-nome" type="text" required></div>
        <div class="field"><label>Descrição</label><input id="pf-descricao" type="text"></div>
        <div class="field"><label>Valor (R$)</label><input id="pf-valor" type="number" step="0.01" required></div>
        <div class="field"><label>Estoque atual</label><input id="pf-estoque" type="number" required></div>
        <div class="field"><label>Estoque mínimo</label><input id="pf-limite" type="number" required></div>
        <div class="field">
          <label>Tipo</label>
          <select id="pf-tipo">
            <option value="simples">Simples</option>
            <option value="especial">Especial</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Cadastrar</button>
      </form>
    </div>
  `;
}

export function wireProdutos(render){
  document.getElementById('form-produto').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await addProduto({
      nome: document.getElementById('pf-nome').value,
      descricao: document.getElementById('pf-descricao').value,
      valor: document.getElementById('pf-valor').value,
      estoque: document.getElementById('pf-estoque').value,
      limite: document.getElementById('pf-limite').value,
      tipo: document.getElementById('pf-tipo').value,
    });
    render();
  });

  document.querySelectorAll('[data-remove-produto]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeProduto(btn.dataset.removeProduto).then(render);
    });
  });
}