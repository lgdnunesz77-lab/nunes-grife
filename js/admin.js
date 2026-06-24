// ============================================================
//  ADMIN - LOGIN, CRUD, CONFIGURAÇÕES (Firebase Integrado)
// ============================================================

// ===== SWITCH TABS =====
function switchTab(tabId) {
    document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active', 'text-dourado', 'border-dourado');
        el.classList.add('text-gray-500', 'border-transparent');
    });
    document.getElementById(tabId).classList.remove('hidden');
    const btn = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (btn) {
        btn.classList.add('active', 'text-dourado', 'border-dourado');
        btn.classList.remove('text-gray-500', 'border-transparent');
    }
}

// ===== PRODUTOS (Admin) =====
var produtosAdmin = [];

async function carregarProdutosAdmin() {
    try {
        const produtosFirebase = await buscarProdutosFirebase();
        if (produtosFirebase && produtosFirebase.length > 0) {
            produtosAdmin = produtosFirebase.map(p => ({
                id: p.id,
                nome: p.nome,
                preco: p.preco,
                imagens: p.imagens || [],
                categoria: p.categoria || 'roupas',
                subcategoria: p.subcategoria || '',
                descricao: p.descricao || '',
                ativo: p.ativo !== false
            }));
        } else {
            produtosAdmin = [];
        }
    } catch (e) {
        console.error('Erro ao carregar produtos no admin:', e);
        // Fallback para localStorage
        const salvos = localStorage.getItem('produtosLoja');
        if (salvos) {
            try { produtosAdmin = JSON.parse(salvos); } catch (err) { produtosAdmin = []; }
        } else {
            produtosAdmin = [];
        }
    }
    renderizarTabelaProdutos();
}

