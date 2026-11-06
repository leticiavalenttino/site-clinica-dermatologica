import { state } from '../state.js';
import { addProduto, removeProduto, produtoVencido, MINIMO_ESTOQUE_CLINICA, rotuloUnidade, rotuloEmbalagem } from '../models/produtos.js';
import { renderAlertBanner, wireAlertBanner } from './dashboard.js';
import { renderProdutoDetalheModal, wireProdutoDetalheModal } from './produtoDetalhe.js';

function formatarValidade(iso){
  if(!iso) return '-';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

export function renderProdutos(){
  return `
    <h1>Produtos em clínica</h1>
    ${renderAlertBanner()}
    ${state.produtoDetalheId ? renderProdutoDetalheModal() : ''}
    <div class="panel">
      <h3>Catálogo</h3>
      ${state.produtos.length === 0 ? '<p>Nenhum produto cadastrado.</p>' : `
        <div class="table-scroll">
        <table class="tabela-catalogo">
          <thead><tr><th>Nome</th><th class="nao-quebra">Lote</th><th>Validade</th><th>Tipo</th><th>Valor</th><th>Estoque clínica</th><th>Estoque depósito</th><th>Mín. depósito</th><th>Mín. clínica</th><th></th></tr></thead>
          <tbody>
            ${state.produtos.map(p => {
              const vencido = produtoVencido(p);
              return `
              <tr class="${vencido ? 'linha-vencida' : ''}" id="produto-${p.id}">
                <td class="${p.estoqueExterno < p.limite ? 'nome-baixo' : ''} nome-clicavel" data-abrir-produto="${p.id}">${p.nome}</td>
                <td class="nao-quebra">${p.lote || '-'}</td>
                <td class="${vencido ? 'validade-vencida' : ''}"><span class="nao-quebra">${formatarValidade(p.validade)}</span>${vencido ? ' <strong>VENCIDO</strong>' : ''}</td>
                <td>${p.tipo}</td>
                <td class="nao-quebra">R$ ${p.valor.toFixed(2)}</td>
                <td class="${p.estoqueClinica < (p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA) ? 'clinica-baixa' : ''}">${p.estoqueClinica} ${rotuloUnidade(p, p.estoqueClinica)}</td>
                <td>${p.estoqueExterno} ${rotuloEmbalagem(p, p.estoqueExterno)}</td>
                <td>${p.limite}</td>
                <td>${p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA}</td>
                <td class="td-acoes"><div class="acoes-linha"><button class="btn btn-danger" data-remove-produto="${p.id}">Remover</button></div></td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        </div>
      `}
    </div>
    <div class="panel">
      <h3>Novo produto</h3>
      <form id="form-produto">
        <div class="field"><label>Nome <span class="required-asterisk">*</span></label><input id="pf-nome" type="text" required></div>
        <div class="field"><label>Descrição</label><input id="pf-descricao" type="text"></div>
        <div class="field"><label>Lote <span class="required-asterisk">*</span></label><input id="pf-lote" type="text" placeholder="Ex: L2024-08" required></div>
        <div class="field"><label>Data de vencimento <span class="required-asterisk">*</span></label><input id="pf-validade" type="date" required></div>
        <div class="field"><label>Nome da unidade de uso</label><input id="pf-nome-unidade" type="text" placeholder="Ex: ampola, par, un."></div>
        <div class="field"><label>Unidades por embalagem <span class="required-asterisk">*</span></label><input id="pf-unidades-embalagem" type="number" min="1" step="1" value="1" required></div>
        <div class="field"><label>Valor da embalagem (R$) <span class="required-asterisk">*</span></label><input id="pf-valor" type="number" step="0.01" min="0" required></div>
        <div class="field"><label>Estoque no depósito (em embalagens) <span class="required-asterisk">*</span></label><input id="pf-estoque-externo" type="number" min="0" step="1" required></div>
        <div class="field"><label>Estoque na clínica (em unidades) <span class="required-asterisk">*</span></label><input id="pf-estoque-clinica" type="number" min="0" step="1" placeholder="0" required></div>
        <div class="field"><label>Estoque mínimo no depósito (em embalagens) <span class="required-asterisk">*</span></label><input id="pf-limite" type="number" min="0" step="1" required></div>
        <div class="field"><label>Estoque mínimo na clínica (em unidades) <span class="required-asterisk">*</span></label><input id="pf-limite-clinica" type="number" min="0" step="1" value="${MINIMO_ESTOQUE_CLINICA}" required></div>
        <div class="field">
          <label>Tipo <span class="required-asterisk">*</span></label>
          <select id="pf-tipo" required>
            <option value="" disabled selected>Selecione...</option>
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

  document.getElementById('form-produto').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await addProduto({
      nome: document.getElementById('pf-nome').value,
      descricao: document.getElementById('pf-descricao').value,
      lote: document.getElementById('pf-lote').value,
      validade: document.getElementById('pf-validade').value,
      valor: document.getElementById('pf-valor').value,
      unidadesPorEmbalagem: document.getElementById('pf-unidades-embalagem').value,
      nomeUnidade: document.getElementById('pf-nome-unidade').value,
      estoqueExterno: document.getElementById('pf-estoque-externo').value,
      estoqueClinica: document.getElementById('pf-estoque-clinica').value,
      limite: document.getElementById('pf-limite').value,
      limiteClinica: document.getElementById('pf-limite-clinica').value,
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