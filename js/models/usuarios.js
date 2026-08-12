import { state } from '../state.js';
import { setData, uid } from '../storage.js';
import { notify, confirmar } from '../components/notify.js';

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
  setData('sessaoUsuarioId', u.id);
}

export async function addUsuario(usuario, senha, papel, RQE){
  if(!usuario.trim() || !senha.trim()){
    notify('Preencha usuário e senha.', 'error');
    return;
  }
  if(state.usuarios.some(u => u.usuario.toLowerCase() === usuario.trim().toLowerCase())){
    notify('Já existe um usuário com esse nome.', 'error');
    return;
  }
  if(papel === 'dermatologista' && !RQE.trim()){
    notify('Informe o RQE da dermatologista.', 'error');
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
  notify('Usuário cadastrado com sucesso.', 'success');
}

export async function removeUsuario(id){
  const alvo = state.usuarios.find(u => u.id === id);
  if(!alvo) return;

  if(alvo.id === state.currentUser.id){
    notify('Você não pode remover o usuário com o qual está logada agora.', 'error');
    return;
  }

  const totalAdmins = state.usuarios.filter(u => u.papel === 'admin').length;
  if(alvo.papel === 'admin' && totalAdmins <= 1){
    notify('Não é possível remover o único administrador do sistema.', 'error');
    return;
  }

  const confirmou = await confirmar(`Remover o usuário "${alvo.usuario}"? Essa ação não pode ser desfeita.`);
  if(!confirmou) return;

  state.usuarios = state.usuarios.filter(u => u.id !== id);
  await setData('usuarios', state.usuarios);
  notify('Usuário removido.', 'success');
}

export async function atualizarNomeUsuario(novoNome){
  const nome = novoNome.trim();
  if(!nome) return notify('Informe um nome de usuário.', 'error');

  const jaExiste = state.usuarios.some(u => u.id !== state.currentUser.id && u.usuario.toLowerCase() === nome.toLowerCase());
  if(jaExiste) return notify('Já existe um usuário com esse nome.', 'error');

  const idx = state.usuarios.findIndex(u => u.id === state.currentUser.id);
  state.usuarios[idx] = { ...state.usuarios[idx], usuario: nome };
  state.currentUser = state.usuarios[idx];
  await setData('usuarios', state.usuarios);
  notify('Nome atualizado com sucesso.', 'success');
}

export async function alterarSenha(senhaAtual, novaSenha, confirmarSenha){
  const idx = state.usuarios.findIndex(u => u.id === state.currentUser.id);
  const u = state.usuarios[idx];

  if(u.senha !== senhaAtual) return notify('Senha atual incorreta.', 'error');
  if(!novaSenha.trim()) return notify('Informe a nova senha.', 'error');
  if(novaSenha !== confirmarSenha) return notify('As senhas digitadas não são iguais.', 'error');

  state.usuarios[idx] = { ...u, senha: novaSenha };
  state.currentUser = state.usuarios[idx];
  await setData('usuarios', state.usuarios);
  notify('Senha alterada com sucesso.', 'success');
}

export async function solicitarRedefinicaoSenha(email){
  const alvo = state.usuarios.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
  if(!alvo){
    notify('Não encontramos nenhuma conta cadastrada com esse e-mail.', 'error');
    return null;
  }
  const token = uid() + uid();
  state.resetTokens = state.resetTokens.filter(t => t.usuarioId !== alvo.id);
  state.resetTokens.push({ token, usuarioId: alvo.id, criadoEm: Date.now() });
  await setData('resetTokens', state.resetTokens);
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('reset', token);
  return { link: url.toString(), email: alvo.email };
}

export async function redefinirSenhaComToken(token, novaSenha, confirmarSenha){
  const registro = state.resetTokens.find(t => t.token === token);
  if(!registro){
    notify('Link de redefinição inválido ou expirado.', 'error');
    return false;
  }
  if(!novaSenha.trim()){
    notify('Informe a nova senha.', 'error');
    return false;
  }
  if(novaSenha !== confirmarSenha){
    notify('As senhas digitadas não são iguais.', 'error');
    return false;
  }
  const idx = state.usuarios.findIndex(u => u.id === registro.usuarioId);
  if(idx === -1){
    notify('Usuário não encontrado.', 'error');
    return false;
  }
  state.usuarios[idx] = { ...state.usuarios[idx], senha: novaSenha };
  state.resetTokens = state.resetTokens.filter(t => t.token !== token);
  await setData('usuarios', state.usuarios);
  await setData('resetTokens', state.resetTokens);
  return true;
}

export async function completarPerfil(dados){
  if(!dados.usuario.trim() || !dados.email.trim() || !dados.senha.trim()){
    notify('Preencha todos os campos.', 'error');
    return;
  }
  if(!dados.email.includes('@') || !dados.email.includes('.')){
    notify('Informe um e-mail válido.', 'error');
    return;
  }
  const usuarioExiste = state.usuarios.some(u => u.id !== state.currentUser.id && u.usuario.toLowerCase() === dados.usuario.trim().toLowerCase());
  if(usuarioExiste){
    notify('Já existe um usuário com esse nome.', 'error');
    return;
  }
  const emailExiste = state.usuarios.some(u => u.id !== state.currentUser.id && u.email && u.email.toLowerCase() === dados.email.trim().toLowerCase());
  if(emailExiste){
    notify('Já existe uma conta com esse e-mail.', 'error');
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
