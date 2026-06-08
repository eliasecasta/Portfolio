/* ========================================
   NEON PORTFOLIO - JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all features
  initParticles();
  initTypewriter();
  initScrollAnimations();
  initNavbar();
  initMobileMenu();
  initSmoothScroll();
  initContactForm();
});

/* ========================================
   PARTICLES.JS - Animated Background
   ======================================== */
function initParticles() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: {
          value: 60,
          density: {
            enable: true,
            value_area: 1000
          }
        },
        color: {
          value: ['#00f5ff', '#00c4cc', '#7fffff']
        },
        shape: {
          type: 'circle'
        },
        opacity: {
          value: 0.4,
          random: true,
          anim: {
            enable: true,
            speed: 0.5,
            opacity_min: 0.1,
            sync: false
          }
        },
        size: {
          value: 2,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            size_min: 0.5,
            sync: false
          }
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#00f5ff',
          opacity: 0.15,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.8,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
          attract: {
            enable: true,
            rotateX: 600,
            rotateY: 1200
          }
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: true,
            mode: 'grab'
          },
          onclick: {
            enable: true,
            mode: 'push'
          },
          resize: true
        },
        modes: {
          grab: {
            distance: 140,
            line_linked: {
              opacity: 0.5
            }
          },
          push: {
            particles_nb: 3
          }
        }
      },
      retina_detect: true
    });
  }
}

/* ========================================
   TYPEWRITER EFFECT
   ======================================== */
function initTypewriter() {
  const phrases = [
    'Full Stack Developer',
    'Ruby on Rails Expert',
    'React & Next.js Specialist',
    'Clean Code Advocate',
    'AI-Enhanced Solutions'
  ];
  
  const typewriterElement = document.querySelector('.typewriter-text');
  if (!typewriterElement) return;
  
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;
  
  function type() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
      typewriterElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50;
    } else {
      typewriterElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100;
    }
    
    if (!isDeleting && charIndex === currentPhrase.length) {
      isDeleting = true;
      typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500; // Pause before next phrase
    }
    
    setTimeout(type, typeSpeed);
  }
  
  type();
}

/* ========================================
   SCROLL ANIMATIONS
   ======================================== */
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        
        // Don't unobserve - allows re-animation if needed
        // observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe all elements with data-animate attribute
  const animatedElements = document.querySelectorAll('[data-animate]');
  animatedElements.forEach(el => observer.observe(el));
}

/* ========================================
   NAVBAR BEHAVIOR
   ======================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  
  // Add scrolled class on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    // Update active nav link based on scroll position
    updateActiveNavLink();
  });
  
  function updateActiveNavLink() {
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  
  // Initial check
  updateActiveNavLink();
}

/* ========================================
   MOBILE MENU
   ======================================== */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (!hamburger || !navMenu) return;
  
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  });
  
  // Close menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ========================================
   SMOOTH SCROLL
   ======================================== */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Skip if it's just "#"
      if (href === '#') return;
      
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = target.offsetTop - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ========================================
   CONTACT FORM
   ======================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;
    
    // Collect form data
    const formData = new FormData(form);
    
    try {
      // Submit to Formspree via AJAX
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        // Show success message
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        form.reset();
      } else {
        const data = await response.json();
        if (data.errors) {
          showNotification(data.errors.map(e => e.message).join(', '), 'error');
        } else {
          showNotification('Something went wrong. Please try again or contact me via LinkedIn.', 'error');
        }
      }
    } catch (error) {
      showNotification('Network error. Please try again or contact me via LinkedIn.', 'error');
    } finally {
      // Restore button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

/* ========================================
   NOTIFICATIONS
   ======================================== */
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    background: ${type === 'success' ? 'rgba(0, 245, 255, 0.9)' : type === 'error' ? 'rgba(255, 87, 87, 0.9)' : 'rgba(100, 100, 100, 0.9)'};
    color: ${type === 'success' ? '#0a0a0a' : '#ffffff'};
    padding: 15px 25px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
  `;
  
  // Add animation keyframes if not already added
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/* ========================================
   PERFORMANCE OPTIMIZATIONS
   ======================================== */

// Lazy load images when they come into view
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});

// Debounce scroll events for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Apply debounce to scroll-heavy operations
const debouncedScrollHandler = debounce(() => {
  // Any scroll-dependent operations can go here
}, 100);

window.addEventListener('scroll', debouncedScrollHandler);

/* ========================================
   CONSOLE EASTER EGG
   ======================================== */
console.log('%c👋 Hey there, fellow developer!', 'font-size: 20px; font-weight: bold; color: #00f5ff;');
console.log('%cInterested in the code? Check out my GitHub: https://github.com/eliasecasta', 'font-size: 14px; color: #a0a0a0;');
console.log('%cThis portfolio was crafted with clean code and modern web standards.', 'font-size: 12px; color: #666;');
