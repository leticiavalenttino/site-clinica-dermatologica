import { state } from '../state.js';
import { setData, uid } from '../storage.js';
import { registrarMovimentacao } from './movimentacoes.js';
import { notify, confirmar } from '../components/notify.js';
import { ehMedica, podeGerenciarClinica } from './permissoes.js';

export const MINIMO_ESTOQUE_CLINICA = 4;
export const UNIDADE_PADRAO = 'un.';

function formatarValidade(iso){
  if(!iso) return 'sem validade';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}

/* Como o estoque é contado:
     - DEPÓSITO (estoqueExterno, limite): em EMBALAGENS fechadas. É assim que
       se compra e é assim que a caixa fica guardada.
     - CLÍNICA (estoqueClinica, limiteClinica): em UNIDADES de uso (ampola,
       par), porque é ali que a caixa é aberta e consumida.
   Transferir do depósito para a clínica tira caixas de um lado e coloca
   as unidades correspondentes do outro.
   Produtos sem "unidadesPorEmbalagem" valem 1 por 1, então caixa e unidade
   são a mesma coisa e nada muda para eles. */
export function unidadesPorEmbalagem(p){
  const n = Number(p.unidadesPorEmbalagem);
  return n > 0 ? n : 1;
}

export function rotuloUnidade(p, quantidade = 2){
  const nome = ((p.nomeUnidade || '').trim()) || UNIDADE_PADRAO;
  if(quantidade === 1 || nome.endsWith('.') || nome.endsWith('s')) return nome;
  if(nome.endsWith('r')) return `${nome}es`;
  return `${nome}s`;
}

// quanto custa uma unidade de uso, a partir do preço da embalagem
export function valorUnitario(p){
  return p.valor / unidadesPorEmbalagem(p);
}

export function fracionado(p){
  return unidadesPorEmbalagem(p) > 1;
}

/* O depósito conta embalagens sempre, então o rótulo é "caixa(s)" mesmo
   quando ainda não sabemos quantas unidades vêm dentro — escrever a unidade
   aqui daria a entender que são itens soltos. */
export function rotuloEmbalagem(p, caixas = 2){
  return caixas === 1 ? 'caixa' : 'caixas';
}

// estoque do depósito: "3 caixas (15 ampolas)"
export function descreverEmbalagens(p, caixas){
  const base = `${caixas} ${rotuloEmbalagem(p, caixas)}`;
  if(!fracionado(p)) return base;
  const unidades = caixas * unidadesPorEmbalagem(p);
  return `${base} (${unidades} ${rotuloUnidade(p, unidades)})`;
}

// estoque da clínica: "12 ampolas (2 caixas + 2)"
export function descreverQuantidade(p, quantidade){
  const base = `${quantidade} ${rotuloUnidade(p, quantidade)}`;
  const porCaixa = unidadesPorEmbalagem(p);
  if(porCaixa === 1) return base;

  const caixas = Math.floor(quantidade / porCaixa);
  if(caixas === 0) return base;
  const resto = quantidade % porCaixa;
  return `${base} (${caixas} ${caixas === 1 ? 'caixa' : 'caixas'}${resto ? ` + ${resto}` : ''})`;
}

