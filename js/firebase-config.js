// ============================================================
//  FIREBASE CONFIGURAÇÃO
//  Substitua com seus dados do Firebase Console
// ============================================================

// Configuração do Firebase (pegue no console.firebase.google.com)
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID",
    measurementId: "SEU_MEASUREMENT_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const analytics = firebase.analytics();

// ===== FUNÇÕES DE BANCO DE DADOS =====

// Salvar produto no Firestore
async function salvarProdutoFirebase(produto) {
    try {
        const docRef = await db.collection('produtos').add(produto);
        console.log('✅ Produto salvo com ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Erro ao salvar produto:', error);
        throw error;
    }
}

// Buscar todos os produtos
async function buscarProdutosFirebase() {
    try {
        const snapshot = await db.collection('produtos').get();
        const produtos = [];
        snapshot.forEach(doc => {
            produtos.push({ id: doc.id, ...doc.data() });
        });
        return produtos;
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        return [];
    }
}

// Salvar pedido
async function salvarPedidoFirebase(pedido) {
    try {
        const docRef = await db.collection('pedidos').add({
            ...pedido,
            data: new Date().toISOString(),
            status: 'pendente'
        });
        console.log('✅ Pedido salvo com ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Erro ao salvar pedido:', error);
        throw error;
    }
}

// Salvar cliente
async function salvarClienteFirebase(cliente) {
    try {
        // Verificar se cliente já existe pelo WhatsApp
        const snapshot = await db.collection('clientes')
            .where('whatsapp', '==', cliente.whatsapp)
            .get();
        
        if (!snapshot.empty) {
            // Atualizar cliente existente
            const docId = snapshot.docs[0].id;
            await db.collection('clientes').doc(docId).update({
                ...cliente,
                ultimaVisita: new Date().toISOString()
            });
            return docId;
        } else {
            // Criar novo cliente
            const docRef = await db.collection('clientes').add({
                ...cliente,
                criadoEm: new Date().toISOString(),
                ultimaVisita: new Date().toISOString()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error('❌ Erro ao salvar cliente:', error);
        throw error;
    }
}

// Buscar estatísticas (Analytics)
async function buscarEstatisticas() {
    try {
        const [produtosSnap, pedidosSnap, clientesSnap] = await Promise.all([
            db.collection('produtos').get(),
            db.collection('pedidos').get(),
            db.collection('clientes').get()
        ]);

        return {
            totalProdutos: produtosSnap.size,
            totalPedidos: pedidosSnap.size,
            totalClientes: clientesSnap.size,
            pedidosPendentes: pedidosSnap.docs.filter(d => d.data().status === 'pendente').length
        };
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        return {
            totalProdutos: 0,
            totalPedidos: 0,
            totalClientes: 0,
            pedidosPendentes: 0
        };
    }
}

// ===== AUTENTICAÇÃO =====

// Login do Admin
async function loginAdmin(email, senha) {
    try {
        await auth.signInWithEmailAndPassword(email, senha);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Logout do Admin
async function logoutAdmin() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Verificar se está logado
function verificarAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(user => {
            resolve(user);
        });
    });
}

// ===== STORAGE (Imagens) =====

// Upload de imagem
async function uploadImagem(file, caminho) {
    try {
        const ref = storage.ref(caminho);
        const snapshot = await ref.put(file);
        const url = await snapshot.ref.getDownloadURL();
        return url;
    } catch (error) {
        console.error('❌ Erro ao fazer upload:', error);
        throw error;
    }
}

// Exportar funções
window.db = db;
window.auth = auth;
window.storage = storage;
window.analytics = analytics;
window.salvarProdutoFirebase = salvarProdutoFirebase;
window.buscarProdutosFirebase = buscarProdutosFirebase;
window.salvarPedidoFirebase = salvarPedidoFirebase;
window.salvarClienteFirebase = salvarClienteFirebase;
window.buscarEstatisticas = buscarEstatisticas;
window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;
window.verificarAuth = verificarAuth;
window.uploadImagem = uploadImagem;
