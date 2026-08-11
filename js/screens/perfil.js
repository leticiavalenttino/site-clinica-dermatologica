import { state } from '../state.js';
import { atualizarNomeUsuario, alterarSenha } from '../models/usuarios.js';

export function renderPerfilModal(){
  return `
    <div class="modal-backdrop" id="backdrop-perfil">
      <div class="modal">
        <h3>Meu perfil</h3>
        <form id="form-perfil-nome">
          <div class="field"><label>Nome de usuário</label><input id="perfil-usuario" type="text" value="${state.currentUser.usuario}" required></div>
          <button type="submit" class="btn btn-primary">Salvar nome</button>
        </form>
        <hr style="margin:20px 0;border:none;border-top:1px solid var(--border);">
        <form id="form-perfil-senha">
          <div class="field"><label>Senha atual</label><input id="perfil-senha-atual" type="password" required></div>
          <div class="field"><label>Nova senha</label><input id="perfil-senha-nova" type="password" required></div>
          <div class="field"><label>Confirmar nova senha</label><input id="perfil-senha-confirmar" type="password" required></div>
          <button type="submit" class="btn btn-primary">Alterar senha</button>
        </form>
        <button type="button" class="btn" id="btn-fechar-perfil" style="margin-top:12px;">Fechar</button>
      </div>
    </div>
  `;
}

export function wirePerfilModal(render){
  document.getElementById('form-perfil-nome').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await atualizarNomeUsuario(document.getElementById('perfil-usuario').value);
    render();
  });

  document.getElementById('form-perfil-senha').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await alterarSenha(
      document.getElementById('perfil-senha-atual').value,
      document.getElementById('perfil-senha-nova').value,
      document.getElementById('perfil-senha-confirmar').value
    );
    render();
  });

  document.getElementById('btn-fechar-perfil').addEventListener('click', ()=>{
    state.mostrarPerfil = false;
    render();
  });

  document.getElementById('backdrop-perfil').addEventListener('click', (e)=>{
    if(e.target.id === 'backdrop-perfil'){
      state.mostrarPerfil = false;
      render();
    }
  });
}
