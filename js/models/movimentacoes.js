import { state } from '../state.js';
import { setData, uid } from '../storage.js';
import { notify, confirmar } from '../components/notify.js';
import { podeGerenciarClinica } from './permissoes.js';

export async function registrarMovimentacao(tipo, produtoId, produtoNome, quantidade, detalhes){
  state.movimentacoes.push({
    id: uid(),
    produtoId,
    produtoNome,
    tipo,
    quantidade,
    detalhes: detalhes || '',
    usuario: state.currentUser.usuario,
    papel: state.currentUser.papel,
    data: new Date().toISOString()
  });
  await setData('movimentacoes', state.movimentacoes);
}

/* Além do estoque, o histórico guarda o que acontece com as contas: quem
   entrou no sistema e quem cadastrou um novo usuário. Fica tudo na mesma
   lista para não existirem dois históricos, mas a tela mostra esses registros
   em uma tabela própria, porque não há produto nem quantidade envolvidos. */
export const TIPOS_ACESSO = new Set(['Login', 'Usuário cadastrado']);

export async function registrarAcesso(tipo, detalhes, autor = state.currentUser){
  state.movimentacoes.push({
    id: uid(),
    produtoId: null,
    produtoNome: null,
    tipo,
    quantidade: null,
    detalhes: detalhes || '',
    usuario: autor.usuario,
    papel: autor.papel,
    data: new Date().toISOString()
  });
  await setData('movimentacoes', state.movimentacoes);
}

export async function removerMovimentacao(id){
  if(!podeGerenciarClinica()){
    notify('Somente a dermatologista, a ginecologista ou a administração pode alterar o histórico de movimentações.', 'error');
    return;
  }
  const confirmou = await confirmar('Remover este registro do histórico? Essa ação não pode ser desfeita.');
  if(!confirmou) return;
  state.movimentacoes = state.movimentacoes.filter(m => m.id !== id);
  await setData('movimentacoes', state.movimentacoes);
  notify('Registro removido.', 'success');
}