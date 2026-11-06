import { state } from '../state.js';
import { editarProduto, podeEditarProduto, MINIMO_ESTOQUE_CLINICA, UNIDADE_PADRAO, unidadesPorEmbalagem, rotuloUnidade, rotuloEmbalagem, valorUnitario, descreverQuantidade, descreverEmbalagens, fracionado } from '../models/produtos.js';

function formatarValidade(iso){
  if(!iso) return '-';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

function renderDetalheView(p){
  return `
    <div class="produto-detalhe-grid">
      <div class="produto-detalhe-item full"><span class="label">Descrição</span><span class="valor">${p.descricao || '-'}</span></div>
      <div class="produto-detalhe-item"><span class="label">Lote</span><span class="valor">${p.lote || '-'}</span></div>
      <div class="produto-detalhe-item"><span class="label">Validade</span><span class="valor">${formatarValidade(p.validade)}</span></div>
      <div class="produto-detalhe-item"><span class="label">Tipo</span><span class="valor">${p.tipo === 'especial' ? 'Especial' : 'Simples'}</span></div>
      <div class="produto-detalhe-item"><span class="label">Embalagem</span><span class="valor">${unidadesPorEmbalagem(p)} ${rotuloUnidade(p, unidadesPorEmbalagem(p))} por caixa</span></div>
      <div class="produto-detalhe-item"><span class="label">Valor da embalagem</span><span class="valor">R$ ${p.valor.toFixed(2)}</span></div>
      ${fracionado(p) ? `<div class="produto-detalhe-item"><span class="label">Valor por ${rotuloUnidade(p, 1)}</span><span class="valor">R$ ${valorUnitario(p).toFixed(2)}</span></div>` : ''}
      <div class="produto-detalhe-item"><span class="label">Estoque na clínica</span><span class="valor">${descreverQuantidade(p, p.estoqueClinica)}</span></div>
      <div class="produto-detalhe-item"><span class="label">Estoque no depósito</span><span class="valor">${descreverEmbalagens(p, p.estoqueExterno)}</span></div>
      <div class="produto-detalhe-item"><span class="label">Mínimo na clínica</span><span class="valor">${p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA} ${rotuloUnidade(p, p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA)}</span></div>
      <div class="produto-detalhe-item"><span class="label">Mínimo no depósito</span><span class="valor">${p.limite} ${rotuloEmbalagem(p, p.limite)}</span></div>
    </div>
  `;
}

function renderFormEdicao(p){
  return `
    <form id="form-editar-produto">
      <div class="field"><label>Nome <span class="required-asterisk">*</span></label><input id="ep-nome" type="text" value="${p.nome}" required></div>
      <div class="field"><label>Descrição</label><input id="ep-descricao" type="text" value="${p.descricao || ''}"></div>
      <div class="field"><label>Lote <span class="required-asterisk">*</span></label><input id="ep-lote" type="text" value="${p.lote || ''}" required></div>
      <div class="field"><label>Data de vencimento <span class="required-asterisk">*</span></label><input id="ep-validade" type="date" value="${p.validade || ''}" required></div>
      <div class="field"><label>Nome da unidade de uso</label><input id="ep-nome-unidade" type="text" placeholder="Ex: ampola, par, un." value="${p.nomeUnidade || UNIDADE_PADRAO}"></div>
      <div class="field"><label>Unidades por embalagem <span class="required-asterisk">*</span></label><input id="ep-unidades-embalagem" type="number" min="1" step="1" value="${unidadesPorEmbalagem(p)}" required></div>
      <div class="field"><label>Valor da embalagem (R$) <span class="required-asterisk">*</span></label><input id="ep-valor" type="number" step="0.01" min="0" value="${p.valor}" required></div>
      <div class="field"><label>Estoque mínimo no depósito (em embalagens) <span class="required-asterisk">*</span></label><input id="ep-limite" type="number" min="0" step="1" value="${p.limite}" required></div>
      <div class="field"><label>Estoque mínimo na clínica (em unidades) <span class="required-asterisk">*</span></label><input id="ep-limite-clinica" type="number" min="0" step="1" value="${p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA}" required></div>
      <div class="field">
        <label>Tipo</label>
        <select id="ep-tipo">
          <option value="simples" ${p.tipo === 'simples' ? 'selected' : ''}>Simples</option>
          <option value="especial" ${p.tipo === 'especial' ? 'selected' : ''}>Especial</option>
        </select>
      </div>
      <p style="color:var(--muted);font-size:0.8rem;margin-top:-8px;">Estoque atual: ${descreverQuantidade(p, p.estoqueClinica)} na clínica · ${descreverEmbalagens(p, p.estoqueExterno)} no depósito. Para alterar quantidades, use "Registrar movimentação".</p>
      <button type="submit" class="btn btn-primary">Salvar alterações</button>
      <button type="button" class="btn" id="btn-cancelar-editar-produto">Cancelar</button>
    </form>
  `;
}

export function renderProdutoDetalheModal(){
  const p = state.produtos.find(x => x.id === state.produtoDetalheId);
  if(!p) return '';
  const editando = state.produtoEditandoId === p.id;
  return `
    <div class="modal-backdrop" id="backdrop-detalhe-produto">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>${p.nome}</h2>
          <button type="button" class="modal-close" id="btn-fechar-detalhe-produto-x" aria-label="Fechar">&times;</button>
        </div>
        ${editando ? renderFormEdicao(p) : renderDetalheView(p)}
        ${!editando ? `
        <div class="modal-acoes">
          ${podeEditarProduto() ? `<button type="button" class="btn btn-primary" id="btn-editar-produto">Editar</button>` : ''}
          <button type="button" class="btn" id="btn-fechar-detalhe-produto">Fechar</button>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function wireProdutoDetalheModal(render){
  const fechar = () => {
    state.produtoDetalheId = null;
    state.produtoEditandoId = null;
    render();
  };

  ['btn-fechar-detalhe-produto', 'btn-fechar-detalhe-produto-x'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', fechar);
  });

  const backdrop = document.getElementById('backdrop-detalhe-produto');
  if(backdrop){
    backdrop.addEventListener('click', (e) => {
      if(e.target === backdrop) fechar();
    });
  }

  const btnEditar = document.getElementById('btn-editar-produto');
  if(btnEditar){
    btnEditar.addEventListener('click', () => {
      state.produtoEditandoId = state.produtoDetalheId;
      render();
    });
  }

  const btnCancelarEditar = document.getElementById('btn-cancelar-editar-produto');
  if(btnCancelarEditar){
    btnCancelarEditar.addEventListener('click', () => {
      state.produtoEditandoId = null;
      render();
    });
  }

  const form = document.getElementById('form-editar-produto');
  if(form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await editarProduto(state.produtoEditandoId, {
        nome: document.getElementById('ep-nome').value,
        descricao: document.getElementById('ep-descricao').value,
        lote: document.getElementById('ep-lote').value,
        validade: document.getElementById('ep-validade').value,
        valor: document.getElementById('ep-valor').value,
        unidadesPorEmbalagem: document.getElementById('ep-unidades-embalagem').value,
        nomeUnidade: document.getElementById('ep-nome-unidade').value,
        limite: document.getElementById('ep-limite').value,
        limiteClinica: document.getElementById('ep-limite-clinica').value,
        tipo: document.getElementById('ep-tipo').value,
      });
      state.produtoEditandoId = null;
      render();
    });
  }
}
