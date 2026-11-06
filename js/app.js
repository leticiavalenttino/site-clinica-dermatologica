import { state } from './state.js';
import { getData, setData, uid } from './storage.js';
import { renderLogin, wireLogin } from './screens/login.js';
import { renderConfigurarPerfil, wireConfigurarPerfil } from './screens/configurarPerfil.js';
import { renderRedefinirSenha, wireRedefinirSenha } from './screens/redefinirSenha.js';
import { renderShell, wireShellChrome, tabsPermitidas } from './screens/shell.js';
import { renderDashboard, wireDashboard } from './screens/dashboard.js';
import { renderUsuarios, wireUsuarios } from './screens/usuarios.js';
import { renderProdutos, wireProdutos } from './screens/produtos.js';
import { renderEstoqueOperacional, wireEstoque } from './screens/estoque.js';
import { renderMovimentacao, wireMovimentacao } from './screens/movimentacao.js';
import { renderConfirmModal, wireConfirmModal } from './screens/confirmModal.js';
import { renderPerfilModal, wirePerfilModal } from './screens/perfil.js';
import { renderPacientes, wirePacientes } from './screens/pacientes.js';
import { renderCaixa, wireCaixa } from './screens/caixa.js';

function renderTabContent(){
  if(state.activeTab === 'produtos') return renderProdutos();
  if(state.activeTab === 'usuarios') return renderUsuarios();
  if(state.activeTab === 'estoque') return renderEstoqueOperacional();
  if(state.activeTab === 'movimentacao') return renderMovimentacao();
  if(state.activeTab === 'pacientes') return renderPacientes();
  if(state.activeTab === 'caixa') return renderCaixa();
  return renderDashboard();
}

function wireTabContent(){
  if(state.activeTab === 'produtos') return wireProdutos(render);
  if(state.activeTab === 'usuarios') return wireUsuarios(render);
  if(state.activeTab === 'estoque') return wireEstoque(render);
  if(state.activeTab === 'movimentacao') return wireMovimentacao(render);
  if(state.activeTab === 'pacientes') return wirePacientes(render);
  if(state.activeTab === 'caixa') return wireCaixa(render);
  return wireDashboard(render);
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

/* Rolar a página com o cursor dentro de um campo numérico fazia o navegador
   somar ou subtrair do valor, dava para deixar o estoque negativo sem
   perceber. Tirando o foco do campo, a roda volta a só rolar a página.
   Fica no documento porque as telas são redesenhadas a cada render. */
function impedirRodaDoMouseAlterarNumeros(){
  document.addEventListener('wheel', () => {
    const ativo = document.activeElement;
    if(ativo && ativo.type === 'number') ativo.blur();
  }, { passive: true });
}

async function init(){
  impedirRodaDoMouseAlterarNumeros();
  state.usuarios = await getData('usuarios', []);
  if(state.usuarios.length === 0){
    state.usuarios = [{id:uid(), usuario:'admin', senha:'admin', papel:'admin'}];
    await setData('usuarios', state.usuarios);
  }
  state.produtos = await getData('produtos', []);
  let precisaMigrarProdutos = false;
  state.produtos = state.produtos.map(p => {
    if(p.estoqueClinica !== undefined && p.estoqueExterno !== undefined) return p;
    precisaMigrarProdutos = true;
    const { estoque, ...resto } = p;
    return { ...resto, estoqueClinica: 0, estoqueExterno: Number(estoque) || 0 };
  });
  if(precisaMigrarProdutos){
    await setData('produtos', state.produtos);
  }

  /* O depósito passou a ser contado em embalagens, não mais em unidades.
     Quem tem mais de uma unidade por embalagem precisa ter o valor antigo
     convertido uma única vez; para os demais, caixa e unidade são a mesma
     coisa e nada muda. */
  const depositoJaConvertido = await getData('depositoEmEmbalagens', false);
  if(!depositoJaConvertido){
    state.produtos = state.produtos.map(p => {
      const porCaixa = Number(p.unidadesPorEmbalagem) > 0 ? Number(p.unidadesPorEmbalagem) : 1;
      if(porCaixa === 1) return p;
      return {
        ...p,
        estoqueExterno: Math.round((Number(p.estoqueExterno) || 0) / porCaixa),
        limite: Math.round((Number(p.limite) || 0) / porCaixa)
      };
    });
    await setData('produtos', state.produtos);
    await setData('depositoEmEmbalagens', true);
  }
  state.movimentacoes = await getData('movimentacoes', []);
  state.pacientes = await getData('pacientes', []);
  state.procedimentos = await getData('procedimentos', []);
  state.atendimentos = await getData('atendimentos', []);
  state.resetTokens = await getData('resetTokens', []);

  const sessaoId = await getData('sessaoUsuarioId', null);
  if(sessaoId){
    const usuarioSalvo = state.usuarios.find(u => u.id === sessaoId);
    if(usuarioSalvo) state.currentUser = usuarioSalvo;
  }

  if(state.currentUser){
    const tabSalva = await getData('activeTab', 'dashboard');
    state.activeTab = tabsPermitidas(state.currentUser.papel).includes(tabSalva) ? tabSalva : 'dashboard';
  }

  state.resetTokenAtivo = new URLSearchParams(window.location.search).get('reset');

  render();
}

init();