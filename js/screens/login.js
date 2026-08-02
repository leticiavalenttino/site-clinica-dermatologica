import { state } from '../state.js';
import { attemptLogin } from '../models/usuarios.js';

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
        <h2>Dra. Dermato | Controle de Estoque</h2>
        ${state.loginError ? `<p style="color:var(--alert)">${state.loginError}</p>` : ''}
        <form id="login-form">
          <div class="field">
            <label>Usuário ou E-mail</label>
            <input id="f-usuario" type="text" autocomplete="username" required>
          </div>
          <div class="field">
            <label>Senha</label>
            <input id="f-senha" type="password" required>
          </div>
          <button type="submit" class="btn btn-primary">Entrar</button>
        </form>
      </div>
    </div>
  `;
}

export function wireLogin(render){
  document.getElementById('login-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    attemptLogin(document.getElementById('f-usuario').value, document.getElementById('f-senha').value);
    render();
  });
}