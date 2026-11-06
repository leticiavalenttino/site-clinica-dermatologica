import { state } from '../state.js';
import { attemptLogin, solicitarRedefinicaoSenha } from '../models/usuarios.js';
import { passwordField, wirePasswordToggle } from '../components/passwordField.js';

function renderEsqueciSenha(){
  if(state.resetLinkGerado){
    return `
      <h2>Link de redefinição gerado</h2>
      <p style="color:var(--muted);font-size:0.9rem;">
        Este sistema ainda não tem a função de envio de emails, este link seria enviado para <strong>${state.resetLinkGerado.email}</strong>. Por enquanto, copie e abra o link abaixo:
      </p>
      <p style="word-break:break-all;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:0.85rem;">
        <a href="${state.resetLinkGerado.link}">${state.resetLinkGerado.link}</a>
      </p>
      <button type="button" class="btn" id="btn-voltar-login">Voltar para o login</button>
    `;
  }
  return `
    <h2>Esqueci minha senha</h2>
    <p style="color:var(--muted);font-size:0.9rem;margin-top:-8px;">
      Informe o e-mail cadastrado para receber o link de redefinição.
    </p>
    <form id="form-esqueci-senha">
      <div class="field">
        <label>E-mail</label>
        <input id="es-email" type="email" required>
      </div>
      <button type="submit" class="btn btn-primary">Enviar link de redefinição</button>
      <button type="button" class="btn" id="btn-voltar-login">Voltar para o login</button>
    </form>
  `;
}

export function renderLogin(){
  return `
    <div class="login-split">
      <div class="login-brand">
        <div class="login-brand-content">
          <span class="login-brand-eyebrow">Dermatologia e Ginecologia</span>
          <div>
            <h1 class="login-brand-title">CITODERME</h1>
            <p class="login-brand-subtitle">Controle de estoque, pacientes e movimentações da clínica em um só lugar.</p>
          </div>
          <div class="login-brand-footer">
            <span class="login-brand-footer-line"></span>
            <span>Acesso restrito à equipe</span>
          </div>
        </div>
      </div>
      <div class="login-form-panel">
        <div class="login-card">
          ${state.telaEsqueciSenha ? renderEsqueciSenha() : `
            <h2 class="brand-title">Entrar</h2>
            ${state.loginError ? `<p style="color:var(--alert)">${state.loginError}</p>` : ''}
            <form id="login-form">
              <div class="field">
                <label>Usuário ou E-mail</label>
                <input id="f-usuario" type="text" autocomplete="username" required>
              </div>
              ${passwordField('f-senha', 'Senha')}
              <button type="submit" class="btn btn-primary">Entrar</button>
            </form>
            <button type="button" id="btn-esqueci-senha" class="link-btn">Esqueci minha senha</button>
          `}
        </div>
      </div>
    </div>
  `;
}

export function wireLogin(render){
  if(state.telaEsqueciSenha){
    const btnVoltar = document.getElementById('btn-voltar-login');
    if(btnVoltar){
      btnVoltar.addEventListener('click', ()=>{
        state.telaEsqueciSenha = false;
        state.resetLinkGerado = null;
        render();
      });
    }
    const formEsqueciSenha = document.getElementById('form-esqueci-senha');
    if(formEsqueciSenha){
      formEsqueciSenha.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const resultado = await solicitarRedefinicaoSenha(document.getElementById('es-email').value);
        if(resultado){
          state.resetLinkGerado = resultado;
          render();
        }
      });
    }
    return;
  }

  document.getElementById('login-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    attemptLogin(document.getElementById('f-usuario').value, document.getElementById('f-senha').value);
    render();
  });
  document.getElementById('btn-esqueci-senha').addEventListener('click', ()=>{
    state.telaEsqueciSenha = true;
    render();
  });
  wirePasswordToggle('f-senha');
}