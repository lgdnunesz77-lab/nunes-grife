// ============================================================
//  LOJA - PRODUTOS E CARRINHO
//  Depende de: firebase-config.js, main.js
// ============================================================

// ===== PRODUTOS =====
// var (não let/const) para ficar em window.produtos
var produtos = [];

function carregarProdutos() {
    const salvos = localStorage.getItem('produtosLoja');
    if (salvos) {
        try { produtos = JSON.parse(salvos); } catch (e) { produtos = []; }
    } else {
        produtos = [];
    }
    renderizarProdutos();
}

function renderizarProdutos() {
    const categorias = {
        'roupas':    'produtos-roupas',
        'calcados':  'produtos-calcados',
        'acessorios':'produtos-acessorios',
        'bones':     'produtos-bones',
        'academia':  'produtos-academia',
        'time':      'produtos-time'
    };
    const categoriasNomes = {
        'roupas':    'Roupas',
        'calcados':  'Calçados',
        'acessorios':'Acessórios',
        'bones':     'Bonés',
        'academia':  'Academia',
        'time':      'Camisas de Time'
    };

    Object.keys(categorias).forEach(function(cat) {
        var container = document.getElementById(categorias[cat]);
        if (!container) return;
        var produtosCat = produtos.filter(function(p) {
            return p.categoria === cat && p.ativo !== false;
        });

        if (produtosCat.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-8" style="color: var(--text-secondary);"><i class="fa-solid fa-shirt text-2xl mb-2 block opacity-30"></i><p class="text-sm">Nenhum produto disponível</p></div>';
            return;
        }

        container.innerHTML = produtosCat.map(function(p) {
            // ⚠️ ID entre ASPAS para funcionar com IDs string do Firestore
            var imgSrc = (p.imagens && p.imagens.length > 0)
                ? p.imagens[0]
                : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%231a1a1a"/><text x="50%" y="50%" fill="%23D4AF37" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="14">Sem Imagem</text></svg>';
            var nomeSubcat = p.subcategoria || categoriasNomes[cat];
            return [
                '<div class="product-card rounded-xl overflow-hidden cursor-pointer">',
                    '<div class="h-56 bg-gray-100 relative overflow-hidden">',
                        '<img src="' + imgSrc + '" alt="' + p.nome + '" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy"',
                            ' onerror="this.style.display=\'none\'">',
                        '<span class="absolute top-2 right-2 bg-dourado text-nunes text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">',
                            categoriasNomes[cat],
                        '</span>',
                    '</div>',
                    '<div class="p-4">',
                        '<p class="text-[10px] uppercase tracking-wider cat">' + nomeSubcat + '</p>',
                        '<h4 class="text-sm font-bold mt-1 truncate title" title="' + p.nome + '">' + p.nome + '</h4>',
                        '<div class="flex items-center justify-between mt-3">',
                            '<span class="text-lg font-bold price">R$ ' + p.preco.toFixed(2) + '</span>',
                            // ⚠️ ID entre aspas simples → funciona para string e número
                            '<button onclick="adicionarAoCarrinho(\'' + p.id + '\')"',
                                ' class="btn-gold px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition"',
                                ' aria-label="Adicionar ' + p.nome + ' ao carrinho">',
                                '<i class="fa-solid fa-cart-plus"></i>',
                            '</button>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');
        }).join('');
    });
}

// ===== CARRINHO =====
// var para ser window.carrinho acessível de index.html
var carrinho = [];

function adicionarAoCarrinho(produtoId) {
    // Busca por ID convertendo ambos para string (compatível com número e Firestore string)
    var produto = produtos.find(function(p) {
        return String(p.id) === String(produtoId);
    });
    if (!produto) {
        console.warn('Produto não encontrado, id:', produtoId);
        return;
    }
    var existente = carrinho.find(function(item) {
        return String(item.id) === String(produtoId);
    });
    if (existente) {
        existente.quantidade += 1;
    } else {
        carrinho.push(Object.assign({}, produto, { quantidade: 1 }));
    }
    atualizarCarrinhoUI();
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('✅ ' + produto.nome + ' adicionado!');
    }
}

function removerDoCarrinho(index) {
    var item = carrinho[index];
    if (!item) return;
    if (confirm('Remover "' + item.nome + '" do carrinho?')) {
        carrinho.splice(index, 1);
        atualizarCarrinhoUI();
    }
}

