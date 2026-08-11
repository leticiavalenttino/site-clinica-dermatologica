import { state } from '../state.js';
import { redefinirSenhaComToken } from '../models/usuarios.js';
import { passwordField, wirePasswordToggle } from '../components/passwordField.js';

export function renderRedefinirSenha(){
  return `
    <div class="login-wrap">
      <div class="login-card">
        <h2>Redefinir senha</h2>
        <p style="color:var(--muted);font-size:0.9rem;margin-top:-16px;margin-bottom:20px;">
          Digite a nova senha duas vezes para confirmar.
        </p>
        <form id="form-redefinir-senha">
          ${passwordField('rs-nova', 'Nova senha')}
          ${passwordField('rs-confirmar', 'Confirmar nova senha')}
          <button type="submit" class="btn btn-primary">Redefinir senha</button>
        </form>
      </div>
    </div>
  `;
}

export function wireRedefinirSenha(render){
  wirePasswordToggle('rs-nova');
  wirePasswordToggle('rs-confirmar');

  document.getElementById('form-redefinir-senha').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const ok = await redefinirSenhaComToken(
      state.resetTokenAtivo,
      document.getElementById('rs-nova').value,
      document.getElementById('rs-confirmar').value
    );
    if(ok){
      alert('Senha redefinida com sucesso. Faça login com a nova senha.');
      state.resetTokenAtivo = null;
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', url);
      render();
    }
  });
}
