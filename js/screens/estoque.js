import { state } from '../state.js';
import { addProduto, adicionarEntrada, darBaixaSimples, abrirConfirmacaoEspecial } from '../models/produtos.js';
import { renderAlertBanner } from './dashboard.js';

const ICONE_MOVIMENTACAO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;

function renderModalNovoProduto(){
  return `
    <div class="modal-backdrop" id="backdrop-novo-produto">
      <div class="modal modal-lg">
        <h2>Cadastrar novo produto</h2>
        <form id="form-produto-estoque">
          <div class="field"><label>Nome</label><input id="npe-nome" type="text" required></div>
          <div class="field"><label>Descrição</label><input id="npe-descricao" type="text"></div>
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
          <button type="button" class="btn" id="btn-cancelar-novo-produto">Cancelar</button>
        </form>
      </div>
    </div>
  `;
}

function renderModalRegistrarMovimentacao(){
  const p = state.produtos.find(x => x.id === state.produtoMovimentandoId);
  if(!p) return '';
  const isEspecial = p.tipo === 'especial';
  const podeEspecial = state.currentUser.papel === 'dermatologista';
  const bloqueado = isEspecial && !podeEspecial;
  return `
    <div class="modal-backdrop" id="backdrop-registrar-mov">
      <div class="modal">
        <h3>Registrar movimentação</h3>
        <p style="color:var(--muted);font-size:0.9rem;margin-top:-8px;">${p.nome}</p>
        <form id="form-registrar-mov">
          <div class="field">
            <label>Tipo</label>
            <select id="rm-tipo">
              <option value="entrada">Entrada</option>
              ${bloqueado ? '' : `<option value="saida">${isEspecial ? 'Aprovar com senha' : 'Registrar uso'}</option>`}
            </select>
          </div>
          <div class="field"><label>Quantidade</label><input id="rm-quantidade" type="number" min="1" required></div>
          ${bloqueado ? '<p style="color:var(--muted);font-size:0.85rem;">Somente a dermatologista pode retirar este item.</p>' : ''}
          <button type="submit" class="btn btn-primary">Confirmar</button>
          <button type="button" class="btn" id="btn-cancelar-registrar-mov">Cancelar</button>
        </form>
      </div>
    </div>
  `;
}

export function renderEstoqueOperacional(){
  const termo = state.buscaCatalogo.trim().toLowerCase();
  const produtosFiltrados = termo
    ? state.produtos.filter(p => p.nome.toLowerCase().includes(termo))
    : state.produtos;

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1>Catálogo</h1>
      <button id="btn-toggle-novo-produto" class="btn btn-primary" title="Cadastrar novo produto" style="font-size:1.3rem;line-height:1;padding:8px 16px;">+</button>
    </div>
    ${renderAlertBanner()}
    ${state.mostrarFormNovoProduto ? renderModalNovoProduto() : ''}
    ${state.produtoMovimentandoId ? renderModalRegistrarMovimentacao() : ''}
    <div class="panel">
      <div class="field" style="margin-bottom:16px;">
        <input id="busca-catalogo" type="text" placeholder="Buscar produto por nome..." value="${state.buscaCatalogo}">
      </div>
      ${state.produtos.length === 0 ? '<p>Nenhum produto cadastrado ainda.</p>' : `
        <table id="tabela-catalogo">
          <thead><tr><th>Produto</th><th>Tipo</th><th>Estoque</th><th>Estoque mínimo</th><th></th></tr></thead>
          <tbody>
            ${produtosFiltrados.map(p => `
                <tr data-nome="${p.nome.toLowerCase()}">
                  <td class="${p.estoque < p.limite ? 'nome-baixo' : ''}">${p.nome}</td>
                  <td>${p.tipo}</td>
                  <td>${p.estoque}</td>
                  <td>${p.limite}</td>
                  <td>
                    <button class="btn btn-primary btn-icon" data-registrar-mov="${p.id}">${ICONE_MOVIMENTACAO} Registrar Movimentação</button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
        <p id="busca-catalogo-vazio" style="display:none;color:var(--muted);margin-top:12px;">Nenhum produto encontrado.</p>
      `}
    </div>
  `;
}

export function wireEstoque(render){
  document.getElementById('btn-toggle-novo-produto').addEventListener('click', () => {
    state.mostrarFormNovoProduto = !state.mostrarFormNovoProduto;
    render();
  });

  const btnCancelar = document.getElementById('btn-cancelar-novo-produto');
  if(btnCancelar){
    btnCancelar.addEventListener('click', () => {
      state.mostrarFormNovoProduto = false;
      render();
    });
  }

  const backdrop = document.getElementById('backdrop-novo-produto');
  if(backdrop){
    backdrop.addEventListener('click', (e) => {
      if(e.target === backdrop){
        state.mostrarFormNovoProduto = false;
        render();
      }
    });
  }

  const formProdutoEstoque = document.getElementById('form-produto-estoque');
  if(formProdutoEstoque){
    formProdutoEstoque.addEventListener('submit', async (e)=>{
      e.preventDefault();
      await addProduto({
        nome: document.getElementById('npe-nome').value,
        descricao: document.getElementById('npe-descricao').value,
        valor: document.getElementById('npe-valor').value,
        estoque: document.getElementById('npe-estoque').value,
        limite: document.getElementById('npe-limite').value,
        tipo: document.getElementById('npe-tipo').value,
      });
      render();
    });
  }

  const buscaInput = document.getElementById('busca-catalogo');
  if(buscaInput){
    buscaInput.addEventListener('input', () => {
      state.buscaCatalogo = buscaInput.value;
      const termo = buscaInput.value.trim().toLowerCase();
      let algumVisivel = false;
      document.querySelectorAll('#tabela-catalogo tbody tr').forEach(tr => {
        const visivel = tr.dataset.nome.includes(termo);
        tr.style.display = visivel ? '' : 'none';
        if(visivel) algumVisivel = true;
      });
      const vazio = document.getElementById('busca-catalogo-vazio');
      if(vazio) vazio.style.display = algumVisivel ? 'none' : 'block';
    });
  }

  document.querySelectorAll('[data-registrar-mov]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.produtoMovimentandoId = btn.dataset.registrarMov;
      render();
    });
  });

  const btnCancelarMov = document.getElementById('btn-cancelar-registrar-mov');
  if(btnCancelarMov){
    btnCancelarMov.addEventListener('click', () => {
      state.produtoMovimentandoId = null;
      render();
    });
  }

  const backdropMov = document.getElementById('backdrop-registrar-mov');
  if(backdropMov){
    backdropMov.addEventListener('click', (e) => {
      if(e.target === backdropMov){
        state.produtoMovimentandoId = null;
        render();
      }
    });
  }

  const formRegistrarMov = document.getElementById('form-registrar-mov');
  if(formRegistrarMov){
    formRegistrarMov.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = state.produtoMovimentandoId;
      const p = state.produtos.find(x => x.id === id);
      const tipo = document.getElementById('rm-tipo').value;
      const quantidade = document.getElementById('rm-quantidade').value;
      const isEspecial = p && p.tipo === 'especial';

      if(tipo === 'entrada'){
        adicionarEntrada(id, quantidade).then(render);
      } else if(isEspecial){
        state.produtoMovimentandoId = null;
        abrirConfirmacaoEspecial(id, quantidade);
        render();
        return;
      } else {
        darBaixaSimples(id, quantidade).then(render);
      }
      state.produtoMovimentandoId = null;
    });
  }
}
