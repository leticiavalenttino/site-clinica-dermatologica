# Dra. Dermato | Controle de Estoque
-Primeira atualização

Sistema web para controle de estoque de uma clínica dermatológica, desenvolvido com **HTML, CSS e JavaScript**. Este é um projeto de estudo, ainda em desenvolvimento, criado para praticar lógica de programação, manipulação de DOM e organização de código em módulos.

🔗 **Acesse o site:** https://leticiavalenttino.github.io/site-clinica-dermatologica/

## Como acessar

O sistema já vem com um usuário administrador padrão criado automaticamente no primeiro acesso:

| Usuário | Senha |
|---------|-------|
| `admin` | `admin` |

> Não é necessário cadastro para entrar, use essas credenciais na tela de login.

## Perfis de usuário

O sistema possui três papéis, com permissões diferentes:

- **Administração (`admin`)**: acesso quase total. Cadastra produtos, cadastra e remove usuários, e pode remover registros do histórico de movimentações.
- **Dermatologista**: acesso ao catálogo operacional e movimentações. É a única que pode retirar produtos marcados como **especiais**, mediante confirmação com seu RQE.
- **Recepcionista**: acesso ao catálogo operacional e movimentações, podendo registrar entradas e retiradas de produtos simples.

Ao criar um novo usuário (feito pela administração), ele entra com um cadastro provisório e, no primeiro login, precisa completar seu perfil escolhendo nome de usuário, e-mail e senha definitivos.

## Funcionalidades

### Login e perfil
- Login por usuário ou e-mail + senha.
- Primeiro acesso de um novo usuário exige a configuração de usuário, e-mail e senha definitivos.


###Mudar Usuário e Senha(atualização)
- Agora, adicionei a opção do user ter a opção de mudar seu nome de usuário no site
- Além disso, podem também mudar sua senha, ja que o site ainda usa um localStorage, náo tenho a possibilidade de mandar um e-mail para os users com um link para mudar suas senhas. Ao invés disso, o usuário coloca a sua senha antiga, a nova, e novamente a nova. Todas as 3 senhas tem que estar de acordo com o exigido, senão a mudança não irá funcionar.

### Dashboard (Visão geral)
- Alerta visual quando algum produto está com estoque abaixo do mínimo configurado.
- (atualização) Agora o dashboard conta com uma visão geral de todos os produtos cadastrados, a descrição deles, o estoque e o limite deles. Dependendo da relação entre limite e estoque, a cor dos "quadrados" muda. Primeiramente aparecem os vermelhos(baixo estoque), depois amarelos(limite=estoque) e por fim os verdes(estoque>limite)

### Produtos / Catálogo
- Cadastro de novos produtos com nome, descrição, valor, estoque inicial e estoque mínimo.
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
Nesta atualização, trabalhei em algumas mudanças que deixam o site mais completo, e melhor de se navegar. Esta atualização foi mais focada na versão para browsers/computadores, podem haver alguns erros se acessado pelo celular.
- Nesta versão, a barra lateral pode ser diminuída, utilizei uma animação que pesquisei para deixar essa mudança mais fluida.
- Produtos agora podem ser excluídos, somente pelo admin.
- O histórico de movimentação também foi atualizado.
- Adicionei a opção de "desocultar" a senha que você está escrevendo(aquele famoso olhinho).

## Observação sobre os dados

Os dados são salvos no `localStorage` do navegador de quem acessa. Isso significa que cada pessoa que testar o sistema terá seus próprios dados locais, e limpar o cache/dados do navegador apaga o progresso.