function alterarQuantidade(index, delta) {
    if (carrinho[index]) {
        carrinho[index].quantidade = Math.max(1, carrinho[index].quantidade + delta);
        atualizarCarrinhoUI();
    }
}

function getTotalCarrinho() {
    return carrinho.reduce(function(total, item) {
        return total + (item.preco * item.quantidade);
    }, 0);
}

function getQuantidadeTotal() {
    return carrinho.reduce(function(total, item) {
        return total + item.quantidade;
    }, 0);
}

function atualizarCarrinhoUI() {
    // Atualizar contador no header
    var contador = document.getElementById('carrinho-contador');
    if (contador) contador.textContent = getQuantidadeTotal();

    var container = document.getElementById('carrinho-itens-container');
    if (!container) return;

    var subtotal = getTotalCarrinho();

    if (carrinho.length === 0) {
        container.innerHTML = [
            '<div class="text-center py-12" style="color: var(--text-secondary);">',
                '<i class="fa-solid fa-bag-shopping text-4xl mb-3 block" style="color: var(--text-muted);"></i>',
                '<p class="text-sm">Seu carrinho está vazio!</p>',
            '</div>'
        ].join('');
        var elSub = document.getElementById('carrinho-subtotal');
        var elTot = document.getElementById('carrinho-total');
        if (elSub) elSub.textContent = 'R$ 0,00';
        if (elTot) elTot.textContent = 'R$ 0,00';
        return;
    }

    container.innerHTML = carrinho.map(function(item, index) {
        var imgSrc = (item.imagens && item.imagens.length > 0) ? item.imagens[0] : '';
        return [
            '<div class="cart-item flex gap-3 items-start p-3 rounded-xl">',
                imgSrc
                    ? '<img src="' + imgSrc + '" class="w-16 h-16 object-cover rounded-lg shrink-0" onerror="this.style.display=\'none\'">'
                    : '<div class="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center" style="background:var(--border-color)"><i class="fa-solid fa-shirt text-dourado"></i></div>',
                '<div class="flex-1 min-w-0">',
                    '<p class="text-xs font-bold truncate item-title">' + item.nome + '</p>',
                    '<p class="text-sm font-bold item-price">R$ ' + item.preco.toFixed(2) + '</p>',
                    '<div class="flex items-center gap-2 mt-2">',
                        '<button onclick="alterarQuantidade(' + index + ', -1)"',
                            ' class="w-6 h-6 rounded-full border hover:border-dourado hover:text-dourado transition flex items-center justify-center text-xs"',
                            ' style="border-color:var(--border-color);color:var(--text-primary);">−</button>',
                        '<span class="text-sm font-bold min-w-[20px] text-center" style="color:var(--text-primary);">' + item.quantidade + '</span>',
                        '<button onclick="alterarQuantidade(' + index + ', 1)"',
                            ' class="w-6 h-6 rounded-full border hover:border-dourado hover:text-dourado transition flex items-center justify-center text-xs"',
                            ' style="border-color:var(--border-color);color:var(--text-primary);">+</button>',
                    '</div>',
                '</div>',
                '<button onclick="removerDoCarrinho(' + index + ')"',
                    ' class="text-gray-400 hover:text-red-500 transition text-sm mt-1 shrink-0" title="Remover">',
                    '<i class="fa-solid fa-times"></i>',
                '</button>',
            '</div>'
        ].join('');
    }).join('');

    // Calcular frete
    var metodoEl = document.querySelector('input[name="tipo-entrega"]:checked');
    var metodo = metodoEl ? metodoEl.value : 'retirada';
    var total = subtotal;
    if (metodo === 'entrega') {
        try {
            var config = JSON.parse(localStorage.getItem('nunes_config_loja') || '{"freteBase":10}');
            total += parseFloat(config.freteBase || 0);
        } catch(e) { total += 10; }
    }

    var elSub2 = document.getElementById('carrinho-subtotal');
    var elTot2 = document.getElementById('carrinho-total');
    if (elSub2) elSub2.textContent = 'R$ ' + subtotal.toFixed(2);
    if (elTot2) elTot2.textContent = 'R$ ' + total.toFixed(2);
}