export function diasParaVencer(p){
  if(!p.validade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(p.validade + 'T00:00:00');
  return Math.round((vencimento - hoje) / (1000 * 60 * 60 * 24));
}

export function produtosVencimentoCritico(){
  return state.produtos.filter(p => {
    const dias = diasParaVencer(p);
    return dias !== null && dias <= 30;
  });
}

export function produtosVencimentoProximo(){
  return state.produtos.filter(p => {
    const dias = diasParaVencer(p);
    return dias !== null && dias > 30 && dias <= 90;
  });
}

export function produtoVencido(p){
  const dias = diasParaVencer(p);
  return dias !== null && dias < 0;
}

const MSG_PRODUTO_VENCIDO = 'Este produto está vencido e não pode mais ser movimentado. Peça para a dermatologista, a ginecologista ou a administração removê-lo do catálogo.';

export async function addProduto(dados){
  if(!dados.nome.trim()){
    notify('Informe o nome do produto.', 'error');
    return;
  }
  if(!(dados.lote || '').trim()){
    notify('Informe o lote do produto.', 'error');
    return;
  }
  if(!dados.validade){
    notify('Informe a data de vencimento do produto.', 'error');
    return;
  }
  if(!dados.tipo){
    notify('Selecione o tipo do produto.', 'error');
    return;
  }
  const novo = {
    id: uid(),
    nome: dados.nome.trim(),
    descricao: (dados.descricao || '').trim(),
    lote: (dados.lote || '').trim(),
    validade: dados.validade || '',
    valor: Number(dados.valor) || 0,
    unidadesPorEmbalagem: Number(dados.unidadesPorEmbalagem) > 0 ? Number(dados.unidadesPorEmbalagem) : 1,
    nomeUnidade: ((dados.nomeUnidade || '').trim()) || UNIDADE_PADRAO,
    estoqueClinica: Number(dados.estoqueClinica) || 0,
    estoqueExterno: Number(dados.estoqueExterno) || 0,
    limite: Number(dados.limite) || 0,
    limiteClinica: Number(dados.limiteClinica) || MINIMO_ESTOQUE_CLINICA,
    tipo: dados.tipo
  };
  state.produtos.push(novo);
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Produto cadastrado', novo.id, novo.nome, novo.estoqueClinica + novo.estoqueExterno);
  notify('Produto cadastrado com sucesso.', 'success');
}

export function podeEditarProduto(){
  return podeGerenciarClinica();
}

export async function editarProduto(id, dados){
  if(!podeEditarProduto()){
    notify('Somente a dermatologista, a ginecologista ou a administração podem editar produtos.', 'error');
    return;
  }
  if(!dados.nome.trim()){
    notify('Informe o nome do produto.', 'error');
    return;
  }
  if(!(dados.lote || '').trim()){
    notify('Informe o lote do produto.', 'error');
    return;
  }
  if(!dados.validade){
    notify('Informe a data de vencimento do produto.', 'error');
    return;
  }
  const idx = state.produtos.findIndex(p => p.id === id);
  if(idx === -1) return;
  const anterior = state.produtos[idx];

  const atualizado = {
    ...anterior,
    nome: dados.nome.trim(),
    descricao: (dados.descricao || '').trim(),
    lote: (dados.lote || '').trim(),
    validade: dados.validade || '',
    valor: Number(dados.valor) || 0,
    unidadesPorEmbalagem: Number(dados.unidadesPorEmbalagem) > 0 ? Number(dados.unidadesPorEmbalagem) : 1,
    nomeUnidade: ((dados.nomeUnidade || '').trim()) || UNIDADE_PADRAO,
    limite: Number(dados.limite) || 0,
    limiteClinica: Number(dados.limiteClinica) || MINIMO_ESTOQUE_CLINICA,
    tipo: dados.tipo
  };

  const mudancas = [];
  if(anterior.nome !== atualizado.nome) mudancas.push(`Nome: "${anterior.nome}" → "${atualizado.nome}"`);
  if(anterior.descricao !== atualizado.descricao) mudancas.push('Descrição: atualizada');
  if((anterior.lote || '') !== atualizado.lote) mudancas.push(`Lote: "${anterior.lote || '-'}" → "${atualizado.lote || '-'}"`);
  if((anterior.validade || '') !== atualizado.validade) mudancas.push(`Validade: ${formatarValidade(anterior.validade)} → ${formatarValidade(atualizado.validade)}`);
  if(anterior.valor !== atualizado.valor) mudancas.push(`Valor: R$ ${anterior.valor.toFixed(2)} → R$ ${atualizado.valor.toFixed(2)}`);
  if(unidadesPorEmbalagem(anterior) !== atualizado.unidadesPorEmbalagem) mudancas.push(`Unidades por embalagem: ${unidadesPorEmbalagem(anterior)} → ${atualizado.unidadesPorEmbalagem}`);
  if((anterior.nomeUnidade || UNIDADE_PADRAO) !== atualizado.nomeUnidade) mudancas.push(`Unidade: "${anterior.nomeUnidade || UNIDADE_PADRAO}" → "${atualizado.nomeUnidade}"`);
  if(anterior.limite !== atualizado.limite) mudancas.push(`Mín. depósito: ${anterior.limite} → ${atualizado.limite}`);
  if((anterior.limiteClinica ?? MINIMO_ESTOQUE_CLINICA) !== atualizado.limiteClinica) mudancas.push(`Mín. clínica: ${anterior.limiteClinica ?? MINIMO_ESTOQUE_CLINICA} → ${atualizado.limiteClinica}`);
  if(anterior.tipo !== atualizado.tipo) mudancas.push(`Tipo: ${anterior.tipo} → ${atualizado.tipo}`);

  state.produtos[idx] = atualizado;
  await setData('produtos', state.produtos);
  if(mudancas.length > 0){
    await registrarMovimentacao('Produto editado', atualizado.id, atualizado.nome, null, mudancas.join('; '));
  }
  notify('Produto atualizado com sucesso.', 'success');
}

export function produtosBaixoEstoque(){
  return state.produtos.filter(p => p.estoqueExterno < p.limite);
}

export function produtosBaixoEstoqueClinica(){
  return state.produtos.filter(p => p.estoqueClinica < (p.limiteClinica ?? MINIMO_ESTOQUE_CLINICA));
}

export async function darBaixaSimples(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  if(produtoVencido(p)){
    notify(MSG_PRODUTO_VENCIDO, 'error');
    return;
  }
  const q = Number(quantidade);
  if(!q || q <= 0){
    notify('Informe uma quantidade válida.', 'error');
    return;
  }
  if(q > p.estoqueClinica){
    notify('Quantidade maior que o estoque disponível na clínica.', 'error');
    return;
  }
  p.estoqueClinica -= q;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Saída (uso)', p.id, p.nome, q);
  notify('Saída registrada.', 'success');
}

// a compra entra direto no depósito, que é contado em embalagens
export async function adicionarEntrada(produtoId, embalagens){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  if(produtoVencido(p)){
    notify(MSG_PRODUTO_VENCIDO, 'error');
    return;
  }
  const caixas = Number(embalagens);
  if(!caixas || caixas <= 0){
    notify('Informe uma quantidade válida.', 'error');
    return;
  }
  p.estoqueExterno += caixas;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Entrada', p.id, p.nome, caixas);
  notify(`Entrada registrada: ${descreverEmbalagens(p, caixas)} no depósito.`, 'success');
}

// sai do depósito em embalagens fechadas e chega na clínica em unidades soltas
export async function transferirParaClinica(produtoId, embalagens){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  if(produtoVencido(p)){
    notify(MSG_PRODUTO_VENCIDO, 'error');
    return;
  }
  const caixas = Number(embalagens);
  if(!caixas || caixas <= 0){
    notify('Informe uma quantidade válida.', 'error');
    return;
  }
  if(caixas > p.estoqueExterno){
    notify(`Quantidade maior que o disponível no depósito (${descreverEmbalagens(p, p.estoqueExterno)}).`, 'error');
    return;
  }

  const unidades = caixas * unidadesPorEmbalagem(p);
  const restante = p.estoqueExterno - caixas;
  const oQueSai = `${descreverEmbalagens(p, caixas)} de "${p.nome}"`;
  const mensagem = restante < p.limite
    ? `<strong style="color:var(--alert)">Atenção:</strong> transferir ${oQueSai} vai deixar o depósito com apenas ${restante} ${rotuloEmbalagem(p, restante)}, abaixo do mínimo (${p.limite}). Será necessário comprar mais em breve. Deseja continuar?`
    : `Transferir ${oQueSai} para a clínica? Restarão ${restante} ${rotuloEmbalagem(p, restante)} no depósito.`;
  const confirmou = await confirmar(mensagem);
  if(!confirmou) return;

  p.estoqueExterno -= caixas;
  p.estoqueClinica += unidades;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Transferência (depósito → clínica)', p.id, p.nome, caixas);
  notify(`Transferência registrada: a clínica recebeu ${unidades} ${rotuloUnidade(p, unidades)}.`, 'success');
}

export function abrirConfirmacaoEspecial(produtoId, quantidade){
  const p = state.produtos.find(x => x.id === produtoId);
  if(!p) return;
  if(produtoVencido(p)){
    notify(MSG_PRODUTO_VENCIDO, 'error');
    return;
  }
  const q = Number(quantidade);
  if(!q || q <= 0){
    notify('Informe uma quantidade válida.', 'error');
    return;
  }
  if(q > p.estoqueClinica){
    notify('Quantidade maior que o estoque disponível na clínica.', 'error');
    return;
  }
  state.confirmModal = { produtoId, quantidade: q };
}

export async function confirmarCompraEspecial(senhaDigitada){
  const p = state.produtos.find(x => x.id === state.confirmModal.produtoId);
  if(!p){ state.confirmModal = null; return; }

  if(produtoVencido(p)){
    notify(MSG_PRODUTO_VENCIDO, 'error');
    state.confirmModal = null;
    return;
  }

  if(!ehMedica()){
    notify('Somente a dermatologista ou a ginecologista pode aprovar produtos especiais.', 'error');
    state.confirmModal = null;
    return;
  }

  if(senhaDigitada !== state.currentUser.senha){
    notify('Senha incorreta. Retirada não autorizada.', 'error');
    return;
  }

  p.estoqueClinica -= state.confirmModal.quantidade;
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Saída (aprovada)', p.id, p.nome, state.confirmModal.quantidade);
  state.confirmModal = null;
  notify('Retirada aprovada.', 'success');
}

export function cancelarConfirmacao(){
  state.confirmModal = null;
}

export async function removeProduto(id){
  if(!podeGerenciarClinica()){
    notify('Você não tem permissão para remover produtos.', 'error');
    return;
  }

  const alvo = state.produtos.find(p => p.id === id);
  if(!alvo) return;

  const confirmou = await confirmar(`Remover o produto "${alvo.nome}"? Essa ação não pode ser desfeita.`);
  if(!confirmou) return;

  state.produtos = state.produtos.filter(p => p.id !== id);
  await setData('produtos', state.produtos);
  await registrarMovimentacao('Produto removido', alvo.id, alvo.nome, alvo.estoqueClinica + alvo.estoqueExterno);
  notify('Produto removido.', 'success');
}
