// ============================================================
//  FIREBASE - CONFIGURAÇÃO E FUNÇÕES DE BANCO DE DADOS
//  Substitua os valores abaixo com os do seu Firebase Console
//  console.firebase.google.com → Seu Projeto → Configurações
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAFG5kX3hmg5Ihq8Y6j8I4U4IJdXsyf0zc",
    authDomain: "nunes-grife.firebaseapp.com",
    projectId: "nunes-grife",
    storageBucket: "nunes-grife.firebasestorage.app",
    messagingSenderId: "966911069749",
    appId: "1:966911069749:web:cfd0b53ced225117816b7c",
    measurementId: "G-L9VJSQGM8D"
};

// ============================================================
//  INICIALIZAÇÃO SEGURA (não quebra sem chaves reais)
// ============================================================
var db = null, auth = null, storage = null, analytics = null;
var _firebaseAtivo = false;

(function inicializarFirebase() {
    const placeholder = firebaseConfig.apiKey === "SUA_API_KEY";
    if (placeholder) {
        console.warn('⚠️ Firebase não configurado. Adicione suas chaves em js/firebase-config.js');
        console.info('ℹ️ O site funciona normalmente com localStorage até você configurar o Firebase.');
        return;
    }
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db        = firebase.firestore();
        auth      = firebase.auth();
        storage   = firebase.storage();
        try { analytics = firebase.analytics(); } catch(e) {}
        _firebaseAtivo = true;
        console.info('✅ Firebase inicializado com sucesso!');
    } catch (err) {
        console.error('❌ Erro ao inicializar Firebase:', err.message);
    }
})();

// ============================================================
//  PRODUTOS
// ============================================================
async function salvarProdutoFirebase(produto) {
    if (!db) throw new Error('Firebase não configurado.');
    const docRef = await db.collection('produtos').add(produto);
    await db.collection('produtos').doc(docRef.id).update({ id: docRef.id });
    return docRef.id;
}

async function buscarProdutosFirebase() {
    if (!db) return [];
    try {
        const snapshot = await db.collection('produtos').get();
        const produtos = [];
        snapshot.forEach(doc => produtos.push({ id: doc.id, ...doc.data() }));
        return produtos;
    } catch (e) {
        console.error('Erro ao buscar produtos:', e);
        return [];
    }
}

async function atualizarProdutoFirebase(id, dados) {
    if (!db) throw new Error('Firebase não configurado.');
    await db.collection('produtos').doc(id).set(dados, { merge: true });
}

async function excluirProdutoFirebase(id) {
    if (!db) throw new Error('Firebase não configurado.');
    await db.collection('produtos').doc(id).delete();
}

// ============================================================
//  PEDIDOS
// ============================================================
async function salvarPedidoFirebase(pedido) {
    if (!db) return null;
    try {
        const docRef = await db.collection('pedidos').add({
            ...pedido,
            data: new Date().toISOString(),
            status: 'pendente'
        });
        return docRef.id;
    } catch (e) {
        console.error('Erro ao salvar pedido:', e);
        return null;
    }
}

// ============================================================
//  CLIENTES
// ============================================================
async function salvarClienteFirebase(cliente) {
    if (!db) return null;
    try {
        const snap = await db.collection('clientes')
            .where('whatsapp', '==', cliente.whatsapp).get();
        if (!snap.empty) {
            const docId = snap.docs[0].id;
            await db.collection('clientes').doc(docId).update({
                ...cliente, ultimaVisita: new Date().toISOString()
            });
            return docId;
        } else {
            const docRef = await db.collection('clientes').add({
                ...cliente,
                criadoEm: new Date().toISOString(),
                ultimaVisita: new Date().toISOString()
            });
            return docRef.id;
        }
    } catch (e) {
        console.error('Erro ao salvar cliente:', e);
        return null;
    }
}

// ============================================================
//  ESTATÍSTICAS
// ============================================================
async function buscarEstatisticas() {
    if (!db) return { totalProdutos: 0, totalPedidos: 0, totalClientes: 0, pedidosPendentes: 0 };
    try {
        const [prodSnap, pedSnap, cliSnap] = await Promise.all([
            db.collection('produtos').get(),
            db.collection('pedidos').get(),
            db.collection('clientes').get()
        ]);
        return {
            totalProdutos:    prodSnap.size,
            totalPedidos:     pedSnap.size,
            totalClientes:    cliSnap.size,
            pedidosPendentes: pedSnap.docs.filter(d => d.data().status === 'pendente').length
        };
    } catch (e) {
        console.error('Erro ao buscar estatísticas:', e);
        return { totalProdutos: 0, totalPedidos: 0, totalClientes: 0, pedidosPendentes: 0 };
    }
}

// ============================================================
//  AUTENTICAÇÃO
// ============================================================
async function loginAdmin(email, senha) {
    if (!auth) return { success: false, error: 'Firebase não configurado.' };
    try {
        await auth.signInWithEmailAndPassword(email, senha);
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function logoutAdmin() {
    if (!auth) return;
    try { await auth.signOut(); } catch(e) {}
}

function verificarAuth() {
    return new Promise(resolve => {
        if (!auth) { resolve(null); return; }
        auth.onAuthStateChanged(user => resolve(user));
    });
}

// ============================================================
//  STORAGE — UPLOAD DE IMAGENS
// ============================================================
async function uploadImagem(file, caminho) {
    if (!storage) throw new Error('Firebase Storage não configurado.');
    const ref = storage.ref(caminho);
    const snapshot = await ref.put(file);
    return await snapshot.ref.getDownloadURL();
}

async function uploadBase64Firebase(dataUrl, caminho) {
    if (!storage) throw new Error('Firebase Storage não configurado.');
    const ref = storage.ref(caminho);
    const snapshot = await ref.putString(dataUrl, 'data_url');
    return await snapshot.ref.getDownloadURL();
}

// ============================================================
//  EXPOR NO ESCOPO GLOBAL
// ============================================================
window.db                   = db;
window.auth                 = auth;
window.storage              = storage;
window.analytics            = analytics;
window._firebaseAtivo       = _firebaseAtivo;
window.salvarProdutoFirebase   = salvarProdutoFirebase;
window.buscarProdutosFirebase  = buscarProdutosFirebase;
window.atualizarProdutoFirebase = atualizarProdutoFirebase;
window.excluirProdutoFirebase  = excluirProdutoFirebase;
window.salvarPedidoFirebase    = salvarPedidoFirebase;
window.salvarClienteFirebase   = salvarClienteFirebase;
window.buscarEstatisticas      = buscarEstatisticas;
window.loginAdmin              = loginAdmin;
window.logoutAdmin             = logoutAdmin;
window.verificarAuth           = verificarAuth;
window.uploadImagem            = uploadImagem;
window.uploadBase64Firebase    = uploadBase64Firebase;
