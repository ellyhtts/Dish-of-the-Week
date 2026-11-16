# 🍳 Prato da Semana

Planejador de cardápio semanal com CRUD completo. Monte o café da manhã, o almoço e o lanche de segunda a domingo e busque receitas prontas, com nome e ingredientes traduzidos para o português.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias e ferramentas](#tecnologias-e-ferramentas)
- [APIs utilizadas](#apis-utilizadas)
- [Como funciona](#como-funciona)
- [Rotas da aplicação](#rotas-da-aplicação)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como executar](#como-executar)
- [Limitações conhecidas](#limitações-conhecidas)

## Funcionalidades

- Grade semanal com 7 dias e 3 refeições por dia (café da manhã, almoço e lanche).
- **CRUD completo:** adicionar, listar, editar e excluir pratos do cardápio.
- Destaque do dia atual e barra de progresso com o total de refeições já planejadas (de 21).
- Busca de receitas por nome ou ingrediente, em português.
- Filtro por categorias (café da manhã, frango, carne, massas, vegetariano, sobremesas e outras).
- Botão "Surpreenda-me" para sugerir uma receita aleatória.
- Ao adicionar uma receita, o formulário já abre preenchido com nome, ingredientes e foto.
- Layout responsivo, com foco visível no teclado e respeito à preferência de menos animação.

## Tecnologias e ferramentas

| Ferramenta | Uso no projeto |
| --- | --- |
| [Node.js](https://nodejs.org) 18+ | Ambiente de execução do servidor (usa o `fetch` nativo) |
| [Express](https://expressjs.com) | Servidor HTTP, rotas da API e arquivos estáticos |
| JavaScript (ES2022) | Lógica do servidor e do front-end, sem frameworks |
| HTML5 e CSS3 | Estrutura e visual da página (CSS Grid, variáveis CSS, `<dialog>`) |
| Arquivo JSON | Persistência dos pratos em `data/cardapio.json` |
| [Google Fonts](https://fonts.google.com) | Fontes Bricolage Grotesque e DM Sans |
| [VS Code](https://code.visualstudio.com) | Editor utilizado no desenvolvimento |
| Git e GitHub | Controle de versão e hospedagem do código |

## APIs utilizadas

O projeto consome duas APIs externas, gratuitas e sem necessidade de cadastro.

### 1. TheMealDB (receitas)

Banco de dados aberto de receitas de várias culinárias, com ingredientes, medidas, instruções e foto.

- Site e documentação: https://www.themealdb.com/api.php
- Guia de endpoints: https://themealdb.com/documentation
- URL base: `https://www.themealdb.com/api/json/v1/1/`
- Autenticação: chave de teste `1`, indicada para desenvolvimento e uso educacional.

Endpoints utilizados:

| Endpoint | Função no projeto |
| --- | --- |
| `search.php?s={termo}` | Busca de receitas por nome |
| `filter.php?c={categoria}` | Lista de receitas por categoria |
| `lookup.php?i={id}` | Detalhes completos de uma receita (ingredientes) |
| `random.php` | Receita aleatória |

### 2. MyMemory (tradução)

API de tradução usada para deixar a busca e as receitas em português.

- Site: https://mymemory.translated.net
- Documentação: https://mymemory.translated.net/doc/spec.php
- Endpoint: `https://api.mymemory.translated.net/get?q={texto}&langpair={origem}|{destino}`
- Autenticação: não é necessária.

Usos no projeto:

| Direção | Para que serve |
| --- | --- |
| `pt` → `en` | Traduz o termo digitado antes de consultar o TheMealDB |
| `en` → `pt` | Traduz o nome dos pratos e a lista de ingredientes |

## Como funciona

```
Navegador  ──►  Servidor Express  ──►  MyMemory   (tradução)
   ▲                 │          └──►  TheMealDB   (receitas)
   │                 ▼
   └──────────  data/cardapio.json  (CRUD)
```

1. A página nunca chama as APIs externas diretamente: todas as chamadas passam pelo servidor, o que evita problemas de CORS e concentra as regras em um só lugar.
2. Na busca, o termo em português é traduzido para inglês, consultado no TheMealDB, e os nomes dos resultados voltam traduzidos.
3. Ao adicionar uma receita, os ingredientes são traduzidos e o formulário abre preenchido para você escolher o dia e a refeição.
4. Ao salvar, o servidor valida os dados e grava o prato em `data/cardapio.json`.
5. Se a tradução falhar, o sistema continua funcionando e exibe o texto original em inglês.

## Rotas da aplicação

### CRUD do cardápio

| Método | Rota | Ação |
| --- | --- | --- |
| `GET` | `/api/cardapio` | Lista todos os pratos |
| `POST` | `/api/cardapio` | Cria um prato |
| `PUT` | `/api/cardapio/:id` | Atualiza um prato |
| `DELETE` | `/api/cardapio/:id` | Remove um prato |

Exemplo de corpo para `POST` e `PUT`:

```json
{
  "nome": "Omelete com tomate",
  "dia": "seg",
  "refeicao": "cafe",
  "detalhes": "2 ovos, 1 tomate, sal e orégano",
  "imagem": ""
}
```

Valores aceitos: `dia` = `seg`, `ter`, `qua`, `qui`, `sex`, `sab`, `dom`; `refeicao` = `cafe`, `almoco`, `lanche`.

### Rotas que usam as APIs externas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/receitas?q=ovo` | Busca por nome ou ingrediente (em português) |
| `GET` | `/api/receitas?categoria=Breakfast` | Receitas de uma categoria |
| `GET` | `/api/receitas/aleatoria` | Uma receita aleatória |
| `GET` | `/api/traduzir?texto=...&de=en&para=pt` | Tradução de um texto |

## Estrutura de pastas

```
prato-da-semana/
├── data/
│   └── cardapio.json     # criado automaticamente ao salvar o primeiro prato
├── public/
│   ├── index.html        # estrutura da página
│   ├── style.css         # visual em branco, laranja e amarelo
│   └── app.js            # grade semanal, formulário e busca de receitas
├── server.js             # servidor, CRUD e integração com as APIs
├── package.json
└── README.md
```

## Como executar

Pré-requisito: [Node.js](https://nodejs.org) 18 ou superior.

```bash
# 1. clone o repositório
git clone <url-do-repositorio>
cd prato-da-semana

# 2. instale as dependências
npm install

# 3. inicie o servidor
npm start
```

Acesse http://localhost:3000 no navegador.

Para reiniciar automaticamente a cada alteração durante o desenvolvimento, use `npm run dev`.

## Limitações conhecidas

- **MyMemory:** o uso anônimo tem limite diário de 5.000 caracteres e cada requisição aceita até 500 bytes de texto. Se o limite for atingido, o sistema exibe os textos em inglês.
- **TheMealDB:** a chave `1` é pública e destinada a testes e estudo. Para publicar um app, a própria documentação pede a chave de apoiador.
- **Persistência:** os dados ficam em um arquivo JSON local, o que serve para estudo e uso pessoal, mas não para muitos usuários ao mesmo tempo.
- O catálogo do TheMealDB é em inglês e internacional, então alguns pratos podem não ser típicos do Brasil.
