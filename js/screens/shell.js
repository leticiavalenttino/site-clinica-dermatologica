import { state } from '../state.js';

export function renderNavButtons(){
  const item = (tab, label) => `<button data-tab="${tab}" class="${state.activeTab===tab?'active':''}">${label}</button>`;

  if(state.currentUser.papel === 'admin'){
    return item('dashboard','Visão geral') + item('produtos','Produtos') + item('usuarios','Usuários') + item('movimentacao','Movimentação');
  }
  return item('dashboard','Visão geral') + item('estoque','Catálogo') + item('movimentacao','Movimentação');
}

export function renderShell(tabContentHtml, modalHtml){
  return `
    <div class="shell">
      <aside class="sidebar">
        <h3>Dra. Dermato | Controle de Estoque</h3>
        <div class="sidebar-user-row">
          <p>${state.currentUser.usuario} (${state.currentUser.papel})</p>
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
    render();
  });
  document.querySelectorAll('.sidebar nav button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      state.activeTab = btn.dataset.tab;
      render();
    });
  });
}