import { state } from '../state.js';
import { confirmarCompraEspecial, cancelarConfirmacao } from '../models/produtos.js';
import { passwordField, wirePasswordToggle } from '../components/passwordField.js';

export function renderConfirmModal(){
  const p = state.produtos.find(x => x.id === state.confirmModal.produtoId);
  return `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>Confirmar compra especial</h3>
        <p>Você está retirando <strong>${state.confirmModal.quantidade} un.</strong> de <strong>${p ? p.nome : ''}</strong>. Digite sua senha de login para confirmar.</p>
        ${passwordField('modal-senha-confirmacao', 'Sua senha')}
        <button class="btn btn-primary" id="btn-confirmar-senha">Confirmar retirada</button>
        <button class="btn" id="btn-cancelar-RQE">Cancelar</button>
      </div>
    </div>
  `;
}

export function wireConfirmModal(render){
  wirePasswordToggle('modal-senha-confirmacao');
  document.getElementById('btn-confirmar-senha').addEventListener('click', () => {
    const senha = document.getElementById('modal-senha-confirmacao').value;
    confirmarCompraEspecial(senha).then(render);
  });
  document.getElementById('btn-cancelar-RQE').addEventListener('click', () => {
    cancelarConfirmacao();
    render();
  });
}
