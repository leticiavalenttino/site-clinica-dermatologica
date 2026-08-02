import { state } from '../state.js';
import { completarPerfil } from '../models/usuarios.js';

export function renderConfigurarPerfil(){
  return `
    <div class="login-wrap">
      <div class="login-card">
        <h2>Complete seu cadastro</h2>
        <p style="color:var(--muted);font-size:0.9rem;margin-top:-16px;margin-bottom:20px;">
          Esse é seu primeiro acesso. Escolha seu usuário, e-mail e senha definitivos.
        </p>
        <form id="form-configurar-perfil">
          <div class="field"><label>Nome de usuário</label><input id="cp-usuario" type="text" value="${state.currentUser.usuario}" required></div>
          <div class="field"><label>E-mail</label><input id="cp-email" type="email" required></div>
          <div class="field"><label>Nova senha</label><input id="cp-senha" type="password" required></div>
          <button type="submit" class="btn btn-primary">Salvar e entrar</button>
        </form>
      </div>
    </div>
  `;
}

export function wireConfigurarPerfil(render){
  document.getElementById('form-configurar-perfil').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await completarPerfil({
      usuario: document.getElementById('cp-usuario').value,
      email: document.getElementById('cp-email').value,
      senha: document.getElementById('cp-senha').value
    });
    render();
  });
}