import { state } from '../state.js';
import { atualizarNomeUsuario, atualizarEmailUsuario, alterarSenha } from '../models/usuarios.js';
import { passwordField, wirePasswordToggle } from '../components/passwordField.js';

export function renderPerfilModal(){
  return `
    <div class="modal-backdrop" id="backdrop-perfil">
      <div class="modal modal-perfil">
        <div class="modal-header">
          <h3>Meu perfil</h3>
          <button type="button" class="modal-close" id="btn-fechar-perfil" aria-label="Fechar">&times;</button>
        </div>
        <form id="form-perfil">
          <div class="field"><label>Nome de usuário</label><input id="perfil-usuario" type="text" value="${state.currentUser.usuario}" required></div>
          <div class="field"><label>E-mail</label><input id="perfil-email" type="email" value="${state.currentUser.email || ''}"></div>
          ${passwordField('perfil-senha-atual', 'Senha atual', { obrigatorio: false })}
          ${passwordField('perfil-senha-nova', 'Nova senha', { obrigatorio: false })}
          ${passwordField('perfil-senha-confirmar', 'Confirmar nova senha', { obrigatorio: false })}
          <button type="submit" class="btn btn-primary">Alterar dados</button>
        </form>
      </div>
    </div>
  `;
}

export function wirePerfilModal(render){
  ['perfil-senha-atual', 'perfil-senha-nova', 'perfil-senha-confirmar'].forEach(id => wirePasswordToggle(id));

  document.getElementById('form-perfil').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const usuario = document.getElementById('perfil-usuario').value;
    const email = document.getElementById('perfil-email').value;
    const senhaAtual = document.getElementById('perfil-senha-atual').value;
    const senhaNova = document.getElementById('perfil-senha-nova').value;
    const senhaConfirmar = document.getElementById('perfil-senha-confirmar').value;

    if(usuario.trim() !== state.currentUser.usuario){
      await atualizarNomeUsuario(usuario);
    }
    if(email.trim() !== (state.currentUser.email || '')){
      await atualizarEmailUsuario(email);
    }
    if(senhaAtual || senhaNova || senhaConfirmar){
      await alterarSenha(senhaAtual, senhaNova, senhaConfirmar);
    }
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
