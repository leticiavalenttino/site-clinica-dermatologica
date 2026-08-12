import { state } from './state.js';
import { getData, setData, uid } from './storage.js';
import { renderLogin, wireLogin } from './screens/login.js';
import { renderConfigurarPerfil, wireConfigurarPerfil } from './screens/configurarPerfil.js';
import { renderRedefinirSenha, wireRedefinirSenha } from './screens/redefinirSenha.js';
import { renderShell, wireShellChrome } from './screens/shell.js';
import { renderDashboard } from './screens/dashboard.js';
import { renderUsuarios, wireUsuarios } from './screens/usuarios.js';
import { renderProdutos, wireProdutos } from './screens/produtos.js';
import { renderEstoqueOperacional, wireEstoque } from './screens/estoque.js';
import { renderMovimentacao, wireMovimentacao } from './screens/movimentacao.js';
import { renderConfirmModal, wireConfirmModal } from './screens/confirmModal.js';
import { renderPerfilModal, wirePerfilModal } from './screens/perfil.js';
import { renderPacientes, wirePacientes } from './screens/pacientes.js';

function renderTabContent(){
  if(state.activeTab === 'produtos') return renderProdutos();
  if(state.activeTab === 'usuarios') return renderUsuarios();
  if(state.activeTab === 'estoque') return renderEstoqueOperacional();
  if(state.activeTab === 'movimentacao') return renderMovimentacao();
  if(state.activeTab === 'pacientes') return renderPacientes();
  return renderDashboard();
}

function wireTabContent(){
  if(state.activeTab === 'produtos') return wireProdutos(render);
  if(state.activeTab === 'usuarios') return wireUsuarios(render);
  if(state.activeTab === 'estoque') return wireEstoque(render);
  if(state.activeTab === 'movimentacao') return wireMovimentacao(render);
  if(state.activeTab === 'pacientes') return wirePacientes(render);
}

function render(){
  const app = document.getElementById('app');
  if(state.resetTokenAtivo){
    app.innerHTML = renderRedefinirSenha();
    wireRedefinirSenha(render);
  } else if(!state.currentUser){
    app.innerHTML = renderLogin();
    wireLogin(render);
  } else if(state.currentUser.precisaConfigurar){
    app.innerHTML = renderConfigurarPerfil();
    wireConfigurarPerfil(render);
  } else {
    const modalHtml = (state.mostrarPerfil ? renderPerfilModal() : '') + (state.confirmModal ? renderConfirmModal() : '');
    app.innerHTML = renderShell(renderTabContent(), modalHtml);
    wireShellChrome(render);
    wireTabContent();
    if(state.mostrarPerfil){
      wirePerfilModal(render);
    }
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
  state.pacientes = await getData('pacientes', []);
  state.resetTokens = await getData('resetTokens', []);

  const sessaoId = await getData('sessaoUsuarioId', null);
  if(sessaoId){
    const usuarioSalvo = state.usuarios.find(u => u.id === sessaoId);
    if(usuarioSalvo) state.currentUser = usuarioSalvo;
  }

  state.resetTokenAtivo = new URLSearchParams(window.location.search).get('reset');

  render();
}

init();