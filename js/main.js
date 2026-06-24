// ============================================================
//  MAIN.JS — FUNÇÕES COMPARTILHADAS
//  Usado por: index.html e admin.html
// ============================================================

// ===== TEMA CLARO / ESCURO =====
function toggleTheme() {
    var html = document.documentElement;
    var atual = html.getAttribute('data-theme');
    var novo = (atual === 'light') ? 'dark' : 'light';
    html.setAttribute('data-theme', novo);
    localStorage.setItem('nunes_theme', novo);
    _atualizarIconeTema(novo);
}

function carregarTema() {
    var salvo = localStorage.getItem('nunes_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', salvo);
    _atualizarIconeTema(salvo);
}

function _atualizarIconeTema(tema) {
    var icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = (tema === 'light') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

// ===== LOGO DINÂMICA =====
function carregarLogo() {
    var logoImg = document.getElementById('logo-header');
    var logoSvg = document.getElementById('logo-svg');
    var logoSalva = localStorage.getItem('storeLogoDynamic');
    if (logoSalva && logoImg) {
        logoImg.src = logoSalva;
        logoImg.style.display = 'block';
        if (logoSvg) logoSvg.style.display = 'none';
    } else if (logoImg) {
        logoImg.style.display = 'none';
        if (logoSvg) logoSvg.style.display = 'block';
    }
}

// ===== NOTIFICAÇÕES (Toast flutuante) =====
function mostrarNotificacao(mensagem, tipo) {
    tipo = tipo || 'success';
    var cores = {
        success: 'background:#0a0a0a;color:#D4AF37;border-color:rgba(212,175,55,0.4);',
        error:   'background:#7f1d1d;color:#fca5a5;border-color:#ef4444;',
        warning: 'background:#78350f;color:#fde68a;border-color:#f59e0b;',
        info:    'background:#1e3a5f;color:#93c5fd;border-color:#3b82f6;'
    };
    var estilo = cores[tipo] || cores.success;
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:80px;right:16px;z-index:9999;padding:12px 20px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.35);border:1px solid;font-size:13px;font-weight:700;font-family:inherit;max-width:320px;word-break:break-word;pointer-events:none;transition:opacity 0.4s,transform 0.4s;opacity:0;transform:translateY(-8px);' + estilo;
    div.textContent = mensagem;
    document.body.appendChild(div);

    // Animar entrada
    requestAnimationFrame(function() {
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
    });

    // Animar saída e remover
    setTimeout(function() {
        div.style.opacity = '0';
        div.style.transform = 'translateY(-8px)';
        setTimeout(function() { if (div.parentNode) div.parentNode.removeChild(div); }, 400);
    }, 3200);
}

// ===== CONTATOS (preenche links dinâmicos) =====
function carregarContatos() {
    var contatos = {};
    var config = {};
    try { contatos = JSON.parse(localStorage.getItem('nunes_contatos') || '{}'); } catch(e) {}
    try { config   = JSON.parse(localStorage.getItem('nunes_config_loja') || '{}'); } catch(e) {}

    var wpp      = (contatos.wppVendas  || '5538991500548').replace(/\D/g, '');
    var insta    = (contatos.instagram  || '@nunesgrife_').replace('@', '');
    var email    = contatos.email       || 'iagonunez08@icloud.com';
    var endereco = config.endereco      || 'Rua Antônio Martins Nº 205, Santos Reis, Montes Claros - MG';
    var telefone = contatos.wppVendas   || '(38) 9 9150-0548';

    // Links de WhatsApp (múltiplos elementos suportados)
    document.querySelectorAll('#linkWhatsappVendas, #footerWhatsapp').forEach(function(el) {
        el.href = 'https://wa.me/' + wpp;
    });

    // Links de Instagram
    document.querySelectorAll('#linkInstagram, #footerInstagram').forEach(function(el) {
        el.href = 'https://instagram.com/' + insta;
    });

    // Textos do rodapé
    var elTel = document.getElementById('footerTelefone');
    if (elTel) elTel.textContent = telefone;

    var elEnd = document.getElementById('footerEndereco');
    if (elEnd) elEnd.textContent = endereco;

    var elEmail = document.getElementById('footerEmail');
    if (elEmail) elEmail.textContent = email;

    var elEmailRodape = document.getElementById('footerEmailRodape');
    if (elEmailRodape) elEmailRodape.textContent = email;
}