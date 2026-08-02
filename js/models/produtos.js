import { state } from '../state.js';
import { setData, uid } from '../storage.js';
import { registrarMovimentacao } from './movimentacoes.js';

export async function addProduto(dados){
  if(!dados.nome.trim()){
    alert('Informe o nome do produto.');
    return;
  }
  const novo = {
    id: uid(),
    nome: dados.nome.trim(),
    valor: Number(dados.valor) || 0,
    estoque: Number(dados.estoque) || 0,
    limite: Number(dados.limite) || 0,
    tipo: dados.tipo
  };
  state.produtos.push(novo);
  await setData('produtos', state.produtos);
}

export function produtosBaixoEstoque(){
  return state.produtos.filter(p => p.estoque < p.limite);
}

export async function darBaixaSimples(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  const q = Number(quantidade);
  if(!q || q <= 0){
    alert('Informe uma quantidade válida.');
    return;
  }
  if(q > p.estoque){
    alert('Quantidade maior que o estoque disponível.');
    return;
  }
  p.estoque -= q;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Saída (uso)', p.nome, q);
}

export async function adicionarEntrada(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  const q = Number(quantidade);
  if(!q || q <= 0){
    alert('Informe uma quantidade válida.');
    return;
  }
  p.estoque += q;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Entrada', p.nome, q);
}

export function abrirConfirmacaoEspecial(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  const q = Number(quantidade);
  if(!q || q <= 0){
    alert('Informe uma quantidade válida.');
    return;
  }
  if(q > p.estoque){
    alert('Quantidade maior que o estoque disponível.');
    return;
  }
  state.confirmModal = { produtoId, quantidade: q };
}

export async function confirmarCompraEspecial(RQEDigitado){
  const p = state.produtos.find(x => x.id === state.confirmModal.produtoId);
  if(!p){ state.confirmModal = null; return; }

  if(state.currentUser.papel !== 'dermatologista'){
    alert('Somente a dermatologista pode aprovar produtos especiais.');
    state.confirmModal = null;
    return;
  }

  if(RQEDigitado.trim() !== state.currentUser.RQE){
    alert('RQE não corresponde ao cadastrado. Compra não autorizada.');
    return;
  }

  p.estoque -= state.confirmModal.quantidade;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Saída (RQE)', p.nome, state.confirmModal.quantidade);
  state.confirmModal = null;
}

export function cancelarConfirmacao(){
  state.confirmModal = null;
}