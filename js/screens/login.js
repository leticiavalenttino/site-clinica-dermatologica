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
    <div class="bg-lines" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path class="line line1" d="M-100,60  C 200,-40  400,160 700,60  C 1000,-40  1200,110 1600,10" />
        <path class="line line2" d="M-100,180 C 250,130  450,280 750,180 C 1050,80   1250,230 1600,160" />
        <path class="line line3" d="M-100,300 C 200,200  400,400 700,300 C 1000,200  1200,350 1600,250" />
        <path class="line line4" d="M-100,420 C 220,380  420,480 720,420 C 1020,360  1220,470 1600,410" />
        <path class="line line5" d="M-100,540 C 250,490  450,600 750,540 C 1050,440  1250,590 1600,510" />
        <path class="line line6" d="M-100,660 C 300,600  500,750 800,650 C 1100,550  1300,700 1600,650" />
        <path class="line line7" d="M-100,800 C 260,750  480,850 780,800 C 1080,730  1280,830 1600,780" />
      </svg>
    </div>
    <div class="login-wrap">
      <div class="login-card">
        ${state.telaEsqueciSenha ? renderEsqueciSenha() : `
          <h2>Dra. Dermato | Controle de Estoque</h2>
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