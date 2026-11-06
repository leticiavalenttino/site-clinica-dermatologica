import { state } from '../state.js';
import { produtosBaixoEstoque, produtosBaixoEstoqueClinica, produtosVencimentoCritico, produtosVencimentoProximo, diasParaVencer, produtoVencido, MINIMO_ESTOQUE_CLINICA, descreverEmbalagens, rotuloUnidade, rotuloEmbalagem } from '../models/produtos.js';
import { renderProdutoDetalheModal, wireProdutoDetalheModal } from './produtoDetalhe.js';

function rotuloVencimento(p){
  const dias = diasParaVencer(p);
  if(dias < 0) return `${p.nome} (vencido há ${Math.abs(dias)}d)`;
  if(dias === 0) return `${p.nome} (vence hoje)`;
  return `${p.nome} (vence em ${dias}d)`;
}

export function renderAlertBanner(){
  const baixos = produtosBaixoEstoque();
  const baixosClinica = produtosBaixoEstoqueClinica();
  const vencimentoCritico = produtosVencimentoCritico();
  const vencimentoProximo = produtosVencimentoProximo();
  if(baixos.length === 0 && baixosClinica.length === 0 && vencimentoCritico.length === 0 && vencimentoProximo.length === 0){
    return `<div class="alert-ok">Estoque OK em todos os produtos.</div>`;
  }
  return `
    ${vencimentoCritico.length === 0 ? '' : `
    <div class="alert-banner alert-banner-critico">
      <span class="alert-banner-icon" aria-hidden="true">⏰</span>
      <span>
        <strong>URGENTE — ${vencimentoCritico.length} produto(s) vencendo em até 30 dias:</strong>
        ${vencimentoCritico.map(p => `<a href="#" class="alert-banner-link" data-scroll-produto="${p.id}">${rotuloVencimento(p)}</a>`).join(', ')}
      </span>
    </div>
    `}
    ${baixosClinica.length === 0 ? '' : `
    <div class="alert-banner alert-banner-warning">
      <span class="alert-banner-icon" aria-hidden="true">⚠</span>
      <span>
        <strong>${baixosClinica.length} produto(s) abaixo do estoque mínimo da clínica — reponha o estoque local:</strong>
        ${baixosClinica.map(p => `<a href="#" class="alert-banner-link" data-scroll-produto="${p.id}">${p.nome}</a>`).join(', ')}
      </span>
    </div>
    `}
    ${vencimentoProximo.length === 0 ? '' : `
    <div class="alert-banner alert-banner-warning">
      <span class="alert-banner-icon" aria-hidden="true">⏰</span>
      <span>
        <strong>${vencimentoProximo.length} produto(s) vencendo em até 90 dias:</strong>
        ${vencimentoProximo.map(p => `<a href="#" class="alert-banner-link" data-scroll-produto="${p.id}">${rotuloVencimento(p)}</a>`).join(', ')}
      </span>
    </div>
    `}
    ${baixos.length === 0 ? '' : `
    <div class="alert-banner alert-banner-warning">
      <span class="alert-banner-icon" aria-hidden="true">⚠</span>
      <span>
        <strong>${baixos.length} produto(s) com estoque no depósito abaixo do mínimo — providencie a compra:</strong>
        ${baixos.map(p => `<a href="#" class="alert-banner-link" data-scroll-produto="${p.id}">${p.nome}</a>`).join(', ')}
      </span>
    </div>
    `}
  `;
}

export function wireAlertBanner(){
  document.querySelectorAll('[data-scroll-produto]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const alvo = document.getElementById(`produto-${link.dataset.scrollProduto}`);
      if(!alvo) return;
      alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alvo.classList.add('destaque-produto');
      setTimeout(() => alvo.classList.remove('destaque-produto'), 1600);
    });
  });
}

