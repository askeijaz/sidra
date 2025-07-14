// Modern JavaScript for Hugo Site
class SiteManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupSearch();
        this.setupAnimations();
        this.setupLazyLoading();
        this.setupShareButtons();
        this.setupNewsletterForm();
        this.setupScrollToTop();
        this.setupKeyboardNavigation();
    }

    // Navigation
    setupNavigation() {
        const navToggle = document.querySelector('.navbar-toggle');
        const navMenu = document.querySelector('.navbar-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('active');
                document.body.classList.toggle('nav-open');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navToggle.setAttribute('aria-expanded', 'false');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('nav-open');
                }
            });
        }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Theme Toggle
    setupThemeToggle() {
        const themeToggle = document.querySelector('[data-theme-toggle]');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Get saved theme or default to system preference
        let currentTheme = localStorage.getItem('theme') || 
                          (prefersDark.matches ? 'dark' : 'light');
        
        this.setTheme(currentTheme);

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                currentTheme = currentTheme === 'light' ? 'dark' : 'light';
                this.setTheme(currentTheme);
                localStorage.setItem('theme', currentTheme);
            });
        }

        // Listen for system theme changes
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', 
                theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            );
        }
    }

    // Search Functionality
    setupSearch() {
        const searchToggle = document.querySelector('[data-search-toggle]');
        const searchModal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const searchClose = document.querySelectorAll('[data-search-close]');
        
        let searchIndex = [];
        let searchTimeout;

        // Load search index
        this.loadSearchIndex().then(index => {
            searchIndex = index;
        });

        if (searchToggle && searchModal) {
            searchToggle.addEventListener('click', () => {
                this.openSearch();
            });

            searchClose.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeSearch();
                });
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchModal.classList.contains('active')) {
                    this.closeSearch();
                }
            });

            // Search input
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.performSearch(e.target.value, searchIndex, searchResults);
                    }, 300);
                });
            }
        }

        // Keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }
        });
    }

    async loadSearchIndex() {
        try {
            const response = await fetch('/index.json');
            return await response.json();
        } catch (error) {
            console.error('Failed to load search index:', error);
            return [];
        }
    }

    openSearch() {
        const searchModal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input');
        
        if (searchModal) {
            searchModal.classList.add('active');
            searchModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('search-open');
            
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }

    closeSearch() {
        const searchModal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input');
        
        if (searchModal) {
            searchModal.classList.remove('active');
            searchModal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('search-open');
            
            if (searchInput) {
                searchInput.value = '';
                this.clearSearchResults();
            }
        }
    }

    performSearch(query, searchIndex, resultsContainer) {
        if (!query.trim() || !searchIndex.length) {
            this.clearSearchResults();
            return;
        }

        const results = searchIndex.filter(item => {
            const searchText = `${item.title} ${item.content} ${item.tags || ''}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        }).slice(0, 10);

        this.displaySearchResults(results, query, resultsContainer);
    }

    displaySearchResults(results, query, container) {
        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        const resultsHTML = results.map(result => {
            const highlightedTitle = this.highlightText(result.title, query);
            const highlightedContent = this.highlightText(
                result.content.substring(0, 150) + '...', 
                query
            );

            return `
                <div class="search-result" data-url="${result.url}">
                    <h4>${highlightedTitle}</h4>
                    <p>${highlightedContent}</p>
                </div>
            `;
        }).join('');

        container.innerHTML = resultsHTML;

        // Add click handlers
        container.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => {
                window.location.href = result.dataset.url;
            });
        });
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    clearSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = '<div class="search-empty"><p>Start typing to search...</p></div>';
        }
    }

    // Animations
    setupAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, observerOptions);

        // Observe elements with animation classes
        document.querySelectorAll('.fade-in-on-scroll, .slide-in-left-on-scroll, .slide-in-right-on-scroll')
            .forEach(el => observer.observe(el));
    }

    // Lazy Loading
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
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
        }
    }

    // Share Buttons
    setupShareButtons() {
        const shareToggle = document.querySelector('[data-share-toggle]');
        const shareSection = document.getElementById('post-share');
        const copyButton = document.querySelector('[data-copy-url]');

        if (shareToggle && shareSection) {
            shareToggle.addEventListener('click', () => {
                shareSection.scrollIntoView({ behavior: 'smooth' });
            });
        }

        if (copyButton) {
            copyButton.addEventListener('click', async () => {
                const url = copyButton.dataset.copyUrl;
                try {
                    await navigator.clipboard.writeText(url);
                    this.showToast('Link copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy:', err);
                    this.showToast('Failed to copy link');
                }
            });
        }
    }

    // Newsletter Form
    setupNewsletterForm() {
        const forms = document.querySelectorAll('.newsletter-form');
        
        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = form.querySelector('input[type="email"]').value;
                
                // Simulate newsletter signup
                this.showToast('Thank you for subscribing!');
                form.reset();
            });
        });
    }

    // Scroll to Top
    setupScrollToTop() {
        const scrollButton = document.createElement('button');
        scrollButton.className = 'scroll-to-top';
        scrollButton.innerHTML = '↑';
        scrollButton.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(scrollButton);

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollButton.classList.add('visible');
            } else {
                scrollButton.classList.remove('visible');
            }
        });

        scrollButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Keyboard Navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input
            if (e.target.matches('input, textarea, select')) return;

            switch (e.key) {
                case '/':
                    e.preventDefault();
                    this.openSearch();
                    break;
            }
        });
    }

    // Toast Notifications
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SiteManager();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}