# Dra. Dermato | Controle de Estoque

Sistema web para controle de estoque de uma clínica dermatológica, desenvolvido com **HTML, CSS e JavaScript puro (ES Modules)**. Este é um projeto de estudo, ainda em desenvolvimento, criado para praticar lógica de programação, manipulação de DOM e organização de código em módulos.

🔗 **Acesse o site:** https://leticiavalenttino.github.io/site-clinica-dermatologica/

## Como acessar

O sistema já vem com um usuário administrador padrão criado automaticamente no primeiro acesso:

| Usuário | Senha |
|---------|-------|
| `admin` | `admin` |

> Não é necessário cadastro para entrar, use essas credenciais na tela de login.

## Perfis de usuário

O sistema possui três papéis, com permissões diferentes:

- **Administração (`admin`)**: acesso total. Cadastra produtos, cadastra e remove usuários, e pode remover registros do histórico de movimentações.
- **Dermatologista**: acesso ao catálogo operacional e movimentações. É a única que pode retirar produtos marcados como **especiais**, mediante confirmação com seu RQE.
- **Recepcionista**: acesso ao catálogo operacional e movimentações, podendo registrar entradas e retiradas de produtos simples.

Ao criar um novo usuário (feito pela administração), ele entra com um cadastro provisório e, no primeiro login, precisa completar seu perfil escolhendo nome de usuário, e-mail e senha definitivos.

## Funcionalidades

### Login e perfil
- Login por usuário ou e-mail + senha.
- Primeiro acesso de um novo usuário exige a configuração de usuário, e-mail e senha definitivos.

### Dashboard (Visão geral)
- Alerta visual quando algum produto está com estoque abaixo do mínimo configurado.

### Produtos / Catálogo
- Cadastro de novos produtos com nome, valor, estoque inicial e estoque mínimo.
- Cada produto pode ser do tipo **simples** ou **especial**.
- Listagem de todos os produtos com destaque visual para os que estão com estoque baixo.

### Estoque operacional (visão de recepcionista/dermatologista)
- Registro de **entrada** de produtos (repõe estoque).
- Registro de **saída/uso** de produtos simples.
- Produtos **especiais** só podem ser retirados pela dermatologista, mediante confirmação em modal digitando o RQE cadastrado(funcionalidade que pretendo mudar, por questões de segurança).

### Usuários (somente administração)
- Cadastro de novos usuários, definindo papel (recepcionista, dermatologista ou administração).
- Ao cadastrar uma dermatologista, é obrigatório informar o RQE.
- Remoção de usuários, com regras de segurança:
  - Não é possível remover o usuário que está logado no momento.
  - Não é possível remover o único administrador do sistema.

### Movimentações
- Histórico completo de entradas e saídas, com data/hora, usuário responsável, papel, produto, tipo de movimentação e quantidade.
- A administração pode remover registros do histórico, caso necessário.

## Estrutura do projeto

```
site-clinica-dermatologica/
├── index.html
├── style.css
└── js/
    ├── app.js              # Ponto de entrada, inicialização e roteamento de telas
    ├── state.js            # Estado global da aplicação
    ├── storage.js          # Persistência dos dados (localStorage)
    ├── models/
    │   ├── produtos.js     # Regras de negócio de produtos e estoque
    │   ├── usuarios.js     # Regras de negócio de usuários e login
    │   └── movimentacoes.js# Registro e remoção de movimentações
    └── screens/
        ├── login.js
        ├── configurarPerfil.js
        ├── shell.js         # Menu lateral e navegação entre abas
        ├── dashboard.js
        ├── produtos.js
        ├── estoque.js
        ├── usuarios.js
        ├── movimentacao.js
        └── confirmModal.js  # Modal de confirmação de retirada especial (RQE)
```

## Tecnologias utilizadas

- HTML5
- CSS3 (com ajustes de responsividade para dispositivos móveis)
- JavaScript (ES Modules), sem frameworks ou bibliotecas externas
- `localStorage` do navegador para persistência dos dados

## Como rodar localmente

Como o projeto usa ES Modules, não é possível abrir o `index.html` direto no navegador (`file://`) — é necessário servir os arquivos por um servidor local. Algumas opções simples:

```bash
# Com Python instalado
python -m http.server

# Ou com a extensão "Live Server" do VS Code
```

Depois, acesse `http://localhost:8000` (ou a porta indicada) no navegador.

## Status do projeto

Este é a versão inicial do sistema, contendo o módulo de estoque. Próximas melhorias planejadas incluem novas funcionalidades e correções de eventuais erros identificados no uso.

## Observação sobre os dados

Os dados são salvos no `localStorage` do navegador de quem acessa. Isso significa que cada pessoa que testar o sistema terá seus próprios dados locais, e limpar o cache/dados do navegador apaga o progresso.
