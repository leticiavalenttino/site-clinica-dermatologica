import { state } from '../state.js';
import { confirmarCompraEspecial, cancelarConfirmacao } from '../models/produtos.js';

export function renderConfirmModal(){
  const p = state.produtos.find(x => x.id === state.confirmModal.produtoId);
  return `
    <div class="modal-backdrop">
      <div class="modal">
        <h3>Confirmar compra especial</h3>
        <p>Você está retirando <strong>${state.confirmModal.quantidade} un.</strong> de <strong>${p ? p.nome : ''}</strong>. Digite o RQE da dermatologista para confirmar.</p>
        <div class="field">
          <label>RQE</label>
          <input id="modal-RQE" type="text">
        </div>
        <button class="btn btn-primary" id="btn-confirmar-RQE">Confirmar retirada</button>
        <button class="btn" id="btn-cancelar-RQE">Cancelar</button>
      </div>
    </div>
  `;
}

export function wireConfirmModal(render){
  document.getElementById('btn-confirmar-RQE').addEventListener('click', () => {
    const RQE = document.getElementById('modal-RQE').value;
    confirmarCompraEspecial(RQE).then(render);
  });
  document.getElementById('btn-cancelar-RQE').addEventListener('click', () => {
    cancelarConfirmacao();
    render();
  });
}