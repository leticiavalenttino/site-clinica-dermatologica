import { state } from '../state.js';

/* Quem pode o quê, em um lugar só.

   A dermatologista e a ginecologista têm exatamente os mesmos poderes: sempre
   que uma puder fazer algo, a outra também pode. Manter essa conta espalhada
   pelas telas fazia as duas saírem do lugar uma da outra com o tempo. */

export function ehMedica(papel = state.currentUser.papel){
  return papel === 'dermatologista' || papel === 'ginecologista';
}

// a administração e as médicas respondem pela clínica: além de cadastrar,
// podem apagar registros (produtos, pacientes e o histórico de movimentações)
export function podeGerenciarClinica(papel = state.currentUser.papel){
  return papel === 'admin' || ehMedica(papel);
}
