// ============================================================
//  ADMIN JS - CRUD DE PRODUTOS
//  Depende de: firebase-config.js (carregado antes)
//  Usado por: admin.html
// ============================================================

// ===== PRODUTOS ADMIN =====
var produtosAdmin = [];

async function carregarProdutosAdmin() {
    try {
        // Tentar Firebase primeiro
        if (typeof buscarProdutosFirebase === 'function') {
            var lista = await buscarProdutosFirebase();
            if (lista && lista.length > 0) {
                produtosAdmin = lista.map(function(p) {
                    return {
                        id:          p.id,
                        nome:        p.nome        || '',
                        preco:       parseFloat(p.preco) || 0,
                        imagens:     p.imagens     || [],
                        categoria:   p.categoria   || 'roupas',
                        subcategoria:p.subcategoria|| '',
                        descricao:   p.descricao   || '',
                        ativo:       p.ativo !== false
                    };
                });
                renderizarTabelaProdutos();
                return;
            }
        }
    } catch (e) {
        console.warn('Firebase indisponível, usando localStorage:', e.message);
    }
    // Fallback: localStorage
    try {
        var salvos = localStorage.getItem('produtosLoja');
        produtosAdmin = salvos ? JSON.parse(salvos) : [];
    } catch(e) {
        produtosAdmin = [];
    }
    renderizarTabelaProdutos();
}

function renderizarTabelaProdutos() {
    var tbody = document.getElementById('tabela-produtos-corpo');
    var vazia = document.getElementById('mensagem-vazia');
    if (!tbody) return;

    var busca = '';
    var filtroEl = document.getElementById('filtro-busca-produtos');
    if (filtroEl) busca = filtroEl.value.toLowerCase();

    var filtrados = busca
        ? produtosAdmin.filter(function(p) { return p.nome.toLowerCase().includes(busca); })
        : produtosAdmin;

    if (filtrados.length === 0) {
        tbody.innerHTML = '';
        if (vazia) vazia.classList.remove('hidden');
        return;
    }
    if (vazia) vazia.classList.add('hidden');

    var mapa = {
        'roupas':'Roupas','calcados':'Calçados','acessorios':'Acessórios',
        'bones':'Bonés','academia':'Academia','time':'Camisas de Time'
    };

    tbody.innerHTML = filtrados.map(function(p, index) {
        var imgSrc = (p.imagens && p.imagens.length > 0)
            ? p.imagens[0]
            : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="%23f3f4f6"/><text x="50%" y="60%" fill="%239ca3af" text-anchor="middle" font-size="8" font-family="sans-serif">?</text></svg>';
        var catLabel = mapa[p.categoria] || p.categoria;
        var statusCls = p.ativo !== false ? 'text-green-600' : 'text-red-500';
        var statusTxt = p.ativo !== false ? '✅ Ativo' : '❌ Inativo';
        return [
            '<tr class="hover:bg-amber-50/50 transition">',
                '<td class="px-3 py-3">',
                    '<img src="' + imgSrc + '" class="w-10 h-10 object-cover rounded-lg border border-gray-200">',
                '</td>',
                '<td class="px-3 py-3 font-semibold text-gray-800 text-xs max-w-[160px] truncate">' + p.nome + '</td>',
                '<td class="px-3 py-3 text-xs hidden sm:table-cell">',
                    '<span class="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">' + catLabel + '</span>',
                '</td>',
                '<td class="px-3 py-3 text-xs font-bold text-yellow-600">R$ ' + p.preco.toFixed(2) + '</td>',
                '<td class="px-3 py-3 text-xs ' + statusCls + ' hidden md:table-cell">' + statusTxt + '</td>',
                '<td class="px-3 py-3 text-center whitespace-nowrap">',
                    '<button onclick="editarProduto(' + index + ')" class="text-yellow-600 hover:text-yellow-800 mr-3 transition" title="Editar">',
                        '<i class="fa-solid fa-pen-to-square"></i>',
                    '</button>',
                    '<button onclick="excluirProduto(' + index + ')" class="text-red-500 hover:text-red-700 transition" title="Excluir">',
                        '<i class="fa-solid fa-trash"></i>',
                    '</button>',
                '</td>',
            '</tr>'
        ].join('');
    }).join('');
}

// Helper de timeout para evitar travamentos em chamadas do Firebase
function comTimeout(promise, milissegundos) {
    let timeout = new Promise((_, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error("Tempo limite excedido no Firebase"));
        }, milissegundos);
    });
    return Promise.race([promise, timeout]);
}

// ===== COMPRESSÃO DE IMAGEM (garante tamanho pequeno para o Firestore) =====
function comprimirImagem(dataUrl, maxLado, qualidade) {
    return new Promise(function(resolve) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var ratio = Math.min(maxLado / img.width, maxLado / img.height, 1);
            canvas.width  = Math.round(img.width  * ratio);
            canvas.height = Math.round(img.height * ratio);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', qualidade));
        };
        img.onerror = function() { resolve(dataUrl); }; // fallback sem compressão
        img.src = dataUrl;
    });
}

