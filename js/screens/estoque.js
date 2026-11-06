import { state } from '../state.js';
import { addProduto, adicionarEntrada, darBaixaSimples, abrirConfirmacaoEspecial, removeProduto, transferirParaClinica, produtoVencido, MINIMO_ESTOQUE_CLINICA, descreverQuantidade, descreverEmbalagens, unidadesPorEmbalagem, rotuloUnidade, rotuloEmbalagem, fracionado } from '../models/produtos.js';
import { ehMedica, podeGerenciarClinica } from '../models/permissoes.js';
import { renderAlertBanner, wireAlertBanner } from './dashboard.js';
import { renderProdutoDetalheModal, wireProdutoDetalheModal } from './produtoDetalhe.js';

const ICONE_MOVIMENTACAO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;

function formatarValidade(iso){
  if(!iso) return '-';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

function renderModalNovoProduto(){
  return `
    <div class="modal-backdrop" id="backdrop-novo-produto">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>Cadastrar novo produto</h2>
          <button type="button" class="modal-close" id="btn-fechar-novo-produto" aria-label="Fechar">&times;</button>
        </div>
        <form id="form-produto-estoque">
          <div class="field"><label>Nome <span class="required-asterisk">*</span></label><input id="npe-nome" type="text" required></div>
          <div class="field"><label>Descrição</label><input id="npe-descricao" type="text"></div>
          <div class="field"><label>Lote <span class="required-asterisk">*</span></label><input id="npe-lote" type="text" placeholder="Ex: L2024-08" required></div>
          <div class="field"><label>Data de vencimento <span class="required-asterisk">*</span></label><input id="npe-validade" type="date" required></div>
          <div class="field"><label>Nome da unidade de uso</label><input id="npe-nome-unidade" type="text" placeholder="Ex: ampola, par, un."></div>
          <div class="field"><label>Unidades por embalagem <span class="required-asterisk">*</span></label><input id="npe-unidades-embalagem" type="number" min="1" step="1" value="1" required></div>
          <div class="field"><label>Valor da embalagem (R$) <span class="required-asterisk">*</span></label><input id="npe-valor" type="number" step="0.01" min="0" required></div>
          <div class="field"><label>Estoque no depósito (em embalagens) <span class="required-asterisk">*</span></label><input id="npe-estoque-externo" type="number" min="0" step="1" required></div>
          <div class="field"><label>Estoque na clínica (em unidades) <span class="required-asterisk">*</span></label><input id="npe-estoque-clinica" type="number" min="0" step="1" placeholder="0" required></div>
          <div class="field"><label>Estoque mínimo no depósito (em embalagens) <span class="required-asterisk">*</span></label><input id="npe-limite" type="number" min="0" step="1" required></div>
          <div class="field"><label>Estoque mínimo na clínica (em unidades) <span class="required-asterisk">*</span></label><input id="npe-limite-clinica" type="number" min="0" step="1" value="${MINIMO_ESTOQUE_CLINICA}" required></div>
          <div class="field">
            <label>Tipo <span class="required-asterisk">*</span></label>
            <select id="npe-tipo" required>
              <option value="" disabled selected>Selecione...</option>
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
  const podeEspecial = ehMedica();
  const bloqueado = isEspecial && !podeEspecial;
  const vencido = produtoVencido(p);
  return `
    <div class="modal-backdrop" id="backdrop-registrar-mov">
      <div class="modal">
        <div class="modal-header">
          <h3>Registrar movimentação</h3>
          <button type="button" class="modal-close" id="btn-fechar-registrar-mov" aria-label="Fechar">&times;</button>
        </div>
        <p style="color:var(--muted);font-size:0.9rem;margin-top:-8px;">${p.nome}</p>
        <p style="color:var(--muted);font-size:0.85rem;margin-top:-8px;">Clínica: ${descreverQuantidade(p, p.estoqueClinica)} · Depósito: ${descreverEmbalagens(p, p.estoqueExterno)}</p>
        ${vencido ? `
          <p style="color:var(--alert);font-weight:700;">Este produto está vencido e não pode mais ser movimentado. Peça para a dermatologista, a ginecologista ou a administração removê-lo do catálogo.</p>
          <button type="button" class="btn" id="btn-cancelar-registrar-mov">Fechar</button>
        ` : `
        <form id="form-registrar-mov">
          <div class="field">
            <label>Tipo</label>
            <select id="rm-tipo">
              <option value="entrada">Entrada (compra)</option>
              <option value="transferencia">Transferir para a clínica</option>
              ${bloqueado ? '' : `<option value="saida">${isEspecial ? 'Aprovar com senha' : 'Registrar uso'}</option>`}
            </select>
          </div>
          <div class="field">
            <label id="rm-label-quantidade">Quantidade</label>
            <input id="rm-quantidade" type="number" min="1" required>
            <p id="rm-ajuda-quantidade" class="campo-ajuda"></p>
          </div>
          ${bloqueado ? '<p style="color:var(--muted);font-size:0.85rem;">Somente a dermatologista ou a ginecologista pode retirar este item.</p>' : ''}
          <button type="submit" class="btn btn-primary">Confirmar</button>
          <button type="button" class="btn" id="btn-cancelar-registrar-mov">Cancelar</button>
        </form>
        `}
      </div>
    </div>
  `;
}

export function renderEstoqueOperacional(){
  const termo = state.buscaCatalogo.trim().toLowerCase();
  const produtosFiltrados = termo
    ? state.produtos.filter(p => p.nome.toLowerCase().includes(termo))
    : state.produtos;
  const podeRemover = podeGerenciarClinica();

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1>Catálogo</h1>
      <button id="btn-toggle-novo-produto" class="btn btn-primary" title="Cadastrar novo produto" style="font-size:1.3rem;line-height:1;padding:8px 16px;">+</button>
    </div>
    ${renderAlertBanner()}
    ${state.mostrarFormNovoProduto ? renderModalNovoProduto() : ''}
    ${state.produtoMovimentandoId ? renderModalRegistrarMovimentacao() : ''}
    ${state.produtoDetalheId ? renderProdutoDetalheModal() : ''}
    <div class="panel">
      <div class="field" style="margin-bottom:16px;">
        <input id="busca-catalogo" type="text" placeholder="Buscar produto por nome..." value="${state.buscaCatalogo}">
      </div>
      ${state.produtos.length === 0 ? '<p>Nenhum produto cadastrado ainda.</p>' : `
        <div class="table-scroll">
        <table id="tabela-catalogo" class="tabela-catalogo">
          <thead><tr><th>Produto</th><th class="nao-quebra">Lote</th><th>Validade</th><th>Tipo</th><th>Estoque clínica</th><th>Estoque depósito</th><th>Mín. depósito</th><th>Mín. clínica</th><th></th></tr></thead>
          <tbody>
            ${produtosFiltrados.map(p => {
                const vencido = produtoVencido(p);
                return `
                <tr class="${vencido ? 'linha-vencida' : ''}" data-nome="${p.nome.toLowerCase()}" id="produto-${p.id}">
                  <td class="${p.estoqueExterno < p.limite ? 'nome-baixo' : ''} nome-clicavel" data-abrir-produto="${p.id}">${p.nome}</td>
                  <td class="nao-quebra">${p.lote || '-'}</td>
                  <td class="${vencido ? 'validade-vencida' : ''}"><span class="nao-quebra">${formatarValidade(p.validade)}</span>${vencido ? ' <strong>VENCIDO</strong>' : ''}</td>
                  <td>${p.tipo}</td>
                  <td class="${p.estoqueClinica < (p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA) ? 'clinica-baixa' : ''}">${p.estoqueClinica} ${rotuloUnidade(p, p.estoqueClinica)}</td>
                  <td>${p.estoqueExterno} ${rotuloEmbalagem(p, p.estoqueExterno)}</td>
                  <td>${p.limite}</td>
                  <td>${p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA}</td>
                  <td class="td-acoes">
                    <div class="acoes-linha">
                      <button class="btn btn-primary btn-icon btn-registrar-mov" data-registrar-mov="${p.id}">${ICONE_MOVIMENTACAO} Registrar Movimentação</button>
                      ${podeRemover ? `<button class="btn btn-danger" data-remove-produto="${p.id}">Remover</button>` : ''}
                    </div>
                  </td>
                </tr>
              `;
              }).join('')}
          </tbody>
        </table>
        </div>
        <p id="busca-catalogo-vazio" style="display:none;color:var(--muted);margin-top:12px;">Nenhum produto encontrado.</p>
      `}
    </div>
  `;
}

export function wireEstoque(render){
  wireAlertBanner();

  document.querySelectorAll('[data-abrir-produto]').forEach(cel => {
    cel.addEventListener('click', () => {
      state.produtoDetalheId = cel.dataset.abrirProduto;
      render();
    });
  });

  if(state.produtoDetalheId){
    wireProdutoDetalheModal(render);
  }

  document.getElementById('btn-toggle-novo-produto').addEventListener('click', () => {
    state.mostrarFormNovoProduto = !state.mostrarFormNovoProduto;
    render();
  });

  const fecharNovoProduto = () => {
    state.mostrarFormNovoProduto = false;
    render();
  };
  ['btn-cancelar-novo-produto', 'btn-fechar-novo-produto'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', fecharNovoProduto);
  });

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
        lote: document.getElementById('npe-lote').value,
        validade: document.getElementById('npe-validade').value,
        valor: document.getElementById('npe-valor').value,
        unidadesPorEmbalagem: document.getElementById('npe-unidades-embalagem').value,
        nomeUnidade: document.getElementById('npe-nome-unidade').value,
        estoqueExterno: document.getElementById('npe-estoque-externo').value,
        estoqueClinica: document.getElementById('npe-estoque-clinica').value,
        limite: document.getElementById('npe-limite').value,
        limiteClinica: document.getElementById('npe-limite-clinica').value,
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

  document.querySelectorAll('[data-remove-produto]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeProduto(btn.dataset.removeProduto).then(render);
    });
  });

  const fecharRegistrarMov = () => {
    state.produtoMovimentandoId = null;
    render();
  };
  ['btn-cancelar-registrar-mov', 'btn-fechar-registrar-mov'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', fecharRegistrarMov);
  });

  const backdropMov = document.getElementById('backdrop-registrar-mov');
  if(backdropMov){
    backdropMov.addEventListener('click', (e) => {
      if(e.target === backdropMov){
        state.produtoMovimentandoId = null;
        render();
      }
    });
  }

  // a compra é digitada em caixas; transferência e uso, em unidades
  const selectTipoMov = document.getElementById('rm-tipo');
  if(selectTipoMov){
    const p = state.produtos.find(x => x.id === state.produtoMovimentandoId);
    const label = document.getElementById('rm-label-quantidade');
    const ajuda = document.getElementById('rm-ajuda-quantidade');
    const inputQtd = document.getElementById('rm-quantidade');

    const atualizarAjuda = () => {
      if(!p) return;
      const porCaixa = unidadesPorEmbalagem(p);
      const digitado = Number(inputQtd.value);

      // depósito é em embalagens (compra e transferência); clínica, em unidades
      if(selectTipoMov.value === 'entrada'){
        label.textContent = fracionado(p) ? 'Quantas embalagens comprou' : 'Quantidade';
        ajuda.textContent = !fracionado(p) ? ''
          : digitado > 0
            ? `Entram ${descreverEmbalagens(p, digitado)} no depósito.`
            : `Cada caixa tem ${porCaixa} ${rotuloUnidade(p, porCaixa)}.`;
      } else if(selectTipoMov.value === 'transferencia'){
        label.textContent = fracionado(p) ? 'Quantas embalagens levar para a clínica' : 'Quantidade';
        ajuda.textContent = digitado > 0 && fracionado(p)
          ? `A clínica recebe ${digitado * porCaixa} ${rotuloUnidade(p, digitado * porCaixa)}. Disponível no depósito: ${descreverEmbalagens(p, p.estoqueExterno)}.`
          : `Disponível no depósito: ${descreverEmbalagens(p, p.estoqueExterno)}.`;
      } else {
        label.textContent = `Quantidade em ${rotuloUnidade(p, 2)}`;
        ajuda.textContent = `Disponível na clínica: ${descreverQuantidade(p, p.estoqueClinica)}.`;
      }
    };

    atualizarAjuda();
    selectTipoMov.addEventListener('change', atualizarAjuda);
    inputQtd.addEventListener('input', atualizarAjuda);
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
      } else if(tipo === 'transferencia'){
        transferirParaClinica(id, quantidade).then(render);
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
