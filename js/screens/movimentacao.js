import { state } from '../state.js';
import { removerMovimentacao, TIPOS_ACESSO } from '../models/movimentacoes.js';
import { podeGerenciarClinica } from '../models/permissoes.js';
import { capitalizar } from './shell.js';

const TIPOS_ENTRADA = new Set(['Entrada', 'Produto cadastrado']);
const TIPOS_TRANSFERENCIA = new Set(['Transferência (depósito → clínica)']);
const TIPOS_EDICAO = new Set(['Produto editado']);

function formatarData(iso){
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${hora}<br>${data}`;
}
function formatarValidade(iso){
  if(!iso) return '-';
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
}
const ROTULOS_DETALHES = [
  [/^nome /, 'Nome: '],
  [/^descrição atualizada$/, 'Descrição: atualizada'],
  [/^lote /, 'Lote: '],
  [/^validade /, 'Validade: '],
  [/^valor /, 'Valor: '],
  [/^mín\. depósito /, 'Mín. depósito: '],
  [/^mín\. clínica /, 'Mín. clínica: '],
  [/^tipo /, 'Tipo: '],
];
function formatarDetalhes(detalhes){
  if(!detalhes) return detalhes;
  const comRotulos = detalhes.split('; ').map(segmento => {
    const rotulo = ROTULOS_DETALHES.find(([re]) => re.test(segmento));
    return rotulo ? segmento.replace(rotulo[0], rotulo[1]) : segmento;
  }).join('; ');
  return comRotulos.replace(/: (\p{Ll})/gu, (_, letra) => `: ${letra.toUpperCase()}`);
}

/* As tabelas desta tela começam todas fechadas: são quatro listas longas e
   quem entra quase sempre quer olhar só uma. O <details> abre e fecha sozinho;
   state.paineisMovAbertos existe apenas para o painel continuar aberto quando
   a tela é redesenhada (ao remover um registro, por exemplo), e é zerado a
   cada login para que tudo volte minimizado. */
function painelColapsavel(id, titulo, total, conteudo){
  const aberto = state.paineisMovAbertos.includes(id);
  return `
    <details class="panel panel-colapsavel" data-painel-mov="${id}" ${aberto ? 'open' : ''}>
      <summary class="panel-summary">
        <span class="panel-summary-seta" aria-hidden="true">&#9656;</span>
        <span class="panel-summary-titulo">${titulo}</span>
        <span class="panel-summary-contagem">${total} ${total === 1 ? 'registro' : 'registros'}</span>
      </summary>
      <div class="panel-corpo">${conteudo}</div>
    </details>
  `;
}

function renderTabelaMovimentacao(id, titulo, lista, detalhesCadastro){
  return painelColapsavel(id, titulo, lista.length, `
      ${lista.length === 0 ? '<p>Nenhuma movimentação registrada ainda.</p>' : `
        <div class="table-scroll">
        <table class="tabela-mov${detalhesCadastro ? ' tabela-mov-completa' : ''}">
          <thead>
            <tr>
              <th class="col-data">Data/Hora</th><th class="col-usuario">Usuário</th><th class="col-papel">Papel</th><th>Produto</th><th class="col-compacto col-tipo">Tipo</th>
              ${detalhesCadastro ? '<th class="col-compacto col-lote">Lote</th><th class="col-compacto col-validade">Validade</th><th class="col-compacto col-valor">Valor (R$)</th><th class="col-compacto col-estoque">Estoque mínimo</th>' : ''}
              <th class="col-compacto col-qtd">Qtd</th>
              ${podeGerenciarClinica() ? '<th class="col-acoes"></th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${lista.map(m => {
              const produto = (m.produtoId && state.produtos.find(p => p.id === m.produtoId)) || state.produtos.find(p => p.nome === m.produtoNome);
              const ehCadastro = detalhesCadastro && m.tipo === 'Produto cadastrado' && produto;
              return `
              <tr>
                <td class="col-data">${formatarData(m.data)}</td>
                <td class="col-usuario">${m.usuario}</td>
                <td class="col-papel">${capitalizar(m.papel)}</td>
                <td>${m.produtoNome}</td>
                <td class="col-compacto col-tipo">${produto ? produto.tipo : '-'}</td>
                ${detalhesCadastro ? `
                <td class="col-compacto col-lote">${ehCadastro ? (produto.lote || '-') : '-'}</td>
                <td class="col-compacto col-validade">${ehCadastro ? formatarValidade(produto.validade) : '-'}</td>
                <td class="col-compacto col-valor">${ehCadastro ? `R$ ${produto.valor.toFixed(2)}` : '-'}</td>
                <td class="col-compacto col-estoque">${ehCadastro ? produto.limite : '-'}</td>
                ` : ''}
                <td class="col-compacto col-qtd">${m.quantidade}</td>
                ${podeGerenciarClinica() ? `<td class="td-acoes col-acoes"><button class="btn btn-danger" data-remove-mov="${m.id}">Remover</button></td>` : ''}
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        </div>
      `}
  `);
}

