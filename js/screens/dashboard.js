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

export function renderDashboard(){
  return `<h1>Visão geral</h1>${renderAlertBanner()}`;
}