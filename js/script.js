/* =========================================================================
   JAVASCRIPT
   Organizado em módulos independentes: cursor, tema, parallax, reveal de
   texto, scroll pinning horizontal e scroll reveal da galeria.
   ========================================================================= */
(function(){
  "use strict";

  document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    const header = document.querySelector('header');
    const body = document.body;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!splash || reduceMotion) {
      // If no splash screen or user prefers reduced motion, just show the site immediately.
      if(splash) splash.classList.add('hidden');
      if(header) header.classList.add('visible');
      return;
    }
    
    // Lock scroll initially
    body.style.overflow = 'hidden';

    const revealSite = () => {
      splash.classList.add('hidden');
      header.classList.add('visible');
      body.style.overflow = ''; // Restore scroll

      // Clean up the event listener
      window.removeEventListener('wheel', handleFirstScroll);
    };

    const handleFirstScroll = (event) => {
      // Check for a downward scroll action
      if (event.deltaY > 0) {
        revealSite();
      }
    };
    
    // Listen for the first mouse wheel event to trigger the transition
    window.addEventListener('wheel', handleFirstScroll);
  });


  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ------------------------------------------------------------------
     1. CURSOR CUSTOMIZADO
     Gera um rastro de partículas "smoke" e alterna para um anel
     "hollow" ao passar por cima de elementos interativos.
     ------------------------------------------------------------------ */
  if (!isTouch && !reduceMotion) {
    const ring = document.getElementById('cursor-ring');
    const trailContainer = document.getElementById('cursor-trail');
    const hoverables = document.querySelectorAll('.hoverable, a, button, .journey-card, .bento-item');

    // Esconde o cursor de anel por padrão
    ring.style.opacity = '0';
    ring.style.transition = 'opacity 0.3s ease';

    // Lógica para o anel que aparece no hover
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    const EASE = 0.16;

    function animateRing() {
      ringX += (mouseX - ringX) * EASE;
      ringY += (mouseY - ringY) * EASE;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);

    // Lógica do rastro de fumaça
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Cria partículas de fumaça apenas se não estiver sobre um hoverable
      if (trailContainer.style.display !== 'none') {
        const smoke = document.createElement('div');
        smoke.className = 'smoke';
        trailContainer.appendChild(smoke);
        smoke.style.left = e.clientX + 'px';
        smoke.style.top = e.clientY + 'px';
        setTimeout(() => {
          if(trailContainer.contains(smoke)){
            trailContainer.removeChild(smoke);
          }
        }, 1000); // Duração da animação da fumaça
      }
    });

    // Alterna a visibilidade do rastro e do anel
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.style.opacity = '1';
        trailContainer.style.display = 'none';
      });
      el.addEventListener('mouseleave', () => {
        ring.style.opacity = '0';
        trailContainer.style.display = '';
      });
    });

    // Remove o dot original, já que não é mais necessário
    const dot = document.getElementById('cursor-dot');
    if(dot) dot.remove();
  }

  /* ------------------------------------------------------------------
     2. TOGGLE DE TEMA (botão "janela")
     Alterna o atributo data-theme na <html>; as variáveis CSS cuidam
     do resto, incluindo a transição suave de cores em toda a página.
     ------------------------------------------------------------------ */
  const html = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  // Define o tema inicial (dark por padrão, respeitando escolha anterior)
  const savedTheme = null; // (sem localStorage neste ambiente de preview)
  html.setAttribute('data-theme', savedTheme || 'dark');

  themeToggle.addEventListener('click', ()=>{
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  });

  /* ------------------------------------------------------------------
     3. PARALLAX NO HERO
     As camadas de fundo (blobs) se deslocam mais devagar que o scroll
     real, criando profundidade. Só ativo enquanto o hero está visível.
     ------------------------------------------------------------------ */
  const heroParallax = document.getElementById('heroParallax');
  const heroImage = document.querySelector('.hero-image-container');
  
  // A função de parallax do hero continua, mas apenas para o hero.
  function updateHeroParallax(){
    if(reduceMotion) return;
    const heroSection = document.querySelector('.hero');
    const rect = heroSection.getBoundingClientRect();
    if(rect.bottom < 0 || rect.top > window.innerHeight) return; 

    const scrolled = window.scrollY;
    heroParallax.style.transform = `translate3d(0, ${scrolled * 0.35}px, 0)`; // Increased from 0.35 to 0.7
    if(heroImage) {
      heroImage.style.transform = `translate3d(0, ${scrolled * 0.2}px, 0)`; // Increased from 0.2 to 0.4
    }
  }

  /* ------------------------------------------------------------------
     4. SCROLL PINNING HORIZONTAL — SEÇÃO "JORNADA"
     E LÓGICA DE CONTINUAÇÃO DO PARALLAX
     ------------------------------------------------------------------ */
  const journeyWrap = document.getElementById('journeyWrap');
  const journeyTrack = document.getElementById('journeyTrack');
  const journeyCards = document.querySelectorAll('.journey-card');
  const parallaxContinuation = document.getElementById('parallaxContinuation');

  function updateJourney(){
    const rect = journeyWrap.getBoundingClientRect();
    const wrapHeight = journeyWrap.offsetHeight;
    const viewportH = window.innerHeight;
    const scrollable = wrapHeight - viewportH;
    
    let progress = -rect.top / scrollable;
    progress = Math.max(0, Math.min(1, progress));

    // Lógica para mostrar a continuação do parallax
    if (progress >= 1) {
        parallaxContinuation.classList.add('visible');
    } else {
        parallaxContinuation.classList.remove('visible');
    }

    const trackWidth = journeyTrack.scrollWidth;
    const maxTranslate = Math.max(0, trackWidth - window.innerWidth);

    journeyTrack.style.transform = `translate3d(${-progress * maxTranslate}px, 0, 0)`;

    journeyCards.forEach(card=>{
      const cardRect = card.getBoundingClientRect();
      if(cardRect.left < window.innerWidth * 0.85){
        card.classList.add('visible');
      }
    });
  }

  /* ------------------------------------------------------------------
     5. EFEITO PARALLAX NA CONTINUAÇÃO
     ------------------------------------------------------------------ */
  function updateParallaxContinuation() {
    if (reduceMotion) return;
    
    const rect = parallaxContinuation.getBoundingClientRect();
    
    // Otimização: só calcula se estiver visível
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / (window.innerHeight + rect.height);
    const translateY = -progress * 400; // Ajuste este valor para mais ou menos parallax

    parallaxContinuation.style.setProperty('--translateY-parallax', `${translateY}px`);
  }

  /* ------------------------------------------------------------------
     6. SCROLL REVEAL — GALERIA BENTO
     IntersectionObserver aplica classes de animação quando os itens
     entram no viewport.
     ------------------------------------------------------------------ */
  const bentoItems = document.querySelectorAll('.bento-item');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Alterna a animação entre esquerda e direita
        const animationClass = index % 2 === 0 ? 'slide-in-left' : 'slide-in-right';
        entry.target.classList.add(animationClass);
        
        // Deixa de observar o elemento após a animação
        observer.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.2, // A animação começa quando 20% do item está visível
    rootMargin: "0px 0px -50px 0px" // Começa a animar um pouco antes de estar totalmente na tela
  });

  bentoItems.forEach(item => {
    revealObserver.observe(item);
  });

  /* ------------------------------------------------------------------
     7. EFEITO DE MOVIMENTO 3D NO PARALLAX DE CONTINUAÇÃO
     ------------------------------------------------------------------ */
  const parallaxContinuationSection = document.querySelector('.parallax-bg-continuation');
  if (parallaxContinuationSection && !isTouch && !reduceMotion) {
    parallaxContinuationSection.addEventListener('mousemove', (e) => {
      const rect = parallaxContinuationSection.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

      const rotateY = mouseX * 10; // Rotação máxima de 5 graus no eixo Y
      const rotateX = -mouseY * 10; // Rotação máxima de 5 graus no eixo X
      const translateX = mouseX * 20; // Movimento máximo de 10px no eixo X
      const translateY = mouseY * 20; // Movimento máximo de 10px no eixo Y

      requestAnimationFrame(() => {
        parallaxContinuationSection.style.setProperty('--rotateX', `${rotateX}deg`);
        parallaxContinuationSection.style.setProperty('--rotateY', `${rotateY}deg`);
        parallaxContinuationSection.style.setProperty('--translateX', `${translateX}px`);
        parallaxContinuationSection.style.setProperty('--translateY', `${translateY}px`);
      });
    });

    parallaxContinuationSection.addEventListener('mouseleave', () => {
      requestAnimationFrame(() => {
        parallaxContinuationSection.style.setProperty('--rotateX', '0deg');
        parallaxContinuationSection.style.setProperty('--rotateY', '0deg');
        parallaxContinuationSection.style.setProperty('--translateX', '0px');
        parallaxContinuationSection.style.setProperty('--translateY', '0px');
      });
    });
  }

  /* ------------------------------------------------------------------
     8. LOOP DE SCROLL (rAF) — agrupa os cálculos de parallax e jornada
     em um único requestAnimationFrame para melhor performance.
     ------------------------------------------------------------------ */
  let ticking = false;
  function onScroll(){
    if(!ticking){
      requestAnimationFrame(()=>{
        updateHeroParallax(); // Renomeado para clareza
        updateJourney();
        updateParallaxContinuation();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  onScroll(); // estado inicial

})();

/* =========================================================================
   9. LIGHTBOX PARA GALERIA
   ========================================================================= */
(function(){
  "use strict";
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxImg = document.getElementById('lightbox-img');
  const galleryItems = document.querySelectorAll('.bento-item');
  const closeBtn = document.querySelector('.lightbox-close');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const imgElement = item.querySelector('img');
      if (imgElement) {
        lightbox.style.display = 'block';
        lightboxImg.src = imgElement.src;
      }
    });
  });

  function closeLightbox() {
    lightbox.style.display = 'none';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  lightbox.addEventListener('click', (e) => {
    // Fecha se clicar no fundo (fora da imagem)
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

})();
