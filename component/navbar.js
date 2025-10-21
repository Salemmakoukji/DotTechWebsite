class CustomNavbar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        nav {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(8px);
        }
        
        .logo {
          color: #111827;
          font-weight: bold;
          font-size: 1.5rem;
          font-family: 'Inter', sans-serif;
        }
        
        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
          align-items: center;
        }
        
        .nav-link {
          color: #374151;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .nav-link:hover {
          color: #111827;
        }
        
        .cart-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }
        
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
        }
        
        .mobile-menu {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: white;
          z-index: 50;
          padding: 2rem;
        }
        
        .mobile-menu.active {
          display: block;
        }
        
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          
          .mobile-menu-btn {
            display: block;
          }
        }
      </style>
      
      <nav>
        <a href="index.html" class="logo">DotTech</a>
        
        <ul class="nav-links">
          <li><a href="index.html" class="nav-link">Home</a></li>
          <li><a href="shop.html" class="nav-link">Shop</a></li>
          <li><a href="services.html" class="nav-link">Services</a></li>
          <li><a href="about.html" class="nav-link">About</a></li>
          <li><a href="contact.html" class="nav-link">Contact</a></li>
          <li class="cart-container">
            <a href="cart.html" class="nav-link flex items-center gap-1">
              <i data-feather="shopping-cart"></i>
              <span id="cart-badge" class="cart-badge hidden">0</span>
          </li>
        </ul>
        
        <button class="mobile-menu-btn">
          <i data-feather="menu"></i>
        </button>
        
        <div class="mobile-menu">
          <div class="flex justify-between items-center mb-8">
            <a href="index.html" class="logo">DotTech</a>
          <button class="close-menu">
            <i data-feather="x"></i>
          </button>
          <ul class="space-y-4">
            <li><a href="index.html" class="nav-link text-lg">Home</a></li>
          <li><a href="shop.html" class="nav-link text-lg">Shop</a></li>
          <li><a href="services.html" class="nav-link text-lg">Services</a></li>
          <li><a href="about.html" class="nav-link text-lg">About</a></li>
          <li><a href="contact.html" class="nav-link text-lg">Contact</a></li>
          <li><a href="cart.html" class="nav-link text-lg flex items-center gap-2">
              Cart <span id="mobile-cart-badge" class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">0</span>
          </a></li>
          </ul>
        </div>
      </nav>
      
      <script>
        feather.replace();
        
        // Mobile menu functionality
        const mobileMenuBtn = this.shadowRoot.querySelector('.mobile-menu-btn');
        const mobileMenu = this.shadowRoot.querySelector('.mobile-menu');
        const closeMenuBtn = this.shadowRoot.querySelector('.close-menu');
        
        mobileMenuBtn?.addEventListener('click', () => {
          mobileMenu.classList.add('active');
          feather.replace();
        });
        
        closeMenuBtn?.addEventListener('click', () => {
          mobileMenu.classList.remove('active');
        });
      </script>
    `;
  }
}

customElements.define('custom-navbar', CustomNavbar);
