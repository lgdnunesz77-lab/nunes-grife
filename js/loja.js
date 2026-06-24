// ============================================================
//  LOJA - PRODUTOS E CARRINHO
// ============================================================

// ===== PRODUTOS =====
var produtos = [];

function carregarProdutos() {
    const salvos = localStorage.getItem('produtosLoja');
    if (salvos) { try { produtos = JSON.parse(salvos); } catch (e) { produtos = []; } } 
    else { produtos = []; }
    renderizarProdutos();
}

function renderizarProdutos() {
    const categorias = {
        'roupas': 'produtos-roupas',
        'calcados': 'produtos-calcados',
        'acessorios': 'produtos-acessorios',
        'bones': 'produtos-bones',
        'academia': 'produtos-academia',
        'time': 'produtos-time'
    };
    const categoriasNomes = {
        'roupas': 'Roupas',
        'calcados': 'Calçados',
        'acessorios': 'Acessórios',
        'bones': 'Bonés',
        'academia': 'Academia',
        'time': 'Camisas de Time'
    };

    Object.keys(categorias).forEach(cat => {
        const container = document.getElementById(categorias[cat]);
        if (!container) return;
        const produtosCat = produtos.filter(p => p.categoria === cat && p.ativo !== false);

        if (produtosCat.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-8" style="color: var(--text-secondary);"><p class="text-sm">Nenhum produto disponível</p></div>`;
            return;
        }

        container.innerHTML = produtosCat.map(p => `
            <div class="product-card rounded-xl overflow-hidden">
                <div class="h-56 bg-gray-100 relative overflow-hidden">
                    <img src="${p.imagens && p.imagens.length > 0 ? p.imagens[0] : 'https://via.placeholder.com/400/333/666?text=Erro'}" alt="${p.nome}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/400/333/666?text=Erro'">
                    <span class="absolute top-2 right-2 bg-dourado text-nunes text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">${categoriasNomes[cat]}</span>
                </div>
                <div class="p-4">
                    <p class="text-[10px] uppercase tracking-wider cat">${p.subcategoria || categoriasNomes[cat]}</p>
                    <h4 class="text-sm font-bold mt-1 truncate title">${p.nome}</h4>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-lg font-bold price">R$ ${p.preco.toFixed(2)}</span>
                        <button onclick="adicionarAoCarrinho(${p.id})" class="btn-gold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    });
}

// ===== CARRINHO =====
let carrinho = [];

function adicionarAoCarrinho(produtoId) {
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;
    const existente = carrinho.find(item => item.id === produtoId);
    if (existente) { existente.quantidade += 1; } 
    else { carrinho.push({ ...produto, quantidade: 1 }); }
    atualizarCarrinhoUI();
    mostrarNotificacao('✅ Produto adicionado!');
}

function removerDoCarrinho(index) {
    if (confirm(`Remover "${carrinho[index].nome}" do carrinho?`)) {
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
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

function getQuantidadeTotal() {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
}

function atualizarCarrinhoUI() {
    const contador = document.getElementById('carrinho-contador');
    if (contador) contador.textContent = getQuantidadeTotal();
    
    const container = document.getElementById('carrinho-itens-container');
    if (!container) return;
    const subtotal = getTotalCarrinho();

    if (carrinho.length === 0) {
        container.innerHTML = `<div class="text-center py-12" style="color: var(--text-secondary);"><i class="fa-solid fa-bag-shopping text-4xl mb-3 block" style="color: var(--text-muted);"></i>Seu carrinho está vazio!</div>`;
        document.getElementById('carrinho-subtotal').textContent = 'R$ 0,00';
        document.getElementById('carrinho-total').textContent = 'R$ 0,00';
        return;
    }

    container.innerHTML = carrinho.map((item, index) => `
        <div class="cart-item flex gap-3 items-start p-3 rounded-xl">
            <img src="${item.imagens && item.imagens.length > 0 ? item.imagens[0] : 'https://via.placeholder.com/64/333/666?text=Erro'}" class="w-16 h-16 object-cover rounded-lg" onerror="this.src='https://via.placeholder.com/64/333/666?text=Erro'">
            <div class="flex-1 min-w-0">
                <p class="text-xs font-bold truncate item-title">${item.nome}</p>
                <p class="text-sm font-bold item-price">R$ ${item.preco.toFixed(2)}</p>
                <div class="flex items-center gap-2 mt-1">
                    <button onclick="alterarQuantidade(${index}, -1)" class="w-6 h-6 rounded-full border hover:border-dourado hover:text-dourado transition flex items-center justify-center text-xs" style="border-color: var(--border-color); color: var(--text-primary);">−</button>
                    <span class="text-sm font-bold min-w-[20px] text-center" style="color: var(--text-primary);">${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${index}, 1)" class="w-6 h-6 rounded-full border hover:border-dourado hover:text-dourado transition flex items-center justify-center text-xs" style="border-color: var(--border-color); color: var(--text-primary);">+</button>
                </div>
            </div>
            <button onclick="removerDoCarrinho(${index})" class="text-gray-400 hover:text-red-500 transition text-sm mt-1" title="Remover item"><i class="fa-solid fa-times"></i></button>
        </div>
    `).join('');

    const metodo = document.querySelector('input[name="tipo-entrega"]:checked')?.value || 'retirada';
    let total = subtotal;
    if (metodo === 'entrega') {
        const config = JSON.parse(localStorage.getItem('nunes_config_loja') || '{"freteBase":10}');
        total += parseFloat(config.freteBase || 0);
    }

    document.getElementById('carrinho-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('carrinho-total').textContent = `R$ ${total.toFixed(2)}`;
}