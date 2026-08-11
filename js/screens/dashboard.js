import { state } from '../state.js';
import { produtosBaixoEstoque } from '../models/produtos.js';

export function renderAlertBanner(){
  const baixos = produtosBaixoEstoque();
  if(baixos.length === 0){
    return `<div class="alert-ok">Estoque OK em todos os produtos.</div>`;
  }
  return `
    <div class="alert-banner">
      <strong>${baixos.length} produto(s) abaixo do estoque mínimo:</strong>
      ${baixos.map(p => p.nome).join(', ')}
    </div>
  `;
}

function nivelEstoque(p){
  if(p.estoque < p.limite) return 'critico';
  const folga = p.limite === 0 ? p.estoque : (p.estoque - p.limite) / p.limite;
  if(folga <= 0.5) return 'atencao';
  return 'ok';
}

function renderCardsEstoque(){
  if(state.produtos.length === 0){
    return '<p>Nenhum produto cadastrado ainda.</p>';
  }
  const ordenados = [...state.produtos].sort((a, b) => (a.estoque - a.limite) - (b.estoque - b.limite));
  return `
    <div class="estoque-cards">
      ${ordenados.map(p => `
        <div class="estoque-card ${nivelEstoque(p)}">
          <strong>${p.nome}</strong>
          ${p.descricao ? `<p class="estoque-card-desc">Descrição: ${p.descricao}</p>` : ''}
          <div class="estoque-card-info">
            <span>${p.estoque}un. em estoque</span>
            <span>Mínimo: ${p.limite}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
export function renderDashboard(){
  return `<h1>Visão geral</h1>${renderAlertBanner()}${renderCardsEstoque()}`;
}