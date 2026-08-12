import { state } from '../state.js';
import { setData, uid } from '../storage.js';
import { registrarMovimentacao } from './movimentacoes.js';
import { notify, confirmar } from '../components/notify.js';

export async function addProduto(dados){
  if(!dados.nome.trim()){
    notify('Informe o nome do produto.', 'error');
    return;
  }
  const novo = {
    id: uid(),
    nome: dados.nome.trim(),
    descricao: (dados.descricao || '').trim(),
    valor: Number(dados.valor) || 0,
    estoque: Number(dados.estoque) || 0,
    limite: Number(dados.limite) || 0,
    tipo: dados.tipo
  };
  state.produtos.push(novo);
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Produto cadastrado', novo.nome, novo.estoque);
  notify('Produto cadastrado com sucesso.', 'success');
}

export function produtosBaixoEstoque(){
  return state.produtos.filter(p => p.estoque < p.limite);
}

export async function darBaixaSimples(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  const q = Number(quantidade);
  if(!q || q <= 0){
    notify('Informe uma quantidade válida.', 'error');
    return;
  }
  if(q > p.estoque){
    notify('Quantidade maior que o estoque disponível.', 'error');
    return;
  }
  p.estoque -= q;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Saída (uso)', p.nome, q);
  notify('Saída registrada.', 'success');
}

export async function adicionarEntrada(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  const q = Number(quantidade);
  if(!q || q <= 0){
    notify('Informe uma quantidade válida.', 'error');
    return;
  }
  p.estoque += q;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Entrada', p.nome, q);
  notify('Entrada registrada.', 'success');
}

export function abrirConfirmacaoEspecial(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  const q = Number(quantidade);
  if(!q || q <= 0){
    notify('Informe uma quantidade válida.', 'error');
    return;
  }
  if(q > p.estoque){
    notify('Quantidade maior que o estoque disponível.', 'error');
    return;
  }
  state.confirmModal = { produtoId, quantidade: q };
}

export async function confirmarCompraEspecial(senhaDigitada){
  const p = state.produtos.find(x => x.id === state.confirmModal.produtoId);
  if(!p){ state.confirmModal = null; return; }

  if(state.currentUser.papel !== 'dermatologista'){
    notify('Somente a dermatologista pode aprovar produtos especiais.', 'error');
    state.confirmModal = null;
    return;
  }

  if(senhaDigitada !== state.currentUser.senha){
    notify('Senha incorreta. Retirada não autorizada.', 'error');
    return;
  }

  p.estoque -= state.confirmModal.quantidade;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Saída (aprovada)', p.nome, state.confirmModal.quantidade);
  state.confirmModal = null;
  notify('Retirada aprovada.', 'success');
}

export function cancelarConfirmacao(){
  state.confirmModal = null;
}

export async function removeProduto(id){
  if(state.currentUser.papel !== 'admin'){
    notify('Somente a administração pode remover produtos.', 'error');
    return;
  }

  const alvo = state.produtos.find(p => p.id === id);
  if(!alvo) return;

  const confirmou = await confirmar(`Remover o produto "${alvo.nome}"? Essa ação não pode ser desfeita.`);
  if(!confirmou) return;

  state.produtos = state.produtos.filter(p => p.id !== id);
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Produto removido', alvo.nome, alvo.estoque);
  notify('Produto removido.', 'success');
}