function formatarValidade(iso){
  if(!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

function rotuloLote(p){
  const partes = [];
  if(p.lote) partes.push(`Lote: ${p.lote}`);
  if(p.validade) partes.push(`Val. ${formatarValidade(p.validade)}`);
  return partes.join(' · ');
}

function nivelValidade(p){
  const dias = diasParaVencer(p);
  if(dias === null) return '';
  if(dias <= 30) return 'critico';
  if(dias <= 90) return 'atencao';
  return '';
}

function nivelClinica(p){
  const minimo = p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA;
  if(p.estoqueClinica < minimo) return 'critico';
  const folga = minimo === 0 ? p.estoqueClinica : (p.estoqueClinica - minimo) / minimo;
  if(folga <= 0.5) return 'atencao';
  return 'ok';
}

const ROTULO_NIVEL = { critico: 'Crítico', atencao: 'Atenção', ok: 'Confortável' };
const ORDEM_NIVEL = { ok: 0, atencao: 1, critico: 2 };

function nivelBadge(p, nivelEstoque){
  const nivVal = nivelValidade(p) || 'ok';
  return ORDEM_NIVEL[nivVal] > ORDEM_NIVEL[nivelEstoque] ? nivVal : nivelEstoque;
}

function progressoClinica(p){
  const minimo = p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA;
  const base = Math.max(minimo, 1) * 2;
  return Math.min(100, Math.round((p.estoqueClinica / base) * 100));
}

function renderStatTiles(){
  const totalDeposito = state.produtos.reduce((s, p) => s + p.estoqueExterno, 0);
  const totalClinica = state.produtos.reduce((s, p) => s + p.estoqueClinica, 0);
  const abaixoMinimo = produtosBaixoEstoque().length;
  const especiais = state.produtos.filter(p => p.tipo === 'especial').length;

  return `
    <div class="stats-row">
      <div class="stat-tile">
        <span class="stat-tile-label">Embalagens no depósito</span>
        <div class="stat-tile-value"><span class="stat-tile-number">${totalDeposito}</span><span class="stat-tile-suffix">em ${state.produtos.length} produtos</span></div>
      </div>
      <div class="stat-tile">
        <span class="stat-tile-label">Itens na clínica</span>
        <div class="stat-tile-value"><span class="stat-tile-number">${totalClinica}</span><span class="stat-tile-suffix">prontos para uso</span></div>
      </div>
      <div class="stat-tile">
        <span class="stat-tile-label">Abaixo do mínimo</span>
        <div class="stat-tile-value"><span class="stat-tile-number">${abaixoMinimo}</span><span class="stat-tile-suffix">requer reposição</span></div>
      </div>
      <div class="stat-tile">
        <span class="stat-tile-label">Produtos especiais</span>
        <div class="stat-tile-value"><span class="stat-tile-number">${especiais}</span><span class="stat-tile-suffix">retirada controlada</span></div>
      </div>
    </div>
  `;
}

function renderCardsEstoque(){
  if(state.produtos.length === 0){
    return '<p>Nenhum produto cadastrado ainda.</p>';
  }
  const ordenados = [...state.produtos].sort((a, b) => {
    const minA = a.limiteClinica ?? MINIMO_ESTOQUE_CLINICA;
    const minB = b.limiteClinica ?? MINIMO_ESTOQUE_CLINICA;
    return (a.estoqueClinica - minA) - (b.estoqueClinica - minB);
  });
  return `
    <div class="estoque-cards">
      ${ordenados.map(p => {
        const nivel = nivelClinica(p);
        const badge = nivelBadge(p, nivel);
        const vencido = produtoVencido(p);
        return `
        <div class="estoque-card ${vencido ? 'vencido' : ''}" id="produto-${p.id}" data-abrir-produto="${p.id}">
          <div class="estoque-card-top">
            <strong>${p.nome}</strong>
            <span class="estoque-badge ${vencido ? 'vencido' : badge}">${vencido ? 'VENCIDO' : ROTULO_NIVEL[badge].toUpperCase()}</span>
          </div>
          ${p.descricao ? `<p class="estoque-card-desc">${p.descricao}</p>` : ''}
          ${rotuloLote(p) ? `<span class="estoque-card-lote ${nivelValidade(p)}">${rotuloLote(p)}</span>` : ''}
          <p class="estoque-card-secundario ${p.estoqueExterno < p.limite ? 'baixo' : ''}">${descreverEmbalagens(p, p.estoqueExterno)} no depósito · mín. ${p.limite} ${rotuloEmbalagem(p, p.limite)}</p>
          <div class="estoque-card-bottom">
            <div class="estoque-card-numero">
              <span class="numero-grande ${nivel}">${p.estoqueClinica}</span>
              <span class="numero-legenda">${rotuloUnidade(p, p.estoqueClinica)} clínica · mín. ${p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA}</span>
            </div>
            <div class="estoque-progress"><div class="estoque-progress-bar ${nivel}" style="width:${progressoClinica(p)}%"></div></div>
          </div>
          <span class="estoque-card-hint">Toque para ver todos os detalhes</span>
        </div>
      `;
      }).join('')}
    </div>
  `;
}
export function renderDashboard(){
  return `<h1>Visão geral</h1>${renderAlertBanner()}${renderStatTiles()}${renderCardsEstoque()}${state.produtoDetalheId ? renderProdutoDetalheModal() : ''}`;
}

export function wireDashboard(render){
  wireAlertBanner();

  document.querySelectorAll('[data-abrir-produto]').forEach(card => {
    card.addEventListener('click', () => {
      state.produtoDetalheId = card.dataset.abrirProduto;
      render();
    });
  });

  if(state.produtoDetalheId){
    wireProdutoDetalheModal(render);
  }
}