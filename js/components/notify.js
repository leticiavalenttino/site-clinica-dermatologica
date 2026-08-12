function garantirToastContainer(){
  let container = document.getElementById('toast-container');
  if(!container){
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function notify(mensagem, tipo = 'info'){
  const container = garantirToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensagem;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  const remover = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  };
  const timer = setTimeout(remover, 4000);
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    remover();
  });
}

export function confirmar(mensagem){
  return new Promise(resolve => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <h3>Confirmar ação</h3>
        <p>${mensagem}</p>
        <div class="confirm-botoes">
          <button type="button" class="btn btn-danger" id="confirm-sim">Confirmar</button>
          <button type="button" class="btn" id="confirm-nao">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const finalizar = (resultado) => {
      backdrop.remove();
      resolve(resultado);
    };
    backdrop.querySelector('#confirm-sim').addEventListener('click', () => finalizar(true));
    backdrop.querySelector('#confirm-nao').addEventListener('click', () => finalizar(false));
    backdrop.addEventListener('click', (e) => {
      if(e.target === backdrop) finalizar(false);
    });
  });
}
