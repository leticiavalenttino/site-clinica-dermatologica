import { state } from '../state.js';
import { setData, uid } from '../storage.js';

export async function registrarMovimentacao(tipo, produtoNome, quantidade){
  state.movimentacoes.push({
    id: uid(),
    produtoNome,
    tipo,
    quantidade,
    usuario: state.currentUser.usuario,
    papel: state.currentUser.papel,
    data: new Date().toISOString()
  });
  await setData('movimentacoes', state.movimentacoes);
}

export async function removerMovimentacao(id){
  if(state.currentUser.papel !== 'admin'){
    alert('Somente a administração pode alterar o histórico de movimentações.');
    return;
  }
  const confirmou = confirm('Remover este registro do histórico? Essa ação não pode ser desfeita.');
  if(!confirmou) return;
  state.movimentacoes = state.movimentacoes.filter(m => m.id !== id);
  await setData('movimentacoes', state.movimentacoes);
}