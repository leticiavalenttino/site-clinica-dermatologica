export function passwordField(id, label){
  return `
    <div class="field">
      <label>${label}</label>
      <div class="password-wrap">
        <input id="${id}" type="password" required>
        <button type="button" id="toggle-${id}" class="password-toggle" aria-label="Mostrar senha" tabindex="-1">
          <svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
      </div>
    </div>
  `;
}

export function wirePasswordToggle(id){
  const input = document.getElementById(id);
  const btn = document.getElementById(`toggle-${id}`);
  btn.addEventListener('click', ()=>{
    const mostrar = input.type === 'password';
    input.type = mostrar ? 'text' : 'password';
    btn.classList.toggle('is-visible', mostrar);
    btn.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  });
}
