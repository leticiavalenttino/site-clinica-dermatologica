import { state } from '../state.js';
import {
  formatarMoeda, valorTotalEmProdutos, produtosDoProcedimento, custoProcedimento,
  liquidoProcedimento, addProcedimento, updateProcedimento, removeProcedimento,
  registrarAtendimento, removerAtendimento, totaisAtendimentos, impedimentosParaAtender,
  podeVerCaixa, ESPECIALIDADES, especialidadeDe, especialidadeDoPapel, procedimentoDaEspecialidade
} from '../models/caixa.js';
import { rotuloUnidade, valorUnitario, unidadesPorEmbalagem, fracionado } from '../models/produtos.js';

function formatarData(iso){
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${hora}<br>${data}`;
}

function classeValor(valor){
  if(valor > 0) return 'valor-positivo';
  if(valor < 0) return 'valor-negativo';
  return '';
}

function renderStatTiles(){
  const totais = totaisAtendimentos();
  return `
    <div class="stats-row">
      <div class="stat-tile">
        <span class="stat-tile-label">Em produtos</span>
        <div class="stat-tile-value"><span class="stat-tile-number stat-dinheiro">${formatarMoeda(valorTotalEmProdutos())}</span></div>
        <span class="stat-tile-suffix">parado em estoque (clínica + depósito)</span>
      </div>
      <div class="stat-tile">
        <span class="stat-tile-label">Faturado bruto</span>
        <div class="stat-tile-value"><span class="stat-tile-number stat-dinheiro">${formatarMoeda(totais.bruto)}</span></div>
        <span class="stat-tile-suffix">${state.atendimentos.length} atendimento(s)</span>
      </div>
      <div class="stat-tile">
        <span class="stat-tile-label">Custo dos produtos</span>
        <div class="stat-tile-value"><span class="stat-tile-number stat-dinheiro">${formatarMoeda(totais.custo)}</span></div>
        <span class="stat-tile-suffix">gasto nos atendimentos</span>
      </div>
      <div class="stat-tile">
        <span class="stat-tile-label">Faturado líquido</span>
        <div class="stat-tile-value"><span class="stat-tile-number stat-dinheiro ${classeValor(totais.liquido)}">${formatarMoeda(totais.liquido)}</span></div>
        <span class="stat-tile-suffix">bruto menos os produtos</span>
      </div>
    </div>
  `;
}

function rotuloProdutosUsados(proc){
  const itens = produtosDoProcedimento(proc);
  if(itens.length === 0) return '<span class="texto-fraco">nenhum produto</span>';
  return itens
    .map(i => i.produto
      ? `<strong>${i.quantidade} ${rotuloUnidade(i.produto, i.quantidade)}</strong> de ${i.produto.nome}`
      : `<span class="valor-negativo">produto removido (${i.quantidade})</span>`)
    .join('<br>');
}

function badgeEspecialidade(proc){
  const esp = especialidadeDe(proc);
  return `<span class="badge-esp ${esp}">${ESPECIALIDADES[esp]}</span>`;
}

/* Enquanto ninguém escolher nada, cada médica já vê a lista da própria área;
   administração e secretaria veem tudo. "Todas" está sempre a um clique, então
   o filtro nunca deixa um procedimento inalcançável. */
function filtroEspecialidadeAtual(){
  return state.filtroEspecialidadeCaixa || especialidadeDoPapel() || 'todas';
}

/* O cadastro e a edição abrem por cima da tela, no mesmo modal com fundo
   borrado que o detalhe do produto já usa: a tabela de procedimentos é longa e
   o formulário inline empurrava tudo para baixo. */
function renderModalProcedimento(){
  const editando = state.procedimentoEditandoId
    ? state.procedimentos.find(p => p.id === state.procedimentoEditandoId)
    : null;

  return `
    <div class="modal-backdrop" id="backdrop-procedimento">
      <div class="modal modal-procedimento">
        <div class="modal-header">
          <h2>${editando ? `Editar "${editando.nome}"` : 'Novo procedimento'}</h2>
          <button type="button" class="modal-close" id="btn-fechar-procedimento" aria-label="Fechar">&times;</button>
        </div>
        <form id="form-procedimento" class="form-procedimento">
          <div class="form-linha form-linha-3">
            <div class="field">
              <label>Nome do procedimento <span class="required-asterisk">*</span></label>
              <input id="pr-nome" type="text" placeholder="Ex: Botox" value="${editando ? editando.nome : ''}" required>
            </div>
            <div class="field">
              <label>Quanto a paciente paga (R$) <span class="required-asterisk">*</span></label>
              <input id="pr-preco" type="number" step="0.01" min="0" placeholder="0,00" value="${editando ? editando.preco : ''}" required>
            </div>
            <div class="field">
              <label>Especialidade</label>
              <select id="pr-especialidade">
                ${Object.entries(ESPECIALIDADES).map(([valor, rotulo]) => {
                  const atual = editando ? especialidadeDe(editando) : 'ambas';
                  return `<option value="${valor}" ${atual === valor ? 'selected' : ''}>${rotulo}</option>`;
                }).join('')}
              </select>
            </div>
          </div>

          <div class="field">
            <label>Produtos usados no procedimento</label>
            ${state.produtos.length === 0 ? '<p class="texto-fraco">Cadastre produtos antes para poder calcular o custo.</p>' : `
              <div class="chip-input-row">
                <select id="pr-produto">
                  <option value="" disabled selected>Selecione o produto...</option>
                  ${state.produtos.map(p => `<option value="${p.id}">${p.nome} — ${formatarMoeda(valorUnitario(p))} por ${rotuloUnidade(p, 1)}${fracionado(p) ? ` (caixa com ${unidadesPorEmbalagem(p)})` : ''}</option>`).join('')}
                </select>
                <input id="pr-quantidade" type="number" min="1" step="1" value="1" aria-label="Quantidade em unidades">
                <button type="button" id="btn-add-produto-proc" class="btn btn-primary">Adicionar</button>
              </div>
              <p class="campo-ajuda">A quantidade é em unidades de uso (ampolas, pares), não em caixas.</p>
            `}
            <div class="chip-list" id="lista-produtos-proc">${renderChipsProdutos()}</div>
          </div>

          <p class="form-custo-previa">Custo dos produtos: <strong>${formatarMoeda(custoFormAtual())}</strong></p>

          <div class="modal-acoes">
            <button type="submit" class="btn btn-primary">${editando ? 'Salvar alterações' : 'Cadastrar procedimento'}</button>
            <button type="button" class="btn" id="btn-cancelar-procedimento">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function custoFormAtual(){
  return state.formProcedimentoProdutos.reduce((soma, item) => {
    const p = state.produtos.find(x => x.id === item.produtoId);
    return soma + (p ? valorUnitario(p) * item.quantidade : 0);
  }, 0);
}

function renderChipsProdutos(){
  if(state.formProcedimentoProdutos.length === 0){
    return '<span class="texto-fraco">Nenhum produto adicionado.</span>';
  }
  return state.formProcedimentoProdutos.map((item, i) => {
    const p = state.produtos.find(x => x.id === item.produtoId);
    const rotulo = p
      ? `${item.quantidade} ${rotuloUnidade(p, item.quantidade)} de ${p.nome}`
      : `produto removido (${item.quantidade})`;
    return `<span class="chip">${rotulo}<button type="button" class="chip-remove" data-remove-produto-proc="${i}" aria-label="Remover">×</button></span>`;
  }).join('');
}

function renderTabelaProcedimentos(){
  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Tabela de procedimentos</h2>
        <button type="button" class="btn btn-primary" id="btn-novo-procedimento">Novo procedimento</button>
      </div>
      <p class="texto-fraco">Quanto cada procedimento rende em média, descontando os principais produtos que ele consome.</p>

      ${state.procedimentos.length === 0 ? '<p>Nenhum procedimento cadastrado ainda.</p>' : `
        <div class="table-scroll">
        <table class="tabela-caixa">
          <thead>
            <tr>
              <th>Procedimento</th><th class="col-especialidade">Especialidade</th><th>Produtos usados</th>
              <th class="col-dinheiro">Bruto</th><th class="col-dinheiro">Custo</th><th class="col-dinheiro">Líquido</th>
              <th class="col-acoes-caixa"></th>
            </tr>
          </thead>
          <tbody>
            ${state.procedimentos.map(proc => {
              const custo = custoProcedimento(proc);
              const liquido = liquidoProcedimento(proc);
              return `
              <tr>
                <td><strong>${proc.nome}</strong></td>
                <td class="col-especialidade">${badgeEspecialidade(proc)}</td>
                <td>${rotuloProdutosUsados(proc)}</td>
                <td class="col-dinheiro">${formatarMoeda(proc.preco)}</td>
                <td class="col-dinheiro">${formatarMoeda(custo)}</td>
                <td class="col-dinheiro ${classeValor(liquido)}"><strong>${formatarMoeda(liquido)}</strong></td>
                <td class="col-acoes-caixa td-acoes">
                  <button class="btn" data-editar-procedimento="${proc.id}">Editar</button>
                  <button class="btn btn-danger" data-remover-procedimento="${proc.id}">Remover</button>
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
        </div>
      `}
    </div>
  `;
}

function renderFiltroEspecialidade(){
  const atual = filtroEspecialidadeAtual();
  const opcao = (valor, rotulo) => `<button type="button" class="btn btn-filtro ${atual === valor ? 'ativo' : ''}" data-filtro-esp="${valor}">${rotulo}</button>`;
  return `
    <div class="filtro-especialidade">
      <span class="texto-fraco">Mostrar procedimentos de:</span>
      ${opcao('todas', 'Todas')}
      ${opcao('dermatologia', 'Dermatologia')}
      ${opcao('ginecologia', 'Ginecologia')}
    </div>
  `;
}

function renderFormAtendimento(){
  if(state.procedimentos.length === 0){
    return '<p class="texto-fraco">Cadastre um procedimento na tabela acima para poder registrar atendimentos.</p>';
  }
  const filtro = filtroEspecialidadeAtual();
  const disponiveis = state.procedimentos.filter(p => procedimentoDaEspecialidade(p, filtro));
  return `
    ${renderFiltroEspecialidade()}
    ${disponiveis.length === 0 ? `<p class="texto-fraco">Nenhum procedimento de ${ESPECIALIDADES[filtro]} cadastrado ainda. Escolha "Todas" para ver os demais.</p>` : `
      <form id="form-atendimento" class="form-linha form-atendimento">
        <div class="field">
          <label>Procedimento realizado <span class="required-asterisk">*</span></label>
          <select id="at-procedimento" required>
            <option value="" disabled selected>Selecione...</option>
            ${disponiveis.map(p => {
              const impedido = impedimentosParaAtender(p).length > 0;
              return `<option value="${p.id}">${p.nome} — ${formatarMoeda(p.preco)}${impedido ? ' (sem estoque)' : ''}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="field">
          <label>Paciente</label>
          <select id="at-paciente">
            <option value="">Não informar</option>
            ${state.pacientes.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Registrar atendimento</button>
      </form>
    `}
  `;
}

function renderTabelaAtendimentos(){
  const totais = totaisAtendimentos();
  return `
    <div class="panel">
      <h2>Atendimentos realizados</h2>
      <p class="texto-fraco">Cada atendimento registrado dá baixa nos produtos usados e entra no faturamento.</p>

      ${renderFormAtendimento()}

      ${state.atendimentos.length === 0 ? '<p>Nenhum atendimento registrado ainda.</p>' : `
        <div class="table-scroll">
        <table class="tabela-caixa">
          <thead>
            <tr>
              <th class="col-data">Data/Hora</th><th>Procedimento</th><th>Paciente</th><th>Registrado por</th>
              <th class="col-dinheiro">Bruto</th><th class="col-dinheiro">Custo</th><th class="col-dinheiro">Líquido</th>
              <th class="col-acoes-caixa"></th>
            </tr>
          </thead>
          <tbody>
            ${[...state.atendimentos].sort((a,b) => b.data.localeCompare(a.data)).map(a => {
              const liquido = a.valorBruto - a.custoProdutos;
              return `
              <tr>
                <td class="col-data">${formatarData(a.data)}</td>
                <td><strong>${a.procedimentoNome}</strong></td>
                <td>${a.pacienteNome || '-'}</td>
                <td>${a.usuario}</td>
                <td class="col-dinheiro">${formatarMoeda(a.valorBruto)}</td>
                <td class="col-dinheiro">${formatarMoeda(a.custoProdutos)}</td>
                <td class="col-dinheiro ${classeValor(liquido)}"><strong>${formatarMoeda(liquido)}</strong></td>
                <td class="col-acoes-caixa td-acoes"><button class="btn btn-danger" data-remover-atendimento="${a.id}">Remover</button></td>
              </tr>
            `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4"><strong>Total</strong></td>
              <td class="col-dinheiro"><strong>${formatarMoeda(totais.bruto)}</strong></td>
              <td class="col-dinheiro"><strong>${formatarMoeda(totais.custo)}</strong></td>
              <td class="col-dinheiro ${classeValor(totais.liquido)}"><strong>${formatarMoeda(totais.liquido)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        </div>
      `}
    </div>
  `;
}

export function renderCaixa(){
  if(!podeVerCaixa()){
    return '<h1>Caixa</h1><div class="panel"><p>Esta tela é restrita à administração e às médicas.</p></div>';
  }
  return `
    <h1>Caixa</h1>
    ${renderStatTiles()}
    ${renderTabelaProcedimentos()}
    ${renderTabelaAtendimentos()}
    ${state.mostrarFormProcedimento ? renderModalProcedimento() : ''}
  `;
}

// atualiza só a lista de produtos e a prévia de custo, para não re-renderizar a
// tela inteira e perder o nome/preço que já foram digitados no formulário
function atualizarProdutosDoFormNaTela(){
  const container = document.getElementById('lista-produtos-proc');
  if(!container) return;
  container.innerHTML = renderChipsProdutos();
  container.querySelectorAll('[data-remove-produto-proc]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.formProcedimentoProdutos.splice(Number(btn.dataset.removeProdutoProc), 1);
      atualizarProdutosDoFormNaTela();
    });
  });

  const previa = document.querySelector('.form-custo-previa');
  if(previa) previa.innerHTML = `Custo dos produtos: <strong>${formatarMoeda(custoFormAtual())}</strong>`;
}

function abrirFormProcedimento(proc, render){
  state.mostrarFormProcedimento = true;
  state.procedimentoEditandoId = proc ? proc.id : null;
  state.formProcedimentoProdutos = proc ? (proc.produtos || []).map(i => ({ ...i })) : [];
  render();
}

function fecharFormProcedimento(render){
  state.mostrarFormProcedimento = false;
  state.procedimentoEditandoId = null;
  state.formProcedimentoProdutos = [];
  render();
}

export function wireCaixa(render){
  document.querySelectorAll('[data-filtro-esp]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filtroEspecialidadeCaixa = btn.dataset.filtroEsp;
      render();
    });
  });

  const btnNovo = document.getElementById('btn-novo-procedimento');
  if(btnNovo) btnNovo.addEventListener('click', () => abrirFormProcedimento(null, render));

  document.querySelectorAll('[data-editar-procedimento]').forEach(btn => {
    btn.addEventListener('click', () => {
      const proc = state.procedimentos.find(p => p.id === btn.dataset.editarProcedimento);
      if(proc) abrirFormProcedimento(proc, render);
    });
  });

  document.querySelectorAll('[data-remover-procedimento]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeProcedimento(btn.dataset.removerProcedimento).then(render);
    });
  });

  ['btn-cancelar-procedimento', 'btn-fechar-procedimento'].forEach(id => {
    const btn = document.getElementById(id);
    if(btn) btn.addEventListener('click', () => fecharFormProcedimento(render));
  });

  const backdrop = document.getElementById('backdrop-procedimento');
  if(backdrop){
    backdrop.addEventListener('click', (e) => {
      if(e.target === backdrop) fecharFormProcedimento(render);
    });
  }

  const btnAddProduto = document.getElementById('btn-add-produto-proc');
  if(btnAddProduto){
    btnAddProduto.addEventListener('click', () => {
      const produtoId = document.getElementById('pr-produto').value;
      const quantidade = Number(document.getElementById('pr-quantidade').value);
      if(!produtoId || !(quantidade > 0)) return;

      const existente = state.formProcedimentoProdutos.find(i => i.produtoId === produtoId);
      if(existente){
        existente.quantidade += quantidade;
      } else {
        state.formProcedimentoProdutos.push({ produtoId, quantidade });
      }
      atualizarProdutosDoFormNaTela();
    });
  }

  document.querySelectorAll('[data-remove-produto-proc]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.formProcedimentoProdutos.splice(Number(btn.dataset.removeProdutoProc), 1);
      atualizarProdutosDoFormNaTela();
    });
  });

  const formProcedimento = document.getElementById('form-procedimento');
  if(formProcedimento){
    formProcedimento.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dados = {
        nome: document.getElementById('pr-nome').value,
        preco: document.getElementById('pr-preco').value,
        especialidade: document.getElementById('pr-especialidade').value,
        produtos: state.formProcedimentoProdutos
      };
      const salvou = state.procedimentoEditandoId
        ? await updateProcedimento(state.procedimentoEditandoId, dados)
        : await addProcedimento(dados);
      if(salvou) fecharFormProcedimento(render); else render();
    });
  }

  const formAtendimento = document.getElementById('form-atendimento');
  if(formAtendimento){
    formAtendimento.addEventListener('submit', async (e) => {
      e.preventDefault();
      await registrarAtendimento({
        procedimentoId: document.getElementById('at-procedimento').value,
        pacienteId: document.getElementById('at-paciente').value
      });
      render();
    });
  }

  document.querySelectorAll('[data-remover-atendimento]').forEach(btn => {
    btn.addEventListener('click', () => {
      removerAtendimento(btn.dataset.removerAtendimento).then(render);
    });
  });
}