function renderTabelaEdicoes(lista){
  return painelColapsavel('edicoes', 'Alterações de cadastro', lista.length, `
      ${lista.length === 0 ? '<p>Nenhuma alteração registrada ainda.</p>' : `
        <div class="table-scroll">
        <table class="tabela-mov tabela-mov-edicoes">
          <thead><tr><th class="col-data">Data/Hora</th><th class="col-usuario">Usuário</th><th class="col-papel">Papel</th><th class="col-produto">Produto</th><th>O que mudou</th></tr></thead>
          <tbody>
            ${lista.map(m => `
              <tr>
                <td class="col-data">${formatarData(m.data)}</td>
                <td class="col-usuario">${m.usuario}</td>
                <td class="col-papel">${capitalizar(m.papel)}</td>
                <td class="col-produto">${m.produtoNome}</td>
                <td>${formatarDetalhes(m.detalhes) || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      `}
  `);
}

/* Acessos e contas não têm produto nem quantidade, então ganham uma tabela
   própria em vez de cair no meio das saídas de estoque. Só quem responde pela
   clínica enxerga essa lista, pelo mesmo motivo que a aba de usuários é
   restrita: é um registro de quem entrou e quando. */
function renderTabelaAcessos(lista){
  if(!podeGerenciarClinica()) return '';
  return painelColapsavel('acessos', 'Acessos e usuários', lista.length, `
      ${lista.length === 0 ? '<p>Nenhum acesso registrado ainda.</p>' : `
        <div class="table-scroll">
        <table class="tabela-mov tabela-mov-edicoes">
          <thead><tr><th class="col-data">Data/Hora</th><th class="col-usuario">Usuário</th><th class="col-papel">Papel</th><th class="col-produto">Evento</th><th>Detalhes</th></tr></thead>
          <tbody>
            ${lista.map(m => `
              <tr>
                <td class="col-data">${formatarData(m.data)}</td>
                <td class="col-usuario">${m.usuario}</td>
                <td class="col-papel">${capitalizar(m.papel)}</td>
                <td class="col-produto">${m.tipo}</td>
                <td>${formatarDetalhes(m.detalhes) || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        </div>
      `}
  `);
}

export function renderMovimentacao(){
  const ordenadas = [...state.movimentacoes].sort((a,b) => b.data.localeCompare(a.data));
  const entradas = ordenadas.filter(m => TIPOS_ENTRADA.has(m.tipo));
  const transferencias = ordenadas.filter(m => TIPOS_TRANSFERENCIA.has(m.tipo));
  const edicoes = ordenadas.filter(m => TIPOS_EDICAO.has(m.tipo));
  const acessos = ordenadas.filter(m => TIPOS_ACESSO.has(m.tipo));
  const saidas = ordenadas.filter(m => !TIPOS_ENTRADA.has(m.tipo) && !TIPOS_TRANSFERENCIA.has(m.tipo) && !TIPOS_EDICAO.has(m.tipo) && !TIPOS_ACESSO.has(m.tipo));
  return `
    <h1>Movimentação</h1>
    ${renderTabelaMovimentacao('entradas', 'Entradas (compras)', entradas, true)}
    ${renderTabelaMovimentacao('transferencias', 'Transferências para a clínica', transferencias, false)}
    ${renderTabelaMovimentacao('saidas', 'Saídas', saidas, false)}
    ${renderTabelaEdicoes(edicoes)}
    ${renderTabelaAcessos(acessos)}
  `;
}

export function wireMovimentacao(render){
  document.querySelectorAll('[data-painel-mov]').forEach(painel => {
    painel.addEventListener('toggle', () => {
      const id = painel.dataset.painelMov;
      state.paineisMovAbertos = painel.open
        ? [...new Set([...state.paineisMovAbertos, id])]
        : state.paineisMovAbertos.filter(x => x !== id);
    });
  });

  document.querySelectorAll('[data-remove-mov]').forEach(btn => {
    btn.addEventListener('click', () => {
      removerMovimentacao(btn.dataset.removeMov).then(render);
    });
  });
}