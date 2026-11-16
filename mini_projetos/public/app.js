const DIAS = [
  { id: 'seg', nome: 'Segunda' },
  { id: 'ter', nome: 'Terça' },
  { id: 'qua', nome: 'Quarta' },
  { id: 'qui', nome: 'Quinta' },
  { id: 'sex', nome: 'Sexta' },
  { id: 'sab', nome: 'Sábado' },
  { id: 'dom', nome: 'Domingo' },
];

const REFEICOES = [
  { id: 'cafe', nome: 'Café da manhã' },
  { id: 'almoco', nome: 'Almoço' },
  { id: 'lanche', nome: 'Lanche' },
];

const CATEGORIAS = [
  { rotulo: 'Café da manhã', valor: 'Breakfast' },
  { rotulo: 'Frango', valor: 'Chicken' },
  { rotulo: 'Carne', valor: 'Beef' },
  { rotulo: 'Peixes e frutos do mar', valor: 'Seafood' },
  { rotulo: 'Massas', valor: 'Pasta' },
  { rotulo: 'Vegetariano', valor: 'Vegetarian' },
  { rotulo: 'Entradas e petiscos', valor: 'Starter' },
  { rotulo: 'Acompanhamentos', valor: 'Side' },
  { rotulo: 'Sobremesas', valor: 'Dessert' },
];

const NOMES_CATEGORIA = Object.fromEntries(CATEGORIAS.map((c) => [c.valor, c.rotulo]));

const hoje = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];

let itens = [];

const $ = (seletor) => document.querySelector(seletor);

function h(tag, props = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props)) {
    if (valor === false || valor == null) continue;
    if (chave === 'class') el.className = valor;
    else if (chave.startsWith('on')) el.addEventListener(chave.slice(2), valor);
    else el.setAttribute(chave, valor);
  }
  for (const filho of filhos.flat()) {
    if (filho != null) el.append(filho);
  }
  return el;
}

async function api(url, opcoes = {}) {
  const resposta = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro || 'Algo deu errado. Tente novamente.');
  }
  return resposta.status === 204 ? null : resposta.json();
}

let temporizadorAviso;
function avisar(mensagem) {
  const aviso = $('#aviso');
  aviso.textContent = mensagem;
  aviso.classList.add('visivel');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove('visivel'), 3000);
}

function imagemValida(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function cartaoPrato(item) {
  return h(
    'article',
    { class: 'prato' },
    imagemValida(item.imagem) ? h('img', { src: item.imagem, alt: '', loading: 'lazy' }) : null,
    h(
      'div',
      { class: 'prato-corpo' },
      h('h3', {}, item.nome),
      item.detalhes ? h('p', {}, item.detalhes) : null
    ),
    h(
      'div',
      { class: 'acoes' },
      h('button', { type: 'button', onclick: () => abrirDialogo(item), 'aria-label': `Editar ${item.nome}` }, 'Editar'),
      h('button', { type: 'button', class: 'perigo', onclick: () => excluir(item), 'aria-label': `Excluir ${item.nome}` }, 'Excluir')
    )
  );
}

function renderGrade() {
  const grade = $('#grade');
  grade.replaceChildren();

  grade.append(h('div', { class: 'cel canto' }));
  DIAS.forEach((d) => {
    grade.append(
      h(
        'div',
        { class: 'cel dia' + (d.id === hoje ? ' hoje' : ''), role: 'columnheader' },
        d.nome,
        d.id === hoje ? h('small', {}, 'hoje') : null
      )
    );
  });

  REFEICOES.forEach((r) => {
    grade.append(h('div', { class: `cel refeicao ${r.id}`, role: 'rowheader' }, r.nome));

    DIAS.forEach((d) => {
      const doSlot = itens.filter((i) => i.dia === d.id && i.refeicao === r.id);
      grade.append(
        h(
          'div',
          { class: `cel slot ${r.id}`, role: 'cell' },
          doSlot.map(cartaoPrato),
          h(
            'button',
            {
              type: 'button',
              class: 'add',
              onclick: () => abrirDialogo({ dia: d.id, refeicao: r.id }),
              'aria-label': `Adicionar em ${r.nome}, ${d.nome}`,
            },
            doSlot.length ? '+ Outro prato' : 'Adicionar'
          )
        )
      );
    });
  });

  atualizarProgresso();
}

function atualizarProgresso() {
  const preenchidos = new Set(itens.map((i) => `${i.dia}|${i.refeicao}`)).size;
  const total = DIAS.length * REFEICOES.length;

  $('#progresso-texto').textContent =
    preenchidos === 0
      ? 'Nenhuma refeição planejada ainda. Comece pela segunda-feira.'
      : preenchidos === total
      ? 'Semana completa! As 21 refeições estão planejadas.'
      : `${preenchidos} de ${total} refeições planejadas`;

  $('#barra').setAttribute('aria-valuenow', preenchidos);
  $('#barra-preenchida').style.width = `${(preenchidos / total) * 100}%`;
}

async function carregarCardapio() {
  try {
    itens = await api('/api/cardapio');
  } catch (e) {
    avisar(e.message);
  }
  renderGrade();
}

const dialogo = $('#dialogo');

function preencherSelects() {
  $('#f-dia').replaceChildren(...DIAS.map((d) => h('option', { value: d.id }, d.nome)));
  $('#f-refeicao').replaceChildren(...REFEICOES.map((r) => h('option', { value: r.id }, r.nome)));
}

function abrirDialogo(dados = {}) {
  const editando = Boolean(dados.id);
  $('#dialogo-titulo').textContent = editando ? 'Editar refeição' : 'Nova refeição';
  $('#f-id').value = dados.id || '';
  $('#f-nome').value = dados.nome || '';
  $('#f-dia').value = dados.dia || hoje;
  $('#f-refeicao').value = dados.refeicao || 'cafe';
  $('#f-detalhes').value = dados.detalhes || '';
  $('#f-imagem').value = dados.imagem || '';
  $('#f-erro').hidden = true;
  dialogo.showModal();
  $('#f-nome').focus();
}

$('#f-cancelar').addEventListener('click', () => dialogo.close());

$('#form-refeicao').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = $('#f-id').value;
  const corpo = {
    nome: $('#f-nome').value,
    dia: $('#f-dia').value,
    refeicao: $('#f-refeicao').value,
    detalhes: $('#f-detalhes').value,
    imagem: $('#f-imagem').value,
  };

  try {
    await api(id ? `/api/cardapio/${id}` : '/api/cardapio', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(corpo),
    });
    itens = await api('/api/cardapio');
    renderGrade();
    dialogo.close();
    avisar(id ? 'Refeição atualizada.' : 'Refeição adicionada ao cardápio.');
  } catch (e) {
    const erro = $('#f-erro');
    erro.textContent = e.message;
    erro.hidden = false;
  }
});

