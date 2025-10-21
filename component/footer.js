class CustomFooter extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        footer {
          background: #111827;
          color: white;
          padding: 3rem 2rem;
        }
        
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }
        
        .footer-section h3 {
          font-weight: 600;
          margin-bottom: 1rem;
          font-family: 'Inter', sans-serif;
        }
        
        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-section li {
          margin-bottom: 0.5rem;
        }
        
        .footer-section a {
          color: #9ca3af;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .footer-section a:hover {
          color: white;
        }
        
        .social-links {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .social-links a {
          color: #9ca3af;
          transition: color 0.2s;
        }
        
        .social-links a:hover {
          color: white;
        }
        
        .footer-bottom {
          border-top: 1px solid #374151;
          margin-top: 2rem;
          padding-top: 2rem;
          text-align: center;
          color: #9ca3af;
        }
      </style>
      
      <footer>
        <div class="footer-content">
          <div class="footer-section">
            <h3>DotTech</h3>
            <p>Tech made simple, reliable, and affordable.</p>
            <div class="social-links">
              <a href="#"><i data-feather="facebook"></i></a>
              <a href="#"><i data-feather="twitter"></i></a>
              <a href="#"><i data-feather="instagram"></i></a>
            </div>
          </div>
          
          <div class="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="shop.html">Shop</a></li>
              <li><a href="services.html">Services</a></li>
              <li><a href="about.html">About</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3>Contact</h3>
            <ul>
              <li><a href="tel:+963995505694">+963 995 505 694</a></li>
              <li><a href="mailto:info@dottech-sy.com">info@dottech-sy.com</a></li>
              <li><a href="https://wa.me/963995505694">WhatsApp</a></li>
              <li><a href="contact.html">Location</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h3>Categories</h3>
            <ul>
              <li><a href="shop.html?category=Laptops">Laptops</a></li>
              <li><a href="shop.html?category=Parts">Parts</a></li>
              <li><a href="shop.html?category=Accessories">Accessories</a></li>
              <li><a href="shop.html?category=Software">Software</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2025 DotTech. All rights reserved.</p>
        </div>
      </footer>
      
      <script>
        feather.replace();
      </script>
    `;
  }
}

customElements.define('custom-footer', CustomFooter);
