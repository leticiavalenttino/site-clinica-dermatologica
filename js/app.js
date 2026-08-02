import { state } from './state.js';
import { getData, setData, uid } from './storage.js';

import { renderLogin, wireLogin } from './screens/login.js';
import { renderConfigurarPerfil, wireConfigurarPerfil } from './screens/configurarPerfil.js';
import { renderShell, wireShellChrome } from './screens/shell.js';
import { renderDashboard } from './screens/dashboard.js';
import { renderUsuarios, wireUsuarios } from './screens/usuarios.js';
import { renderProdutos, wireProdutos } from './screens/produtos.js';
import { renderEstoqueOperacional, wireEstoque } from './screens/estoque.js';
import { renderMovimentacao, wireMovimentacao } from './screens/movimentacao.js';
import { renderConfirmModal, wireConfirmModal } from './screens/confirmModal.js';

function renderTabContent(){
  if(state.activeTab === 'produtos') return renderProdutos();
  if(state.activeTab === 'usuarios') return renderUsuarios();
  if(state.activeTab === 'estoque') return renderEstoqueOperacional();
  if(state.activeTab === 'movimentacao') return renderMovimentacao();
  return renderDashboard();
}

function wireTabContent(){
  if(state.activeTab === 'produtos') return wireProdutos(render);
  if(state.activeTab === 'usuarios') return wireUsuarios(render);
  if(state.activeTab === 'estoque') return wireEstoque(render);
  if(state.activeTab === 'movimentacao') return wireMovimentacao(render);
}

function render(){
  const app = document.getElementById('app');
  if(!state.currentUser){
    app.innerHTML = renderLogin();
    wireLogin(render);
  } else if(state.currentUser.precisaConfigurar){
    app.innerHTML = renderConfigurarPerfil();
    wireConfigurarPerfil(render);
  } else {
    const modalHtml = state.confirmModal ? renderConfirmModal() : '';
    app.innerHTML = renderShell(renderTabContent(), modalHtml);
    wireShellChrome(render);
    wireTabContent();
    if(state.confirmModal){
      wireConfirmModal(render);
    }
  }
}

async function init(){
  state.usuarios = await getData('usuarios', []);
  if(state.usuarios.length === 0){
    state.usuarios = [{id:uid(), usuario:'admin', senha:'admin', papel:'admin'}];
    await setData('usuarios', state.usuarios);
  }
  state.produtos = await getData('produtos', []);
  state.movimentacoes = await getData('movimentacoes', []);
  render();
}

init();