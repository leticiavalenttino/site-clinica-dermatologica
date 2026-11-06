import { state } from '../state.js';
import { setData } from '../storage.js';
import { ehMedica } from '../models/permissoes.js';

const TABS_ADMIN = ['dashboard', 'produtos', 'usuarios', 'pacientes', 'movimentacao', 'caixa'];
const TABS_MEDICAS = ['dashboard', 'estoque', 'pacientes', 'movimentacao', 'caixa'];
const TABS_OUTROS = ['dashboard', 'estoque', 'pacientes', 'movimentacao'];

export function capitalizar(texto){
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function tabsPermitidas(papel){
  if(papel === 'admin') return TABS_ADMIN;
  if(ehMedica(papel)) return TABS_MEDICAS;
  return TABS_OUTROS;
}

export function renderNavButtons(){
  const item = (tab, label) => `<button data-tab="${tab}" class="${state.activeTab===tab?'active':''}">${label}</button>`;

  if(state.currentUser.papel === 'admin'){
    return item('dashboard','Visão geral') + item('produtos','Produtos') + item('usuarios','Usuários') + item('pacientes','Pacientes') + item('movimentacao','Movimentação') + item('caixa','Caixa');
  }
  const base = item('dashboard','Visão geral') + item('estoque','Produtos') + item('pacientes','Pacientes') + item('movimentacao','Movimentações');
  return ehMedica(state.currentUser.papel) ? base + item('caixa','Caixa') : base;
}
export function renderShell(tabContentHtml, modalHtml){
  return `
    <div class="shell">
      <aside class="sidebar ${state.sidebarColapsada ? 'collapsed' : ''}">
        <button id="btn-toggle-sidebar" class="sidebar-toggle" aria-label="Recolher menu">☰</button>
        <h2 class="brand-title">CITODERME | Dermatologia e Ginecologia</h2>
        <div class="sidebar-user-row">
          <button id="btn-abrir-perfil" class="sidebar-user-btn">${state.currentUser.usuario} | ${capitalizar(state.currentUser.papel)}</button>
          <button id="btn-logout">Sair</button>
        </div>
        <nav>${renderNavButtons()}</nav>
      </aside>
      <main class="main">
        ${tabContentHtml}
      </main>
    </div>
    ${modalHtml || ''}
  `;
}
export function wireShellChrome(render){
  document.getElementById('btn-logout').addEventListener('click', ()=>{
    state.currentUser = null;
    setData('sessaoUsuarioId', null);
    render();
  });
  document.getElementById('btn-toggle-sidebar').addEventListener('click', ()=>{
    state.sidebarColapsada = !state.sidebarColapsada;
    document.querySelector('.sidebar').classList.toggle('collapsed', state.sidebarColapsada);
  });
  document.getElementById('btn-abrir-perfil').addEventListener('click', ()=>{
    state.mostrarPerfil = true;
    render();
  });
  document.querySelectorAll('.sidebar nav button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      state.activeTab = btn.dataset.tab;
      setData('activeTab', state.activeTab);
      render();
    });
  });
}