// ===== UPLOAD DE IMAGEM (comprime → Firebase Storage OU base64 no Firestore) =====
async function uploadBase64Imagem(dataUrl, caminho) {
    // Comprimir SEMPRE antes de qualquer operação (reduz de MBs para ~40-80KB)
    var dadoComprimido = dataUrl.startsWith('data:')
        ? await comprimirImagem(dataUrl, 600, 0.72)
        : dataUrl;

    // Se Firebase Storage disponível, faz upload e retorna URL pública permanente
    if (typeof uploadBase64Firebase === 'function' && window.storage) {
        try {
            return await comTimeout(uploadBase64Firebase(dadoComprimido, caminho), 7000);
        } catch(e) {
            console.warn('Firebase Storage indisponível, salvando base64 no Firestore:', e.message);
        }
    }
    // Fallback: base64 comprimida salva direto no Firestore (funciona sem Storage)
    return dadoComprimido;
}

// ===== SALVAR PRODUTO =====
document.addEventListener('DOMContentLoaded', function() {

    var formProduto = document.getElementById('form-cadastro-produto');
    if (formProduto) {
        formProduto.addEventListener('submit', async function(e) {
            e.preventDefault();
            var btnSalvar = document.getElementById('btn-salvar-produto') || this.querySelector('[type="submit"]');
            var textoOriginal = btnSalvar ? btnSalvar.innerHTML : '';

            // Coletar imagens do preview
            var imagensPreview = [];
            document.querySelectorAll('#pre-visualizacao-fotos img').forEach(function(img) {
                imagensPreview.push(img.src);
            });

            if (imagensPreview.length === 0) {
                _notificarAdmin('⚠️ Adicione pelo menos uma foto!', 'warning');
                return;
            }

            try {
                if (btnSalvar) {
                    btnSalvar.disabled = true;
                    btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Salvando...';
                }

                // Processar imagens: upload para Firebase se disponível
                var imagensFinais = [];
                for (var i = 0; i < imagensPreview.length; i++) {
                    var src = imagensPreview[i];
                    if (src.startsWith('data:')) {
                        var ext = (src.split(';')[0].split('/')[1]) || 'jpg';
                        var caminho = 'produtos/' + Date.now() + '_' + i + '.' + ext;
                        var url = await uploadBase64Imagem(src, caminho);
                        imagensFinais.push(url);
                    } else {
                        imagensFinais.push(src);
                    }
                }

                var idAtual = document.getElementById('prod-id').value;
                var produto = {
                    nome:        document.getElementById('prod-nome').value.trim(),
                    preco:       parseFloat(document.getElementById('prod-preco').value),
                    imagens:     imagensFinais,
                    categoria:   document.getElementById('prod-categoria').value,
                    subcategoria:document.getElementById('prod-subcategoria').value,
                    descricao:   document.getElementById('prod-descricao').value.trim(),
                    ativo:       document.getElementById('prod-ativo').checked
                };

                var sucesso = false;

                // Tentar salvar no Firebase
                if (window.db) {
                    try {
                        if (idAtual) {
                            await comTimeout(window.db.collection('produtos').doc(idAtual).set(
                                Object.assign({}, produto, { id: idAtual }),
                                { merge: true }
                            ), 8000);
                        } else {
                            var docRef = await comTimeout(window.db.collection('produtos').add(produto), 8000);
                            await comTimeout(window.db.collection('produtos').doc(docRef.id).update({ id: docRef.id }), 5000);
                        }
                        sucesso = true;
                    } catch(fbErr) {
                        console.warn('Erro Firebase, salvando em localStorage:', fbErr.message);
                        _notificarAdmin('⚠️ Erro de gravação no Firebase. Salvando localmente!', 'warning');
                    }
                }

                // Fallback: localStorage
                if (!sucesso) {
                    var salvosList = [];
                    try { salvosList = JSON.parse(localStorage.getItem('produtosLoja') || '[]'); } catch(e2) {}
                    if (idAtual) {
                        var idx = salvosList.findIndex(function(p) { return String(p.id) === String(idAtual); });
                        if (idx >= 0) salvosList[idx] = Object.assign({}, produto, { id: idAtual });
                        else salvosList.push(Object.assign({}, produto, { id: Date.now() }));
                    } else {
                        salvosList.push(Object.assign({}, produto, { id: Date.now() }));
                    }
                    localStorage.setItem('produtosLoja', JSON.stringify(salvosList));
                }

                // Recarregar lista
                await carregarProdutosAdmin();
                _resetarFormProduto(this);

                // Atualizar estatísticas se função existir
                if (typeof carregarEstatisticas === 'function') carregarEstatisticas();

                _notificarAdmin('✅ Produto salvo com sucesso!', 'success');

            } catch (err) {
                console.error('Erro ao salvar produto:', err);
                _notificarAdmin('❌ Erro ao salvar: ' + err.message, 'error');
            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.innerHTML = textoOriginal;
                }
            }
        });
    }

    // Filtro de busca
    var filtroBusca = document.getElementById('filtro-busca-produtos');
    if (filtroBusca) filtroBusca.addEventListener('input', renderizarTabelaProdutos);

    // Cancelar edição
    var btnCancelar = document.getElementById('btn-cancelar-edicao');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            var form = document.getElementById('form-cadastro-produto');
            if (form) _resetarFormProduto(form);
        });
    }

    // Upload de fotos para preview
    var uploadFotos = document.getElementById('prod-fotos-upload');
    if (uploadFotos) {
        uploadFotos.addEventListener('change', function() {
            var preview = document.getElementById('pre-visualizacao-fotos');
            if (!preview) return;
            // Se não está editando, limpa previews anteriores
            var idAtual = document.getElementById('prod-id').value;
            if (!idAtual) preview.innerHTML = '';

            for (var i = 0; i < this.files.length; i++) {
                (function(file) {
                    var reader = new FileReader();
                    reader.onload = function(ev) {
                        var div = document.createElement('div');
                        div.className = 'preview-item';
                        div.innerHTML = '<img src="' + ev.target.result + '"><button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>';
                        preview.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                })(this.files[i]);
            }
            this.value = '';
        });
    }
});

