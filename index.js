/* ==========================================================================
   pooreyoutuber.github.io - Interaction & Logic Layer
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initCopyrightYear();
  initMobileMenu();
  initHeaderScroll();
  initVideoTabs();
  initScrollAnimations();
  initStatsCounters();
  initVideoModal();
  initNewsletterForm();
});

/**
 * 1. Auto-update Copyright Year in Footer
 */
function initCopyrightYear() {
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

/**
 * 2. Mobile Menu Navigation Drawer Toggle
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      
      // Accessibility state toggle
      const isExpanded = navMenu.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', isExpanded);
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/**
 * 3. Header Scroll Visual Switch
 */
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Trigger initial state
}

/**
 * 4. Video Grid Tab Filters
 */
function initVideoTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const videoCards = document.querySelectorAll('.video-card');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active classes on tabs
      tabButtons.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-tab');

      // Filter video cards
      videoCards.forEach(card => {
        const category = card.getAttribute('data-category');
        
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          // Force a slight delay to trigger transitions
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300); // match CSS duration
        }
      });
    });
  });
}

/**
 * 5. Scroll Animations (Reveal Elements) & Active Navigation Linking
 */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  // Intersection Observer for scroll-reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Unobserve once revealed to maintain state
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // Scroll spy to highlight current active section link
  const scrollSpyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const activeId = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${activeId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    threshold: 0.5 // trigger when section occupies 50% of viewport
  });

  sections.forEach(sec => scrollSpyObserver.observe(sec));
}

/**
 * 6. Interactive Stats Counters (Count-up Animation)
 */
function initStatsCounters() {
  const counters = document.querySelectorAll('.stat-number');
  
  const animateCounter = (counter) => {
    const target = parseInt(counter.getAttribute('data-target'), 10);
    const duration = 2000; // 2 seconds
    const stepTime = 16; // Approx 60 FPS
    const steps = duration / stepTime;
    const increment = target / steps;
    let current = 0;

    const updateCount = () => {
      current += increment;
      if (current >= target) {
        counter.textContent = formatNumber(target);
      } else {
        counter.textContent = formatNumber(Math.floor(current));
        requestAnimationFrame(updateCount);
      }
    };
    
    updateCount();
  };

  // Helper to format values: 150000 -> 150K, 12400000 -> 12.4M
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Trigger counters when stats section is visible
  const statsSection = document.getElementById('stats');
  if (statsSection) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          counters.forEach(counter => animateCounter(counter));
          counterObserver.unobserve(statsSection);
        }
      });
    }, { threshold: 0.3 });

    counterObserver.observe(statsSection);
  }
}

/**
 * 7. Video Lightbox Modal Control
 */
function initVideoModal() {
  const modal = document.getElementById('video-lightbox');
  const iframe = document.getElementById('modal-player');
  const closeBtn = document.getElementById('modal-close-btn');
  const triggerButtons = document.querySelectorAll('[data-video-id]');

  const openModal = (videoId) => {
    if (!modal || !iframe) return;
    // Embed URL formatting with autoplay parameters
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.setAttribute('src', embedUrl);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scroll
  };

  const closeModal = () => {
    if (!modal || !iframe) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('src', ''); // Stop playback
    document.body.style.overflow = ''; // Restore scroll
  };

  // Bind to all watch/play triggers
  triggerButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const videoId = btn.getAttribute('data-video-id') || 'dQw4w9WgXcQ';
      openModal(videoId);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Click outside to close modal
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC key close support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }
}

/**
 * 8. Newsletter Email Form Simulation
 */
function initNewsletterForm() {
  const form = document.getElementById('newsletter-email-form');
  const input = document.getElementById('newsletter-email-input');
  const feedback = document.getElementById('newsletter-feedback');

  if (form && input && feedback) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = input.value.trim();
      
      // Simple UI loader simulation
      feedback.className = 'form-feedback';
      feedback.textContent = 'Submitting...';
      feedback.style.display = 'block';
      
      setTimeout(() => {
        if (validateEmail(email)) {
          // Log locally
          saveSubscriberLocal(email);
          
          feedback.textContent = 'Welcome to the Club! Check your inbox for secret updates.';
          feedback.classList.add('success');
          form.reset();
        } else {
          feedback.textContent = 'Please enter a valid email address.';
          feedback.classList.add('error');
        }
      }, 800);
    });
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
  }

  function saveSubscriberLocal(email) {
    try {
      let subscribers = JSON.parse(localStorage.getItem('creators_club_subscribers')) || [];
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('creators_club_subscribers', JSON.stringify(subscribers));
      }
      console.log('Successfully subscribed:', email);
      console.log('All local subscribers:', subscribers);
    } catch (e) {
      console.error('Failed to log subscriber locally', e);
    }
  }
}
