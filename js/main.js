// ============================================================
//  FUNÇÕES COMPARTILHADAS
// ============================================================

// ===== TEMA =====
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('nunes_theme', newTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = newTheme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function carregarTema() {
    const saved = localStorage.getItem('nunes_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = saved === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// ===== LOGO =====
function carregarLogo() {
    const logoImg = document.getElementById('logo-header');
    const logoSvg = document.getElementById('logo-svg');
    const logoSalva = localStorage.getItem('storeLogoDynamic');
    if (logoSalva && logoImg) {
        logoImg.src = logoSalva;
        logoImg.style.display = 'block';
        if (logoSvg) logoSvg.style.display = 'none';
    } else if (logoImg) {
        logoImg.style.display = 'none';
        if (logoSvg) logoSvg.style.display = 'block';
    }
}

// ===== NOTIFICAÇÕES =====
function mostrarNotificacao(mensagem, tipo = 'success') {
    const div = document.createElement('div');
    const cores = {
        success: 'bg-nunes text-dourado border-dourado/30',
        error: 'bg-red-600 text-white border-red-400',
        warning: 'bg-yellow-600 text-black border-yellow-400'
    };
    div.className = `fixed top-20 right-4 z-[999] px-6 py-3 rounded-xl shadow-lg border animate-fade-in text-sm font-bold ${cores[tipo] || cores.success}`;
    div.textContent = mensagem;
    document.body.appendChild(div);
    setTimeout(() => { div.style.opacity = '0'; div.style.transition = 'opacity 0.5s'; setTimeout(() => div.remove(), 500); }, 3000);
}

// ===== CONTATOS =====
function carregarContatos() {
    const contatos = JSON.parse(localStorage.getItem('nunes_contatos') || '{}');
    const wpp = contatos.wppVendas || '5538991500548';
    const insta = contatos.instagram || '@nunesgrife_';
    const config = JSON.parse(localStorage.getItem('nunes_config_loja') || '{}');
    const endereco = config.endereco || 'Rua Exemplo, 123 - Bairro Centro, Montes Claros - MG';
    
    document.querySelectorAll('[id="linkWhatsappVendas"]').forEach(el => el.href = `https://wa.me/${wpp.replace(/\D/g, '')}`);
    document.querySelectorAll('[id="linkInstagram"]').forEach(el => el.href = `https://instagram.com/${insta.replace('@', '')}`);
    document.querySelectorAll('[id="footerWhatsapp"]').forEach(el => el.href = `https://wa.me/${wpp.replace(/\D/g, '')}`);
    document.querySelectorAll('[id="footerInstagram"]').forEach(el => el.href = `https://instagram.com/${insta.replace('@', '')}`);
    document.querySelectorAll('[id="footerTelefone"]').forEach(el => el.textContent = `(${wpp})`);
    document.querySelectorAll('[id="footerEndereco"]').forEach(el => el.textContent = endereco);
}