import { state } from '../state.js';
import {
  addPaciente, updatePaciente, removePaciente,
  calcularIdade, podeGerenciarPacientes, procedimentosDesejadosDe
} from '../models/pacientes.js';

function formatarData(dataNascimento){
  return new Date(dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatarDataHora(iso){
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function renderChip(proc, i){
  return `<span class="chip">${proc} <button type="button" class="chip-remove" data-remove-chip="${i}">×</button></span>`;
}

function renderListaChips(){
  return state.formProcedimentosDesejados.length
    ? state.formProcedimentosDesejados.map(renderChip).join('')
    : '<span class="chip-empty">Nenhum adicionado ainda.</span>';
}

function renderCardPaciente(p){
  return `
    <div class="paciente-card" data-abrir-paciente="${p.id}">
      <div class="paciente-card-header">
        <strong>${p.nome}</strong>
        <span>${calcularIdade(p.dataNascimento)} anos</span>
      </div>
      <p><strong>Celular:</strong> ${p.celular}</p>
      <p><strong>Procedimento(s) desejado(s):</strong> ${procedimentosDesejadosDe(p).join(', ') || '-'}</p>
      <span class="paciente-card-hint">Toque para ver todos os detalhes</span>
    </div>
  `;
}

function renderDetalhePaciente(){
  const p = state.pacientes.find(x => x.id === state.pacienteDetalheId);
  if(!p) return '';
  return `
    <div class="modal-backdrop" id="backdrop-detalhe-paciente">
      <div class="modal modal-lg">
        <h2>${p.nome}</h2>
        <div class="paciente-detalhe-grid">
          <div class="paciente-detalhe-item"><span class="label">Idade</span><span class="valor">${calcularIdade(p.dataNascimento)} anos</span></div>
          <div class="paciente-detalhe-item"><span class="label">Nascimento</span><span class="valor">${formatarData(p.dataNascimento)}</span></div>
          <div class="paciente-detalhe-item"><span class="label">Celular</span><span class="valor">${p.celular}</span></div>
          <div class="paciente-detalhe-item"><span class="label">Doença crônica</span><span class="valor">${p.doencaCronica || 'Nenhuma'}</span></div>
          <div class="paciente-detalhe-item"><span class="label">Alergias</span><span class="valor">${p.alergias || 'Nenhuma'}</span></div>
          <div class="paciente-detalhe-item"><span class="label">Cadastrado por</span><span class="valor">${p.cadastradoPor}</span></div>
          <div class="paciente-detalhe-item"><span class="label">Cadastrado em</span><span class="valor">${p.criadoEm ? formatarDataHora(p.criadoEm) : '-'}</span></div>
          <div class="paciente-detalhe-item full"><span class="label">Endereço</span><span class="valor">${p.endereco || '-'}</span></div>
          <div class="paciente-detalhe-item full"><span class="label">Já fez procedimento antes</span><span class="valor">${p.jaFezProcedimento ? `Sim — ${p.procedimentosAnteriores || 'não especificado'}` : 'Não'}</span></div>
          <div class="paciente-detalhe-item full"><span class="label">Procedimento(s) desejado(s)</span><span class="valor">${procedimentosDesejadosDe(p).join(', ') || '-'}</span></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
          ${podeGerenciarPacientes() ? `<button type="button" class="btn btn-primary" id="btn-editar-paciente">Editar</button>` : ''}
          ${state.currentUser.papel === 'admin' ? `<button type="button" class="btn btn-danger" data-remove-paciente="${p.id}">Remover</button>` : ''}
          <button type="button" class="btn" id="btn-fechar-detalhe-paciente">Fechar</button>
        </div>
      </div>
    </div>
  `;
}

function renderFormPaciente(){
  const editando = state.formPacienteId && state.formPacienteId !== 'novo';
  const p = editando ? state.pacientes.find(x => x.id === state.formPacienteId) : null;
  return `
    <div class="modal-backdrop" id="backdrop-form-paciente">
      <div class="modal modal-lg">
        <h2>${editando ? 'Editar paciente' : 'Cadastrar novo paciente'}</h2>
        <form id="form-paciente">
          <div class="field"><label>Nome</label><input id="np-nome" type="text" value="${p ? p.nome : ''}" required></div>
          <div class="field"><label>Data de nascimento</label><input id="np-nascimento" type="date" value="${p ? p.dataNascimento : ''}" required></div>
          <div class="field"><label>Celular</label><input id="np-celular" type="text" value="${p ? p.celular : ''}" required></div>
          <div class="field"><label>Endereço</label><input id="np-endereco" type="text" value="${p ? p.endereco : ''}"></div>
          <div class="field"><label>Doença crônica</label><input id="np-doenca" type="text" placeholder="Nenhuma" value="${p ? p.doencaCronica : ''}"></div>
          <div class="field"><label>Alergias</label><input id="np-alergias" type="text" placeholder="Nenhuma" value="${p ? p.alergias : ''}"></div>
          <div class="field field-checkbox">
            <label><input id="np-ja-fez" type="checkbox" ${p && p.jaFezProcedimento ? 'checked' : ''}> <span>Já fez algum procedimento antes?</span></label>
          </div>
          <div class="field" id="np-procedimentos-field" style="display:${p && p.jaFezProcedimento ? 'block' : 'none'};">
            <label>Quais procedimentos?</label>
            <input id="np-procedimentos" type="text" value="${p ? p.procedimentosAnteriores : ''}">
          </div>
          <div class="field">
            <label>Procedimento(s) desejado(s)</label>
            <div class="chip-input-row">
              <input id="np-procedimento-novo" type="text" placeholder="Ex: Botox">
              <button type="button" id="btn-add-procedimento" class="btn btn-primary">Adicionar</button>
            </div>
            <div class="chip-list" id="lista-procedimentos-desejados">${renderListaChips()}</div>
          </div>
          <button type="submit" class="btn btn-primary">${editando ? 'Salvar alterações' : 'Cadastrar paciente'}</button>
          <button type="button" class="btn" id="btn-cancelar-form-paciente">Cancelar</button>
        </form>
      </div>
    </div>
  `;
}

export function renderPacientes(){
  const podeAdicionar = podeGerenciarPacientes();
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h1>Pacientes</h1>
      ${podeAdicionar ? `<button id="btn-toggle-novo-paciente" class="btn btn-primary" title="Cadastrar novo paciente" style="font-size:1.3rem;line-height:1;padding:8px 16px;">+</button>` : ''}
    </div>
    ${state.formPacienteId ? renderFormPaciente() : ''}
    ${state.pacienteDetalheId ? renderDetalhePaciente() : ''}
    <div class="panel">
      ${state.pacientes.length === 0 ? '<p>Nenhum paciente cadastrado ainda.</p>' : `
        <div class="paciente-cards">
          ${state.pacientes.map(renderCardPaciente).join('')}
        </div>
      `}
    </div>
  `;
}

function abrirFormNovo(){
  state.formPacienteId = 'novo';
  state.formProcedimentosDesejados = [];
}

function abrirFormEdicao(id){
  const p = state.pacientes.find(x => x.id === id);
  if(!p) return;
  state.formPacienteId = id;
  state.formProcedimentosDesejados = procedimentosDesejadosDe(p).slice();
}

function atualizarListaChipsNaTela(){
  const container = document.getElementById('lista-procedimentos-desejados');
  if(!container) return;
  container.innerHTML = renderListaChips();
  container.querySelectorAll('[data-remove-chip]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.formProcedimentosDesejados.splice(Number(btn.dataset.removeChip), 1);
      atualizarListaChipsNaTela();
    });
  });
}

export function wirePacientes(render){
  const btnToggle = document.getElementById('btn-toggle-novo-paciente');
  if(btnToggle){
    btnToggle.addEventListener('click', () => {
      abrirFormNovo();
      render();
    });
  }

  document.querySelectorAll('[data-abrir-paciente]').forEach(card => {
    card.addEventListener('click', () => {
      state.pacienteDetalheId = card.dataset.abrirPaciente;
      render();
    });
  });

  const btnFecharDetalhe = document.getElementById('btn-fechar-detalhe-paciente');
  if(btnFecharDetalhe){
    btnFecharDetalhe.addEventListener('click', () => {
      state.pacienteDetalheId = null;
      render();
    });
  }
  const backdropDetalhe = document.getElementById('backdrop-detalhe-paciente');
  if(backdropDetalhe){
    backdropDetalhe.addEventListener('click', (e) => {
      if(e.target === backdropDetalhe){
        state.pacienteDetalheId = null;
        render();
      }
    });
  }

  const btnEditar = document.getElementById('btn-editar-paciente');
  if(btnEditar){
    btnEditar.addEventListener('click', () => {
      abrirFormEdicao(state.pacienteDetalheId);
      state.pacienteDetalheId = null;
      render();
    });
  }

  const btnCancelarForm = document.getElementById('btn-cancelar-form-paciente');
  if(btnCancelarForm){
    btnCancelarForm.addEventListener('click', () => {
      state.formPacienteId = null;
      render();
    });
  }
  const backdropForm = document.getElementById('backdrop-form-paciente');
  if(backdropForm){
    backdropForm.addEventListener('click', (e) => {
      if(e.target === backdropForm){
        state.formPacienteId = null;
        render();
      }
    });
  }

  const checkboxJaFez = document.getElementById('np-ja-fez');
  const campoProcedimentos = document.getElementById('np-procedimentos-field');
  if(checkboxJaFez){
    checkboxJaFez.addEventListener('change', () => {
      campoProcedimentos.style.display = checkboxJaFez.checked ? 'block' : 'none';
    });
  }

  const btnAddProcedimento = document.getElementById('btn-add-procedimento');
  if(btnAddProcedimento){
    btnAddProcedimento.addEventListener('click', () => {
      const input = document.getElementById('np-procedimento-novo');
      const valor = input.value.trim();
      if(!valor) return;
      state.formProcedimentosDesejados.push(valor);
      input.value = '';
      atualizarListaChipsNaTela();
    });
    atualizarListaChipsNaTela();
  }

  const form = document.getElementById('form-paciente');
  if(form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const dados = {
        nome: document.getElementById('np-nome').value,
        dataNascimento: document.getElementById('np-nascimento').value,
        celular: document.getElementById('np-celular').value,
        endereco: document.getElementById('np-endereco').value,
        doencaCronica: document.getElementById('np-doenca').value,
        alergias: document.getElementById('np-alergias').value,
        jaFezProcedimento: document.getElementById('np-ja-fez').checked,
        procedimentosAnteriores: document.getElementById('np-procedimentos').value,
        procedimentosDesejados: state.formProcedimentosDesejados.slice()
      };
      if(state.formPacienteId === 'novo'){
        await addPaciente(dados);
      } else {
        await updatePaciente(state.formPacienteId, dados);
      }
      state.formPacienteId = null;
      render();
    });
  }

  document.querySelectorAll('[data-remove-paciente]').forEach(btn => {
    btn.addEventListener('click', () => {
      removePaciente(btn.dataset.removePaciente).then(removeu => {
        if(!removeu) return;
        state.pacienteDetalheId = null;
        render();
      });
    });
  });
}
