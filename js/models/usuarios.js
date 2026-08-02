import { state } from '../state.js';
import { setData, uid } from '../storage.js';

export function attemptLogin(identificador, senha){
  const ident = identificador.trim().toLowerCase();
  const u = state.usuarios.find(x =>
    (x.usuario.toLowerCase() === ident || (x.email && x.email.toLowerCase() === ident))
    && x.senha === senha
  );
  if(!u){
    state.loginError = 'Usuário/e-mail ou senha incorretos.';
    return;
  }
  state.loginError = '';
  state.currentUser = u;
  state.activeTab = 'dashboard';
}

export async function addUsuario(usuario, senha, papel, RQE){
  if(!usuario.trim() || !senha.trim()){
    alert('Preencha usuário e senha.');
    return;
  }
  if(state.usuarios.some(u => u.usuario.toLowerCase() === usuario.trim().toLowerCase())){
    alert('Já existe um usuário com esse nome.');
    return;
  }
  if(papel === 'dermatologista' && !RQE.trim()){
    alert('Informe o RQE da dermatologista.');
    return;
  }
  const novo = {
    id: uid(),
    usuario: usuario.trim(),
    senha,
    papel,
    RQE: papel === 'dermatologista' ? RQE.trim() : undefined,
    email: '',
    precisaConfigurar: true
  };
  state.usuarios.push(novo);
  await setData('usuarios', state.usuarios);
}

export async function removeUsuario(id){
  const alvo = state.usuarios.find(u => u.id === id);
  if(!alvo) return;

  if(alvo.id === state.currentUser.id){
    alert('Você não pode remover o usuário com o qual está logada agora.');
    return;
  }

  const totalAdmins = state.usuarios.filter(u => u.papel === 'admin').length;
  if(alvo.papel === 'admin' && totalAdmins <= 1){
    alert('Não é possível remover o único administrador do sistema.');
    return;
  }

  const confirmou = confirm(`Remover o usuário "${alvo.usuario}"? Essa ação não pode ser desfeita.`);
  if(!confirmou) return;

  state.usuarios = state.usuarios.filter(u => u.id !== id);
  await setData('usuarios', state.usuarios);
}

export async function completarPerfil(dados){
  if(!dados.usuario.trim() || !dados.email.trim() || !dados.senha.trim()){
    alert('Preencha todos os campos.');
    return;
  }
  if(!dados.email.includes('@') || !dados.email.includes('.')){
    alert('Informe um e-mail válido.');
    return;
  }
  const usuarioExiste = state.usuarios.some(u => u.id !== state.currentUser.id && u.usuario.toLowerCase() === dados.usuario.trim().toLowerCase());
  if(usuarioExiste){
    alert('Já existe um usuário com esse nome.');
    return;
  }
  const emailExiste = state.usuarios.some(u => u.id !== state.currentUser.id && u.email && u.email.toLowerCase() === dados.email.trim().toLowerCase());
  if(emailExiste){
    alert('Já existe uma conta com esse e-mail.');
    return;
  }

  const idx = state.usuarios.findIndex(u => u.id === state.currentUser.id);
  state.usuarios[idx] = {
    ...state.usuarios[idx],
    usuario: dados.usuario.trim(),
    email: dados.email.trim(),
    senha: dados.senha,
    precisaConfigurar: false
  };
  state.currentUser = state.usuarios[idx];
  await setData('usuarios', state.usuarios);
}