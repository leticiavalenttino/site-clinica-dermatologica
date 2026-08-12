import { state } from '../state.js';
import { setData } from '../storage.js';

export function renderNavButtons(){
  const item = (tab, label) => `<button data-tab="${tab}" class="${state.activeTab===tab?'active':''}">${label}</button>`;

  if(state.currentUser.papel === 'admin'){
    return item('dashboard','Visão geral') + item('produtos','Produtos') + item('usuarios','Usuários') + item('pacientes','Pacientes') + item('movimentacao','Movimentação');
  }
  return item('dashboard','Visão geral') + item('estoque','Catálogo') + item('pacientes','Pacientes') + item('movimentacao','Movimentação');
}
export function renderShell(tabContentHtml, modalHtml){
  return `
    <div class="shell">
      <aside class="sidebar ${state.sidebarColapsada ? 'collapsed' : ''}">
        <button id="btn-toggle-sidebar" class="sidebar-toggle" aria-label="Recolher menu">☰</button>
        <h2 class="brand-title">Dra. Dermato | Dermatologia e Estética</h2>
        <div class="sidebar-user-row">
          <button id="btn-abrir-perfil" class="sidebar-user-btn">${state.currentUser.usuario} (${state.currentUser.papel})</button>
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
      render();
    });
  });
}