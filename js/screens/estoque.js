import { state } from '../state.js';
import { addProduto, adicionarEntrada, darBaixaSimples, abrirConfirmacaoEspecial } from '../models/produtos.js';
import { renderAlertBanner } from './dashboard.js';

export function renderEstoqueOperacional(){
  const podeEspecial = state.currentUser.papel === 'dermatologista';
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1>Catálogo</h1>
      <button id="btn-toggle-novo-produto" class="btn btn-primary" title="Cadastrar novo produto" style="font-size:1.3rem;line-height:1;padding:8px 16px;">+</button>
    </div>
    ${renderAlertBanner()}
    ${state.mostrarFormNovoProduto ? `
    <div class="panel">
      <h3>Cadastrar novo produto</h3>
      <form id="form-produto-estoque">
        <div class="field"><label>Nome</label><input id="npe-nome" type="text" required></div>
        <div class="field"><label>Valor (R$)</label><input id="npe-valor" type="number" step="0.01" required></div>
        <div class="field"><label>Estoque inicial</label><input id="npe-estoque" type="number" required></div>
        <div class="field"><label>Estoque mínimo</label><input id="npe-limite" type="number" required></div>
        <div class="field">
          <label>Tipo</label>
          <select id="npe-tipo">
            <option value="simples">Simples</option>
            <option value="especial">Especial</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Cadastrar produto</button>
      </form>
    </div>
    ` : ''}
    <div class="panel">
      <h3>Catálogo e movimentação</h3>
      ${state.produtos.length === 0 ? '<p>Nenhum produto cadastrado ainda.</p>' : `
        <table>
          <thead><tr><th>Produto</th><th>Tipo</th><th>Estoque</th><th>Estoque mínimo</th><th>Entrada</th><th>Registrar uso</th></tr></thead>
          <tbody>
            ${state.produtos.map(p => {
              const isEspecial = p.tipo === 'especial';
              const bloqueado = isEspecial && !podeEspecial;
              return `
                <tr>
                  <td class="${p.estoque < p.limite ? 'nome-baixo' : ''}">${p.nome}</td>
                  <td>${p.tipo}</td>
                  <td>${p.estoque}</td>
                  <td>${p.limite}</td>
                  <td>
                    <input type="number" min="1" style="width:60px" id="entrada-${p.id}">
                    <button class="btn btn-primary" data-entrada="${p.id}">Registrar entrada</button>
                  </td>
                  <td>
                    ${bloqueado
                      ? '<small>Somente a dermatologista pode retirar este item.</small>'
                      : `
                        <input type="number" min="1" style="width:60px" id="qty-${p.id}">
                        <button class="btn btn-primary" data-baixa="${p.id}" data-especial="${isEspecial ? '1' : '0'}">
                          ${isEspecial ? 'Aprovar c/ RQE' : 'Registrar uso'}
                        </button>
                      `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `}
    </div>
  `;
}

export function wireEstoque(render){
  document.getElementById('btn-toggle-novo-produto').addEventListener('click', () => {
    state.mostrarFormNovoProduto = !state.mostrarFormNovoProduto;
    render();
  });

  const formProdutoEstoque = document.getElementById('form-produto-estoque');
  if(formProdutoEstoque){
    formProdutoEstoque.addEventListener('submit', async (e)=>{
      e.preventDefault();
      await addProduto({
        nome: document.getElementById('npe-nome').value,
        valor: document.getElementById('npe-valor').value,
        estoque: document.getElementById('npe-estoque').value,
        limite: document.getElementById('npe-limite').value,
        tipo: document.getElementById('npe-tipo').value,
      });
      render();
    });
  }

  document.querySelectorAll('[data-entrada]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.entrada;
      const qtyInput = document.getElementById('entrada-' + id);
      const qty = qtyInput ? qtyInput.value : '';
      adicionarEntrada(id, qty).then(render);
    });
  });

  document.querySelectorAll('[data-baixa]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.baixa;
      const especial = btn.dataset.especial === '1';
      const qtyInput = document.getElementById('qty-' + id);
      const qty = qtyInput ? qtyInput.value : '';

      if(especial){
        abrirConfirmacaoEspecial(id, qty);
        render();
      } else {
        darBaixaSimples(id, qty).then(render);
      }
    });
  });
}