function renderizarTabelaProdutos() {
    const tbody = document.getElementById('tabela-produtos-corpo');
    const vazia = document.getElementById('mensagem-vazia');
    if (!tbody) return;
    const busca = document.getElementById('filtro-busca-produtos')?.value.toLowerCase() || '';
    let filtrados = busca ? produtosAdmin.filter(p => p.nome.toLowerCase().includes(busca)) : produtosAdmin;

    if (filtrados.length === 0) {
        tbody.innerHTML = '';
        if (vazia) vazia.classList.remove('hidden');
        return;
    }
    if (vazia) vazia.classList.add('hidden');

    const categoriasMap = { 
        'roupas': 'Roupas', 
        'calcados': 'Calçados', 
        'acessorios': 'Acessórios', 
        'bones': 'Bonés', 
        'academia': 'Academia', 
        'time': 'Camisas de Time' 
    };

    tbody.innerHTML = filtrados.map((p, index) => {
        const imgSrc = p.imagens && p.imagens.length > 0 ? p.imagens[0] : 'https://via.placeholder.com/40/333/666?text=Erro';
        return `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-4 py-3"><img src="${imgSrc}" class="w-10 h-10 object-cover rounded-lg border border-gray-200" onerror="this.src='https://via.placeholder.com/40/333/666?text=Erro'"></td>
            <td class="px-4 py-3 font-medium text-nunes text-xs">${p.nome}</td>
            <td class="px-4 py-3 text-xs"><span class="bg-dourado/10 text-dourado px-2 py-0.5 rounded-full">${categoriasMap[p.categoria] || p.categoria}</span></td>
            <td class="px-4 py-3 text-xs font-bold text-dourado">R$ ${p.preco.toFixed(2)}</td>
            <td class="px-4 py-3 text-xs ${p.ativo !== false ? 'text-green-600' : 'text-red-500'}">${p.ativo !== false ? '✅ Ativo' : '❌ Inativo'}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="editarProduto(${index})" class="text-dourado hover:text-dourado-hover mr-2 transition" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button onclick="excluirProduto(${index})" class="text-red-500 hover:text-red-700 transition" title="Excluir"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

// Helper para fazer upload de imagens em Base64 para o Firebase Storage
async function uploadBase64Imagem(dataUrl, caminho) {
    try {
        const ref = storage.ref(caminho);
        const snapshot = await ref.putString(dataUrl, 'data_url');
        const url = await snapshot.ref.getDownloadURL();
        return url;
    } catch (error) {
        console.error('Erro ao fazer upload de imagem Base64:', error);
        throw error;
    }
}

// Ouvinte de submissão do formulário de produto (Firebase Integrado)
document.getElementById('form-cadastro-produto')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btnSalvar = this.querySelector('button[type="submit"]');
    const originalText = btnSalvar.innerHTML;
    
    // Obter todas as imagens da visualização
    const imagensPreview = [];
    document.querySelectorAll('#pre-visualizacao-fotos img').forEach(img => { 
        imagensPreview.push(img.src); 
    });
    
    if (imagensPreview.length === 0) { 
        alert('⚠️ Adicione pelo menos uma foto!'); 
        return; 
    }

    try {
        // Mostrar estado de carregamento
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Salvando...';

        const imagensFinais = [];
        for (let i = 0; i < imagensPreview.length; i++) {
            const src = imagensPreview[i];
            if (src.startsWith('data:')) {
                // Upload do Base64 para o Firebase Storage
                const ext = src.split(';')[0].split('/')[1] || 'jpg';
                const caminho = `produtos/${Date.now()}_${i}.${ext}`;
                const url = await uploadBase64Imagem(src, caminho);
                imagensFinais.push(url);
            } else {
                imagensFinais.push(src);
            }
        }

        const id = document.getElementById('prod-id').value;
        const produto = {
            nome: document.getElementById('prod-nome').value,
            preco: parseFloat(document.getElementById('prod-preco').value),
            imagens: imagensFinais,
            categoria: document.getElementById('prod-categoria').value,
            subcategoria: document.getElementById('prod-subcategoria').value,
            descricao: document.getElementById('prod-descricao').value,
            ativo: document.getElementById('prod-ativo').checked
        };

        if (id) {
            // Atualizar produto existente no Firebase
            if (typeof id === 'string' && isNaN(id)) {
                await db.collection('produtos').doc(id).set({
                    ...produto,
                    id: id
                }, { merge: true });
            } else {
                // Se o ID for numérico antigo (localStorage), cria um novo documento
                const docRef = await db.collection('produtos').add(produto);
                await db.collection('produtos').doc(docRef.id).update({ id: docRef.id });
            }
        } else {
            // Criar novo produto no Firebase
            const docRef = await db.collection('produtos').add(produto);
            await db.collection('produtos').doc(docRef.id).update({ id: docRef.id });
        }

        // Recarregar a lista local
        await carregarProdutosAdmin();
        
        // Resetar o formulário
        this.reset();
        document.getElementById('pre-visualizacao-fotos').innerHTML = '';
        document.getElementById('prod-id').value = '';
        const btnCancelar = document.getElementById('btn-cancelar-edicao');
        if (btnCancelar) btnCancelar.classList.add('hidden');
        document.getElementById('form-produto-titulo').textContent = 'Adicionar Novo Produto';
        
        // Recarregar estatísticas do dashboard se a função existir
        if (typeof carregarEstatisticas === 'function') {
            carregarEstatisticas();
        }
        
        alert('✅ Produto salvo com sucesso no Firebase!');
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('❌ Erro ao salvar produto: ' + error.message);
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = originalText;
    }
});

function editarProduto(index) {
    const p = produtosAdmin[index];
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nome').value = p.nome;
    document.getElementById('prod-preco').value = p.preco;
    document.getElementById('prod-categoria').value = p.categoria;
    document.getElementById('prod-subcategoria').value = p.subcategoria || '';
    document.getElementById('prod-descricao').value = p.descricao || '';
    document.getElementById('prod-ativo').checked = p.ativo !== false;
    const preview = document.getElementById('pre-visualizacao-fotos');
    preview.innerHTML = p.imagens.map(img => `
        <div class="preview-item"><img src="${img}" onerror="this.src='https://via.placeholder.com/80/333/666?text=Erro'"><button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button></div>
    `).join('');
    document.getElementById('form-produto-titulo').textContent = '✏️ Editando Produto';
    const btnCancelar = document.getElementById('btn-cancelar-edicao');
    if (btnCancelar) btnCancelar.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirProduto(index) {
    const prod = produtosAdmin[index];
    if (confirm(`⚠️ Tem certeza que deseja excluir "${prod.nome}" permanentemente?`)) {
        try {
            // Se o ID for uma string (documento do Firestore), deletar do Firestore
            if (typeof prod.id === 'string' && isNaN(prod.id)) {
                await db.collection('produtos').doc(prod.id).delete();
            }
            
            // Remover localmente
            produtosAdmin.splice(index, 1);
            localStorage.setItem('produtosLoja', JSON.stringify(produtosAdmin));
            renderizarTabelaProdutos();
            alert('🗑️ Produto excluído com sucesso!');
            
            // Recarregar estatísticas
            if (typeof carregarEstatisticas === 'function') {
                carregarEstatisticas();
            }
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('❌ Erro ao excluir produto do Firebase!');
        }
    }
}

// Configurar ouvintes de eventos adicionais
document.getElementById('filtro-busca-produtos')?.addEventListener('input', renderizarTabelaProdutos);

document.getElementById('btn-cancelar-edicao')?.addEventListener('click', function() {
    document.getElementById('form-cadastro-produto').reset();
    document.getElementById('pre-visualizacao-fotos').innerHTML = '';
    document.getElementById('prod-id').value = '';
    this.classList.add('hidden');
    document.getElementById('form-produto-titulo').textContent = 'Adicionar Novo Produto';
});

document.getElementById('prod-fotos-upload')?.addEventListener('change', function(e) {
    const preview = document.getElementById('pre-visualizacao-fotos');
    if (!document.getElementById('prod-id').value) preview.innerHTML = '';
    for (const file of this.files) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${ev.target.result}" onerror="this.src='https://via.placeholder.com/80/333/666?text=Erro'"><button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>`;
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    }
    this.value = '';
});

// ===== CARREGAR DADOS ADMIN =====
function carregarDadosAdmin() {
    carregarProdutosAdmin();
    if (typeof carregarBannersAdmin === 'function') carregarBannersAdmin();
    if (typeof carregarConfiguracoesAdmin === 'function') carregarConfiguracoesAdmin();
    if (typeof carregarContatosAdmin === 'function') carregarContatosAdmin();
}