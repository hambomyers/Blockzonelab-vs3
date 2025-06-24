// BlockZone Lab - Universal Navigation Bar Component
// Features: Logo, CTAs, Account/Session Status, Neon Palette, Mobile Responsive

import { getSession, getProfile } from '../platform/session.js';

// Minimal CSS-in-JS for now; can be moved to NavBar.css
const styles = {
  nav: `
    width: 100vw;
    background: var(--background-dark, #0a0a0f);
    color: var(--neon-blue, #00f5ff);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 2rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.25);
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10000;
    font-family: 'Orbitron', 'Inter', sans-serif;
  `,
  logo: `
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: 2px;
    color: var(--neon-cyan, #00d4ff);
    text-shadow: 0 0 12px var(--neon-cyan, #00d4ff);
    cursor: pointer;
    user-select: none;
  `,
  ctas: `
    display: flex;
    gap: 2rem;
    flex: 1;
    justify-content: center;
  `,
  btn: `
    background: linear-gradient(135deg, var(--neon-blue, #00f5ff), var(--electric-purple, #8a2be2));
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 2rem;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 1px;
    box-shadow: 0 2px 12px var(--neon-blue, #00f5ff33);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    text-transform: uppercase;
  `,
  btnHover: `transform: translateY(-2px) scale(1.04); box-shadow: 0 6px 24px var(--neon-blue, #00f5ff55);`,
  account: `
    min-width: 120px;
    text-align: right;
    font-size: 1rem;
    color: var(--gold-accent, #ffd700);
    font-weight: 600;
    cursor: pointer;
  `,
  hamburger: `
    display: none;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    margin-left: 1rem;
  `,
  bar: `
    width: 28px;
    height: 4px;
    background: var(--neon-blue, #00f5ff);
    border-radius: 2px;
    box-shadow: 0 0 8px var(--neon-blue, #00f5ff55);
  `,
  mobileMenu: `
    display: none;
    position: absolute;
    top: 60px;
    left: 0;
    width: 100vw;
    background: var(--background-dark, #0a0a0f);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem 0;
    z-index: 10001;
  `
};

// Helper: apply style string to element
function applyStyle(el, style) {
  el.style.cssText += style;
}

export class NavBar {
  constructor(root) {
    this.root = root;
    this.menuOpen = false;
    this.render();
    window.addEventListener('resize', () => this.updateResponsive());
  }

  async render() {
    // Clear root
    this.root.innerHTML = '';
    // Nav container
    const nav = document.createElement('nav');
    applyStyle(nav, styles.nav);

    // Logo
    const logo = document.createElement('div');
    logo.textContent = 'BLOCKZONE LAB';
    applyStyle(logo, styles.logo);
    logo.onclick = () => window.location.href = '/';
    nav.appendChild(logo);

    // CTAs
    const ctas = document.createElement('div');
    applyStyle(ctas, styles.ctas);
    // Championship button
    const btnChamp = document.createElement('button');
    btnChamp.textContent = 'CHAMPIONSHIP';
    applyStyle(btnChamp, styles.btn);
    btnChamp.onclick = () => window.location.href = '/games';
    ctas.appendChild(btnChamp);
    // Challenge Friend button
    const btnChallenge = document.createElement('button');
    btnChallenge.textContent = 'CHALLENGE FRIEND';
    applyStyle(btnChallenge, styles.btn);
    btnChallenge.onclick = () => window.location.href = '/challenge';
    ctas.appendChild(btnChallenge);
    nav.appendChild(ctas);

    // Account/session status
    const account = document.createElement('div');
    applyStyle(account, styles.account);
    let profile = getProfile();
    if (!profile) {
      // Not logged in
      account.textContent = 'Login / Connect Wallet';
      account.onclick = () => alert('Login/connect wallet coming soon!');
    } else {
      account.textContent = profile.display_name || 'Player';
      account.onclick = () => alert('Account/profile menu coming soon!');
    }
    nav.appendChild(account);

    // Hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.className = 'bz-hamburger';
    applyStyle(hamburger, styles.hamburger);
    for (let i = 0; i < 3; i++) {
      const bar = document.createElement('div');
      applyStyle(bar, styles.bar);
      hamburger.appendChild(bar);
    }
    hamburger.onclick = () => this.toggleMenu();
    nav.appendChild(hamburger);

    // Mobile menu (hidden by default)
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'bz-mobile-menu';
    applyStyle(mobileMenu, styles.mobileMenu);
    // Add CTAs to mobile menu
    const mBtnChamp = btnChamp.cloneNode(true);
    mBtnChamp.onclick = btnChamp.onclick;
    mobileMenu.appendChild(mBtnChamp);
    const mBtnChallenge = btnChallenge.cloneNode(true);
    mBtnChallenge.onclick = btnChallenge.onclick;
    mobileMenu.appendChild(mBtnChallenge);
    // Account
    const mAccount = account.cloneNode(true);
    mAccount.onclick = account.onclick;
    mobileMenu.appendChild(mAccount);
    nav.appendChild(mobileMenu);

    this.root.appendChild(nav);
    this.nav = nav;
    this.hamburger = hamburger;
    this.mobileMenu = mobileMenu;
    this.updateResponsive();
  }

  updateResponsive() {
    const isMobile = window.innerWidth < 800;
    this.hamburger.style.display = isMobile ? 'flex' : 'none';
    this.mobileMenu.style.display = (isMobile && this.menuOpen) ? 'flex' : 'none';
    // Hide CTAs in main nav if mobile
    this.nav.querySelectorAll('div')[1].style.display = isMobile ? 'none' : 'flex';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.updateResponsive();
  }
}

// Usage:
// import { NavBar } from './shared/components/NavBar.js';
// new NavBar(document.getElementById('nav-root'));
// Add <div id="nav-root"></div> to your HTML
// TODO: Move styles to NavBar.css for easier theming
// TODO: Add dropdown/profile menu, wallet connect, notifications, etc. 