import { state } from '../state.js';
import { setData, uid } from '../storage.js';
import { notify, confirmar } from '../components/notify.js';
import { registrarMovimentacao } from './movimentacoes.js';
import { produtoVencido, valorUnitario, rotuloUnidade } from './produtos.js';
import { podeGerenciarClinica } from './permissoes.js';

export function podeVerCaixa(){
  return podeGerenciarClinica();
}

export function formatarMoeda(valor){
  return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// quanto está parado em produtos hoje: a clínica é contada em unidades e o
// depósito em embalagens fechadas, então cada lado usa o seu preço
export function valorTotalEmProdutos(){
  return state.produtos.reduce(
    (soma, p) => soma + valorUnitario(p) * p.estoqueClinica + p.valor * p.estoqueExterno, 0);
}

export function produtosDoProcedimento(proc){
  return (proc.produtos || []).map(item => ({
    ...item,
    produto: state.produtos.find(p => p.id === item.produtoId) || null
  }));
}

// custo dos produtos do procedimento pelo valor de hoje; um produto que foi
// removido do catálogo simplesmente não entra na conta
export function custoProcedimento(proc){
  return produtosDoProcedimento(proc)
    .reduce((soma, item) => soma + (item.produto ? valorUnitario(item.produto) * item.quantidade : 0), 0);
}

export function liquidoProcedimento(proc){
  return proc.preco - custoProcedimento(proc);
}

/* Cada procedimento é de uma especialidade, ou das duas. Serve para filtrar a
   lista na hora de registrar um atendimento — a ginecologista não precisa rolar
   pelos procedimentos de dermato —, e nunca para permissão: pelo permissoes.js
   as duas médicas continuam podendo fazer exatamente as mesmas coisas.
   Procedimento cadastrado antes deste campo vale como "ambas". */
export const ESPECIALIDADES = {
  ambas: 'Ambas',
  dermatologia: 'Dermatologia',
  ginecologia: 'Ginecologia'
};

export function especialidadeDe(proc){
  return ESPECIALIDADES[proc.especialidade] ? proc.especialidade : 'ambas';
}

// a especialidade de quem está logada; administração e secretaria não têm uma
export function especialidadeDoPapel(papel = state.currentUser.papel){
  if(papel === 'dermatologista') return 'dermatologia';
  if(papel === 'ginecologista') return 'ginecologia';
  return null;
}

// "ambas" aparece para as duas, e o filtro "todas" não esconde nada
export function procedimentoDaEspecialidade(proc, especialidade){
  if(!especialidade || especialidade === 'todas') return true;
  const esp = especialidadeDe(proc);
  return esp === 'ambas' || esp === especialidade;
}

function validarProcedimento(dados){
  if(!dados.nome.trim()) return 'Informe o nome do procedimento.';
  if(!(Number(dados.preco) > 0)) return 'Informe quanto o procedimento custa para a paciente.';
  return null;
}

function montarProcedimento(dados){
  return {
    nome: dados.nome.trim(),
    preco: Number(dados.preco) || 0,
    especialidade: ESPECIALIDADES[dados.especialidade] ? dados.especialidade : 'ambas',
    produtos: (dados.produtos || [])
      .filter(item => item.produtoId && Number(item.quantidade) > 0)
      .map(item => ({ produtoId: item.produtoId, quantidade: Number(item.quantidade) }))
  };
}

export async function addProcedimento(dados){
  const erro = validarProcedimento(dados);
  if(erro) return notify(erro, 'error');

  state.procedimentos.push({ id: uid(), ...montarProcedimento(dados), criadoEm: new Date().toISOString() });
  await setData('procedimentos', state.procedimentos);
  notify('Procedimento cadastrado com sucesso.', 'success');
  return true;
}

export async function updateProcedimento(id, dados){
  const erro = validarProcedimento(dados);
  if(erro) return notify(erro, 'error');

  const idx = state.procedimentos.findIndex(p => p.id === id);
  if(idx === -1) return;

  state.procedimentos[idx] = { ...state.procedimentos[idx], ...montarProcedimento(dados) };
  await setData('procedimentos', state.procedimentos);
  notify('Procedimento atualizado com sucesso.', 'success');
  return true;
}

export async function removeProcedimento(id){
  const alvo = state.procedimentos.find(p => p.id === id);
  if(!alvo) return;

  const confirmou = await confirmar(`Remover o procedimento "${alvo.nome}" da tabela de preços? Os atendimentos já registrados continuam no histórico.`);
  if(!confirmou) return;

  state.procedimentos = state.procedimentos.filter(p => p.id !== id);
  await setData('procedimentos', state.procedimentos);
  notify('Procedimento removido.', 'success');
}

// Confere se dá para realizar o procedimento com o estoque da clínica.
// Devolve a lista de impedimentos (vazia quando está tudo certo).
export function impedimentosParaAtender(proc){
  const problemas = [];
  produtosDoProcedimento(proc).forEach(item => {
    if(!item.produto){
      problemas.push('Um dos produtos do procedimento não está mais no catálogo.');
      return;
    }
    if(produtoVencido(item.produto)){
      problemas.push(`"${item.produto.nome}" está vencido.`);
      return;
    }
    if(item.produto.estoqueClinica < item.quantidade){
      const un = rotuloUnidade(item.produto, item.produto.estoqueClinica);
      problemas.push(`"${item.produto.nome}": a clínica tem ${item.produto.estoqueClinica} ${un} e o procedimento usa ${item.quantidade} ${rotuloUnidade(item.produto, item.quantidade)}.`);
    }
  });
  return problemas;
}

export async function registrarAtendimento({ procedimentoId, pacienteId }){
  const proc = state.procedimentos.find(p => p.id === procedimentoId);
  if(!proc) return notify('Selecione um procedimento.', 'error');

  const problemas = impedimentosParaAtender(proc);
  if(problemas.length > 0) return notify(problemas.join(' '), 'error');

  const paciente = state.pacientes.find(p => p.id === pacienteId) || null;
  const custo = custoProcedimento(proc);
  const itens = produtosDoProcedimento(proc);

  const resumoProdutos = itens.map(i => `${i.quantidade} ${rotuloUnidade(i.produto, i.quantidade)} de ${i.produto.nome}`).join(', ');
  const confirmou = await confirmar(
    `Registrar "${proc.nome}"${paciente ? ` para ${paciente.nome}` : ''} por ${formatarMoeda(proc.preco)}?` +
    (itens.length > 0 ? ` Isso dá baixa no estoque da clínica: ${resumoProdutos}.` : ' Nenhum produto será baixado.')
  );
  if(!confirmou) return;

  for(const item of itens){
    item.produto.estoqueClinica -= item.quantidade;
    await registrarMovimentacao('Saída (uso)', item.produto.id, item.produto.nome, item.quantidade);
  }
  if(itens.length > 0) await setData('produtos', state.produtos);

  // os valores ficam congelados no atendimento: mudar o preço do procedimento
  // depois não pode alterar o que já foi faturado
  state.atendimentos.push({
    id: uid(),
    procedimentoId: proc.id,
    procedimentoNome: proc.nome,
    pacienteId: paciente ? paciente.id : null,
    pacienteNome: paciente ? paciente.nome : '',
    produtosUsados: itens.map(i => ({
      nome: i.produto.nome,
      quantidade: i.quantidade,
      unidade: rotuloUnidade(i.produto, i.quantidade),
      valorUnitario: valorUnitario(i.produto)
    })),
    valorBruto: proc.preco,
    custoProdutos: custo,
    data: new Date().toISOString(),
    usuario: state.currentUser.usuario,
    papel: state.currentUser.papel
  });
  await setData('atendimentos', state.atendimentos);
  notify('Atendimento registrado no caixa.', 'success');
  return true;
}

// remove só o registro financeiro: o estoque já baixado não volta sozinho,
// então avisamos quem está removendo
export async function removerAtendimento(id){
  const alvo = state.atendimentos.find(a => a.id === id);
  if(!alvo) return;

  const confirmou = await confirmar(
    `Remover o atendimento "${alvo.procedimentoNome}" de ${formatarMoeda(alvo.valorBruto)} do caixa? ` +
    'O estoque que já foi baixado não volta automaticamente — se for o caso, registre a entrada pela tela de Produtos.'
  );
  if(!confirmou) return;

  state.atendimentos = state.atendimentos.filter(a => a.id !== id);
  await setData('atendimentos', state.atendimentos);
  notify('Atendimento removido do caixa.', 'success');
}

export function totaisAtendimentos(){
  return state.atendimentos.reduce((totais, a) => ({
    bruto: totais.bruto + a.valorBruto,
    custo: totais.custo + a.custoProdutos,
    liquido: totais.liquido + (a.valorBruto - a.custoProdutos)
  }), { bruto: 0, custo: 0, liquido: 0 });
}
