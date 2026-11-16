const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ARQUIVO = path.join(__dirname, 'data', 'cardapio.json');

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const REFEICOES = ['cafe', 'almoco', 'lanche'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function lerItens() {
  try {
    return JSON.parse(await fs.readFile(ARQUIVO, 'utf8'));
  } catch {
    return [];
  }
}

async function salvarItens(itens) {
  await fs.mkdir(path.dirname(ARQUIVO), { recursive: true });
  await fs.writeFile(ARQUIVO, JSON.stringify(itens, null, 2), 'utf8');
}

function validar(corpo) {
  const nome = String(corpo.nome || '').trim();
  const detalhes = String(corpo.detalhes || '').trim();
  const imagem = String(corpo.imagem || '').trim();

  if (!nome) return { erro: 'Informe o nome da refeição.' };
  if (nome.length > 80) return { erro: 'O nome pode ter no máximo 80 caracteres.' };
  if (!DIAS.includes(corpo.dia)) return { erro: 'Escolha um dia da semana válido.' };
  if (!REFEICOES.includes(corpo.refeicao)) return { erro: 'Escolha café da manhã, almoço ou lanche.' };
  if (detalhes.length > 500) return { erro: 'Os detalhes podem ter no máximo 500 caracteres.' };
  if (imagem && !/^https?:\/\//i.test(imagem)) return { erro: 'O link da foto precisa começar com http:// ou https://.' };

  return { item: { nome, dia: corpo.dia, refeicao: corpo.refeicao, detalhes, imagem } };
}

app.get('/api/cardapio', async (req, res) => {
  res.json(await lerItens());
});

app.post('/api/cardapio', async (req, res) => {
  const { erro, item } = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  const itens = await lerItens();
  const novo = { id: crypto.randomUUID(), ...item, criadoEm: new Date().toISOString() };
  itens.push(novo);
  await salvarItens(itens);
  res.status(201).json(novo);
});

app.put('/api/cardapio/:id', async (req, res) => {
  const { erro, item } = validar(req.body);
  if (erro) return res.status(400).json({ erro });

  const itens = await lerItens();
  const posicao = itens.findIndex((i) => i.id === req.params.id);
  if (posicao === -1) return res.status(404).json({ erro: 'Refeição não encontrada.' });

  itens[posicao] = { ...itens[posicao], ...item, atualizadoEm: new Date().toISOString() };
  await salvarItens(itens);
  res.json(itens[posicao]);
});

app.delete('/api/cardapio/:id', async (req, res) => {
  const itens = await lerItens();
  const restantes = itens.filter((i) => i.id !== req.params.id);
  if (restantes.length === itens.length) return res.status(404).json({ erro: 'Refeição não encontrada.' });

  await salvarItens(restantes);
  res.status(204).end();
});

const cacheTraducao = new Map();

async function traduzir(texto, de = 'en', para = 'pt') {
  const t = String(texto || '').trim().slice(0, 480);
  if (!t || de === para) return t;

  const chave = `${de}|${para}|${t}`;
  if (cacheTraducao.has(chave)) return cacheTraducao.get(chave);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${de}|${para}`;
    const resposta = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const dados = await resposta.json();
    const saida = dados?.responseData?.translatedText;

    if (Number(dados.responseStatus) === 200 && saida && !/MYMEMORY WARNING/i.test(saida)) {
      cacheTraducao.set(chave, saida);
      return saida;
    }
  } catch {

  }
  return t;
}

app.get('/api/traduzir', async (req, res) => {
  const idiomas = ['en', 'pt'];
  const de = idiomas.includes(req.query.de) ? req.query.de : 'en';
  const para = idiomas.includes(req.query.para) ? req.query.para : 'pt';
  const traducao = await traduzir(req.query.texto, de, para);
  res.json({ traducao });
});

const MEALDB = 'https://www.themealdb.com/api/json/v1/1';

async function buscarJSON(url) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!resposta.ok) throw new Error('Falha ao consultar o TheMealDB.');
  return resposta.json();
}

function normalizar(m) {
  const ingredientes = [];
  for (let i = 1; i <= 20; i++) {
    const ingrediente = (m[`strIngredient${i}`] || '').trim();
    const medida = (m[`strMeasure${i}`] || '').trim();
    if (ingrediente) ingredientes.push(`${medida} ${ingrediente}`.trim());
  }
  return {
    id: m.idMeal,
    nome: m.strMeal,
    categoria: m.strCategory,
    origem: m.strArea,
    imagem: m.strMealThumb,
    ingredientes,
  };
}

async function receitasPorBusca(termo) {
  const dados = await buscarJSON(`${MEALDB}/search.php?s=${encodeURIComponent(termo)}`);
  return (dados.meals || []).map(normalizar);
}

async function receitasPorCategoria(categoria) {
  const dados = await buscarJSON(`${MEALDB}/filter.php?c=${encodeURIComponent(categoria)}`);
  const basicas = (dados.meals || []).slice(0, 8);
  const completas = await Promise.all(
    basicas.map(async (b) => {
      const detalhe = await buscarJSON(`${MEALDB}/lookup.php?i=${b.idMeal}`);
      return detalhe.meals ? normalizar(detalhe.meals[0]) : null;
    })
  );
  return completas.filter(Boolean);
}

app.get('/api/receitas', async (req, res) => {
  try {
    let lista = [];

    if (req.query.q) {
      const original = String(req.query.q).trim();
      
      const emIngles = await traduzir(original, 'pt', 'en');
      lista = await receitasPorBusca(emIngles);
      if (!lista.length && emIngles.toLowerCase() !== original.toLowerCase()) {
        lista = await receitasPorBusca(original);
      }
    } else if (req.query.categoria) {
      lista = await receitasPorCategoria(String(req.query.categoria));
    }

    lista = lista.slice(0, 8);
    await Promise.all(
      lista.map(async (r) => {
        r.nomeOriginal = r.nome;
        r.nome = await traduzir(r.nome, 'en', 'pt');
      })
    );

    res.json(lista);
  } catch (e) {
    res.status(502).json({ erro: 'Não foi possível buscar receitas agora. Tente novamente em instantes.' });
  }
});

app.get('/api/receitas/aleatoria', async (req, res) => {
  try {
    const dados = await buscarJSON(`${MEALDB}/random.php`);
    const receita = normalizar(dados.meals[0]);
    receita.nomeOriginal = receita.nome;
    receita.nome = await traduzir(receita.nome, 'en', 'pt');
    res.json([receita]);
  } catch (e) {
    res.status(502).json({ erro: 'Não foi possível buscar uma receita agora. Tente novamente em instantes.' });
  }
});

app.listen(PORT, () => {
  console.log(`Prato da Semana rodando em http://localhost:${PORT}`);
});
