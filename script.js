'use strict';

(() => {
    const root = document.documentElement;
    root.classList.add('js');

    const header = document.getElementById('main-header');
    const backToTopBtn = document.getElementById('back-to-top');
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.getElementById('nav-menu');
    const desktopQuery = window.matchMedia('(min-width: 1200px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ==========================================
    // CHEGOU COM ÂNCORA (ex.: /#proteses vindo de outra página)
    // Garante que a página desça até a seção, mesmo com imagens carregando.
    // ==========================================
    const goToHash = () => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!/^[a-z0-9-]+$/i.test(id)) return;
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
    };

    if (window.location.hash) {
        window.requestAnimationFrame(goToHash);
        window.addEventListener('load', goToHash, { once: true });
    }

    // ==========================================
    // MENU MOBILE (HAMBÚRGUER)
    // ==========================================
    const setMenu = (open) => {
        if (!navMenu || !menuToggle) return;
        navMenu.classList.toggle('is-active', open);
        menuToggle.classList.toggle('is-active', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        document.body.classList.toggle('menu-open', open);
    };

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            setMenu(!navMenu.classList.contains('is-active'));
        });

        // Fecha ao clicar em um link
        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setMenu(false));
        });

        // Fecha com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('is-active')) {
                setMenu(false);
                menuToggle.focus();
            }
        });

        // Fecha ao clicar fora
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('is-active') &&
                !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                setMenu(false);
            }
        });

        // Fecha se a tela virar desktop
        desktopQuery.addEventListener('change', (e) => {
            if (e.matches) setMenu(false);
        });
    }

    // ==========================================
    // SCROLL: HEADER E BOTÃO TOPO (otimizado)
    // ==========================================
    let ticking = false;
    const onScroll = () => {
        const y = window.scrollY;
        if (header) header.classList.toggle('scrolled', y > 50);
        if (backToTopBtn) backToTopBtn.classList.toggle('show', y > 500);
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
    // Primeira leitura no próximo quadro (evita recálculo de layout forçado na abertura)
    window.requestAnimationFrame(onScroll);

    // Pausa as animações infinitas das seções fora da tela
    if ('IntersectionObserver' in window) {
        const animIO = new IntersectionObserver((entries) => {
            entries.forEach((en) => en.target.classList.toggle('anim-off', !en.isIntersecting));
        }, { rootMargin: '100px 0px' });
        document.querySelectorAll('main > section, footer').forEach((s) => animIO.observe(s));
    }

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        });
    }

    // ==========================================
    // ANIMAÇÃO AO ROLAR (reveal)
    // ==========================================
    // Depois que a animação de entrada termina, a classe sai
    // para não "travar" o transform dos hovers dos cards.
    const finishReveal = (el) => {
        el.classList.add('is-visible');
        window.setTimeout(() => el.classList.remove('reveal', 'is-visible'), 800);
    };

    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion.matches) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    finishReveal(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach((el) => io.observe(el));
    } else {
        reveals.forEach((el) => el.classList.remove('reveal'));
    }

    // ==========================================
    // CONTADOR DE CLIQUES SEM COOKIES (Umami Cloud)
    // Cole o "Website ID" do painel do Umami abaixo para ativar.
    // Vazio = nada é carregado e nenhum dado sai do site.
    // ==========================================
    const UMAMI_WEBSITE_ID = '';
    const UMAMI_SCRIPT = 'https://cloud.umami.is/script.js';

    if (/^[0-9a-f-]{36}$/i.test(UMAMI_WEBSITE_ID)) {
        const s = document.createElement('script');
        s.src = UMAMI_SCRIPT;
        s.defer = true;
        s.dataset.websiteId = UMAMI_WEBSITE_ID;
        s.dataset.doNotTrack = 'true';
        document.head.appendChild(s);
    }

    // Registra cliques em WhatsApp, telefone, Instagram e rota,
    // com a seção de onde veio o clique (ex.: "inicio", "contato").
    const trackEvent = (name, data) => {
        if (window.umami && typeof window.umami.track === 'function') {
            window.umami.track(name, data);
        }
    };

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        const origem = link.closest('section, header, footer, .mobile-cta, .floating-buttons');
        const local = origem ? (origem.id || origem.className.split(' ')[0]) : 'pagina';

        if (href.startsWith('https://wa.me/')) trackEvent('WhatsApp', { local });
        else if (href.startsWith('tel:')) trackEvent('Telefone', { local });
        else if (href.includes('instagram.com')) trackEvent('Instagram', { local });
        else if (href.includes('google.com/maps')) trackEvent('Rota no Maps', { local });
    }, { capture: true });

    // ==========================================
    const mapBtn = document.getElementById('map-load');
    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            const src = mapBtn.dataset.src || '';
            let url;
            try {
                url = new URL(src);
            } catch {
                return;
            }
            if (url.protocol !== 'https:' || url.hostname !== 'www.google.com') return;

            const iframe = document.createElement('iframe');
            iframe.src = url.href;
            iframe.title = 'Mapa do consultório do Dr. Lucas H. Lima em Araraquara';
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.setAttribute('allowfullscreen', '');
            mapBtn.replaceWith(iframe);
        }, { once: true });
    }

    // ==========================================
    // CASOS: VISUALIZADOR AMPLIADO (antes e depois)
    // Só aceita imagens locais e links do Instagram.
    // ==========================================
    const dialog = document.getElementById('case-dialog');
    const grid = document.getElementById('cases-grid');
    if (dialog && grid && typeof dialog.showModal === 'function') {
        const dImg = document.getElementById('case-dialog-img');
        const dTitle = document.getElementById('case-dialog-title');
        const dDesc = document.getElementById('case-dialog-desc');
        const dInsta = document.getElementById('case-dialog-insta');
        let lastTrigger = null;

        const isLocalImg = (v) => /^(?:\.\.\/)*\/?img\/casos\/[a-z0-9-]+\.webp$/.test(v);
        const isInsta = (v) => /^https:\/\/www\.instagram\.com\/p\/[A-Za-z0-9_-]+\/$/.test(v);

        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.case-open');
            if (!btn) return;
            const full = btn.dataset.full || '';
            if (!isLocalImg(full)) return;

            lastTrigger = btn;
            dImg.src = full;
            dImg.alt = btn.querySelector('img')?.alt || '';
            dTitle.textContent = btn.dataset.title || '';
            dDesc.textContent = btn.dataset.desc || '';
            dInsta.href = isInsta(btn.dataset.insta || '') ? btn.dataset.insta : 'https://www.instagram.com/drlucashlima/';
            dialog.showModal();
            document.body.classList.add('dialog-open');
        });

        document.getElementById('case-close')?.addEventListener('click', () => dialog.close());

        // Fecha ao clicar fora da imagem
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.close();
        });

        dialog.addEventListener('close', () => {
            document.body.classList.remove('dialog-open');
            if (lastTrigger) lastTrigger.focus();
        });
    }

    // ==========================================
    // ANO AUTOMÁTICO NO RODAPÉ
    // ==========================================
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
})();
