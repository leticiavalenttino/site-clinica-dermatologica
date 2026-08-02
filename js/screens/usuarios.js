import { state } from '../state.js';
import { addUsuario, removeUsuario } from '../models/usuarios.js';

export function renderUsuarios(){
  return `
    <h1>Usuários</h1>
    <div class="panel">
      <h3>Equipe cadastrada</h3>
      ${state.usuarios.length === 0 ? '<p>Nenhum usuário cadastrado.</p>' : `
        <table>
          <thead><tr><th>Usuário</th><th>E-mail</th><th>Papel</th><th>RQE</th><th></th></tr></thead>
          <tbody>
            ${state.usuarios.map(u => `
              <tr>
                <td>${u.usuario}</td>
                <td>${u.email || '<em>pendente</em>'}</td>
                <td>${u.papel}</td>
                <td>${u.RQE || '—'}</td>
                <td><button class="btn btn-danger" data-remove-user="${u.id}">Remover</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    </div>
    <div class="panel">
      <h3>Novo usuário</h3>
      <form id="form-usuario">
        <div class="field"><label>Usuário</label><input id="nu-usuario" type="text" required></div>
        <div class="field"><label>Senha</label><input id="nu-senha" type="text" required></div>
        <div class="field">
          <label>Papel</label>
          <select id="nu-papel">
            <option value="recepcionista">Recepcionista</option>
            <option value="dermatologista">Dermatologista</option>
            <option value="admin">Administração</option>
          </select>
        </div>
        <div class="field" id="nu-RQE-field" style="display:none;">
          <label>RQE</label>
          <input id="nu-RQE" type="text">
        </div>
        <button type="submit" class="btn btn-primary">Cadastrar usuário</button>
      </form>
    </div>
  `;
}

export function wireUsuarios(render){
  const papelSel = document.getElementById('nu-papel');
  const RQEField = document.getElementById('nu-RQE-field');

  papelSel.addEventListener('change', ()=>{
    RQEField.style.display = papelSel.value === 'dermatologista' ? 'block' : 'none';
  });

  document.getElementById('form-usuario').addEventListener('submit', async (e)=>{
    e.preventDefault();
    await addUsuario(
      document.getElementById('nu-usuario').value,
      document.getElementById('nu-senha').value,
      papelSel.value,
      document.getElementById('nu-RQE').value
    );
    render();
  });

  document.querySelectorAll('[data-remove-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeUsuario(btn.dataset.removeUser).then(render);
    });
  });
}