// ===== EDITAR PRODUTO =====
function editarProduto(index) {
    var p = produtosAdmin[index];
    if (!p) return;
    document.getElementById('prod-id').value         = p.id;
    document.getElementById('prod-nome').value       = p.nome;
    document.getElementById('prod-preco').value      = p.preco;
    document.getElementById('prod-categoria').value  = p.categoria;
    document.getElementById('prod-subcategoria').value = p.subcategoria || '';
    document.getElementById('prod-descricao').value  = p.descricao || '';
    document.getElementById('prod-ativo').checked    = p.ativo !== false;

    var preview = document.getElementById('pre-visualizacao-fotos');
    if (preview) {
        preview.innerHTML = (p.imagens || []).map(function(img) {
            return '<div class="preview-item"><img src="' + img + '"><button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button></div>';
        }).join('');
    }

    var titulo = document.getElementById('form-produto-titulo');
    if (titulo) titulo.textContent = '✏️ Editando: ' + p.nome;

    var btnCanc = document.getElementById('btn-cancelar-edicao');
    if (btnCanc) btnCanc.classList.remove('hidden');

    // Ir para o formulário
    var form = document.getElementById('form-cadastro-produto');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== EXCLUIR PRODUTO =====
async function excluirProduto(index) {
    var prod = produtosAdmin[index];
    if (!prod) return;
    if (!confirm('⚠️ Excluir "' + prod.nome + '" permanentemente?')) return;

    try {
        // Firebase
        if (window.db && prod.id && typeof prod.id === 'string') {
            try { await window.db.collection('produtos').doc(prod.id).delete(); } catch(e) { console.warn(e); }
        }
        // localStorage
        var salvos = [];
        try { salvos = JSON.parse(localStorage.getItem('produtosLoja') || '[]'); } catch(e) {}
        salvos = salvos.filter(function(p) { return String(p.id) !== String(prod.id); });
        localStorage.setItem('produtosLoja', JSON.stringify(salvos));

        produtosAdmin.splice(index, 1);
        renderizarTabelaProdutos();
        if (typeof carregarEstatisticas === 'function') carregarEstatisticas();
        _notificarAdmin('🗑️ "' + prod.nome + '" excluído!', 'info');
    } catch(err) {
        console.error('Erro ao excluir:', err);
        _notificarAdmin('❌ Erro ao excluir produto.', 'error');
    }
}

// ===== RESETAR FORMULÁRIO =====
function _resetarFormProduto(form) {
    if (form) form.reset();
    var preview = document.getElementById('pre-visualizacao-fotos');
    if (preview) preview.innerHTML = '';
    var idEl = document.getElementById('prod-id');
    if (idEl) idEl.value = '';
    var titulo = document.getElementById('form-produto-titulo');
    if (titulo) titulo.textContent = 'Adicionar Produto';
    var btnCanc = document.getElementById('btn-cancelar-edicao');
    if (btnCanc) btnCanc.classList.add('hidden');
}

// ===== NOTIFICAÇÕES (usa showToast do admin.html se existir, senão console) =====
function _notificarAdmin(msg, tipo) {
    if (typeof showToast === 'function') {
        showToast(msg, tipo || 'success');
    } else {
        console.info('[Admin]', msg);
    }
}

// ===== carregarDadosAdmin (base — será complementado pelo admin.html) =====
function carregarDadosAdmin() {
    carregarProdutosAdmin();
}