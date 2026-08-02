export const PREFIXO = 'leticia_estetica_';

export async function getData(key, fallback){
  try{
    const raw = localStorage.getItem(PREFIXO + key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){
    return fallback;
  }
}

export async function setData(key, value){
  try{
    localStorage.setItem(PREFIXO + key, JSON.stringify(value));
  }catch(e){
    console.error('Erro ao salvar', key, e);
  }
}

export function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}