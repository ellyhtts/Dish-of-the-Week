# Prato da Semana
 
Planejador de cardápio semanal: café da manhã, almoço e lanche de segunda a domingo.
 
## Como rodar
 
```bash
npm install
npm start
```
 
Abra http://localhost:3000 (precisa do Node 18 ou mais novo).
 
## O que tem dentro
 
**CRUD do cardápio** (salvo em `data/cardapio.json`, criado automaticamente)
 
| Ação   | Rota                       |
| ------ | -------------------------- |
| Create | `POST /api/cardapio`       |
| Read   | `GET /api/cardapio`        |
| Update | `PUT /api/cardapio/:id`    |
| Delete | `DELETE /api/cardapio/:id` |
 
**Duas APIs externas** (gratuitas, sem chave), consumidas pelo servidor:
 
1. **TheMealDB**: busca de receitas por nome, ingrediente ou categoria, com fotos.
2. **MyMemory**: tradução. A busca em português é traduzida para inglês antes de ir ao TheMealDB, e os nomes e ingredientes das receitas voltam em português.
## Estrutura
 
```
server.js          API, CRUD e integração com as duas APIs
public/index.html  página
public/style.css   visual em branco, laranja e amarelo
public/app.js      grade semanal, formulário e busca de receitas
data/cardapio.json criado ao salvar o primeiro prato
```
 