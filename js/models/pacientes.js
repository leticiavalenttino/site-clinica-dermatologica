import { state } from '../state.js';
import { setData, uid } from '../storage.js';
import { notify, confirmar } from '../components/notify.js';

export function calcularIdade(dataNascimento){
  const nascimento = new Date(dataNascimento + 'T00:00:00');
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario = hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if(aindaNaoFezAniversario) idade--;
  return idade;
}

export function podeGerenciarPacientes(){
  return state.currentUser.papel === 'dermatologista' || state.currentUser.papel === 'recepcionista';
}

// cadastros antigos guardavam um único "procedimentoDesejado" em texto
export function procedimentosDesejadosDe(p){
  if(Array.isArray(p.procedimentosDesejados) && p.procedimentosDesejados.length) return p.procedimentosDesejados;
  if(p.procedimentoDesejado) return [p.procedimentoDesejado];
  return [];
}

function montarDados(dados){
  return {
    nome: dados.nome.trim(),
    dataNascimento: dados.dataNascimento,
    celular: dados.celular.trim(),
    endereco: dados.endereco.trim(),
    doencaCronica: dados.doencaCronica.trim(),
    alergias: dados.alergias.trim(),
    jaFezProcedimento: dados.jaFezProcedimento,
    procedimentosAnteriores: dados.jaFezProcedimento ? dados.procedimentosAnteriores.trim() : '',
    procedimentosDesejados: dados.procedimentosDesejados
  };
}

function validar(dados){
  if(!dados.nome.trim()) return 'Informe o nome do paciente.';
  if(!dados.dataNascimento) return 'Informe a data de nascimento.';
  if(!dados.celular.trim()) return 'Informe o número de celular.';
  if(!dados.procedimentosDesejados || dados.procedimentosDesejados.length === 0) return 'Adicione ao menos um procedimento desejado.';
  return null;
}

export async function addPaciente(dados){
  const erro = validar(dados);
  if(erro) return notify(erro, 'error');

  const novo = { id: uid(), ...montarDados(dados), cadastradoPor: state.currentUser.usuario, criadoEm: new Date().toISOString() };
  state.pacientes.push(novo);
  await setData('pacientes', state.pacientes);
  notify('Paciente cadastrado com sucesso.', 'success');
}

export async function updatePaciente(id, dados){
  const erro = validar(dados);
  if(erro) return notify(erro, 'error');

  const idx = state.pacientes.findIndex(p => p.id === id);
  if(idx === -1) return;

  state.pacientes[idx] = { ...state.pacientes[idx], ...montarDados(dados) };
  await setData('pacientes', state.pacientes);
  notify('Paciente atualizado com sucesso.', 'success');
}

export async function removePaciente(id){
  if(state.currentUser.papel !== 'admin'){
    notify('Somente a administração pode remover pacientes.', 'error');
    return false;
  }

  const alvo = state.pacientes.find(p => p.id === id);
  if(!alvo) return false;

  const confirmou = await confirmar(`Remover o paciente "${alvo.nome}"? Essa ação não pode ser desfeita.`);
  if(!confirmou) return false;

  state.pacientes = state.pacientes.filter(p => p.id !== id);
  await setData('pacientes', state.pacientes);
  notify('Paciente removido.', 'success');
  return true;
}