async function excluir(item) {
  if (!confirm(`Excluir "${item.nome}" do cardápio?`)) return;
  try {
    await api(`/api/cardapio/${item.id}`, { method: 'DELETE' });
    itens = itens.filter((i) => i.id !== item.id);
    renderGrade();
    avisar('Refeição excluída.');
  } catch (e) {
    avisar(e.message);
  }
}

$('#btn-novo').addEventListener('click', () => abrirDialogo());

function cartaoReceita(receita) {
  const botao = h('button', { type: 'button', class: 'btn btn-contorno' }, 'Adicionar ao cardápio');
  botao.addEventListener('click', () => usarReceita(receita, botao));

  const meta = [NOMES_CATEGORIA[receita.categoria] || receita.categoria, receita.origem]
    .filter(Boolean)
    .join(', ');

  return h(
    'article',
    { class: 'receita' },
    h('img', { src: receita.imagem, alt: `Foto de ${receita.nome}`, loading: 'lazy' }),
    h('div', { class: 'receita-corpo' }, h('h3', {}, receita.nome), h('p', { class: 'meta' }, meta), botao)
  );
}

async function carregarReceitas(url) {
  const lista = $('#resultados');
  lista.setAttribute('aria-busy', 'true');
  lista.replaceChildren(h('p', { class: 'vazio' }, 'Buscando receitas…'));

  try {
    const receitas = await api(url);
    lista.replaceChildren(
      ...(receitas.length
        ? receitas.map(cartaoReceita)
        : [h('p', { class: 'vazio' }, 'Nenhuma receita encontrada. Tente outro ingrediente, como ovo, frango ou aveia.')])
    );
  } catch (e) {
    lista.replaceChildren(h('p', { class: 'vazio' }, e.message));
  } finally {
    lista.removeAttribute('aria-busy');
  }
}

function marcarChip(valor) {
  document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.valor === valor)));
}

function renderChips() {
  $('#chips').replaceChildren(
    ...CATEGORIAS.map((c) =>
      h(
        'button',
        {
          type: 'button',
          class: 'chip',
          'data-valor': c.valor,
          'aria-pressed': 'false',
          onclick: () => {
            marcarChip(c.valor);
            carregarReceitas('/api/receitas?' + new URLSearchParams({ categoria: c.valor }));
          },
        },
        c.rotulo
      )
    )
  );
}

$('#form-busca').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const termo = $('#busca-termo').value.trim();
  if (!termo) return;
  marcarChip(null);
  carregarReceitas('/api/receitas?' + new URLSearchParams({ q: termo }));
});

$('#btn-surpresa').addEventListener('click', () => {
  marcarChip(null);
  carregarReceitas('/api/receitas/aleatoria');
});

async function usarReceita(receita, botao) {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = 'Preparando…';

  const lista = receita.ingredientes.join(', ').slice(0, 450);
  let ingredientes = lista;
  try {
    const { traducao } = await api('/api/traduzir?' + new URLSearchParams({ texto: lista, de: 'en', para: 'pt' }));
    ingredientes = traducao;
  } catch {
    
  }

  const refeicao = receita.categoria === 'Breakfast' ? 'cafe' : ['Starter', 'Side', 'Dessert'].includes(receita.categoria) ? 'lanche' : 'almoco';

  botao.disabled = false;
  botao.textContent = textoOriginal;

  abrirDialogo({
    nome: receita.nome,
    dia: hoje,
    refeicao,
    detalhes: `Ingredientes: ${ingredientes}`.slice(0, 500),
    imagem: receita.imagem,
  });
}

preencherSelects();
renderChips();
carregarCardapio();
marcarChip('Breakfast');
carregarReceitas('/api/receitas?' + new URLSearchParams({ categoria: 'Breakfast' }));
