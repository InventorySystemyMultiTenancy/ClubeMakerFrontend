import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./CatalogFooter.css";
import logo from "../assets/clubemaker-logo.png";

interface PaymentBadge {
  name: string;
  src: string;
}

const PAYMENT_BADGES: PaymentBadge[] = [
  { name: "Visa", src: "/payment-logos/visa.svg" },
  { name: "Mastercard", src: "/payment-logos/mastercard.svg" },
  { name: "Elo", src: "/payment-logos/elo.svg" },
  { name: "Amex", src: "/payment-logos/amex.svg" },
  { name: "Pix", src: "/payment-logos/pix.svg" },
];

const SocialIcon: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <button
    type="button"
    className="catalog-footer-social-btn"
    aria-label={label}
    title={`${label} (em breve)`}
  >
    {children}
  </button>
);

interface CatalogFooterProps {
  categories?: string[];
}

const CatalogFooter: React.FC<CatalogFooterProps> = ({ categories = [] }) => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="catalog-footer">
      <div className="catalog-footer-newsletter">
        <div className="catalog-footer-newsletter-inner">
          <div className="catalog-footer-newsletter-copy">
            <span className="catalog-footer-newsletter-eyebrow">
              Receba novidades e lançamentos exclusivos
            </span>
            <h2>
              Fique por dentro de todo <em>novo projeto 3D</em>!
            </h2>
          </div>
          <form
            className="catalog-footer-newsletter-form"
            onSubmit={handleSubscribe}
          >
            <div className="catalog-footer-newsletter-input-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                aria-label="Seu melhor e-mail"
              />
              <button type="submit">Cadastrar</button>
            </div>
            <p className="catalog-footer-newsletter-note">
              {subscribed
                ? "Prontinho! Em breve novidades no seu e-mail. 🚀"
                : "Prometemos não enviar spam. Só novidades boas!"}
            </p>
          </form>
        </div>
      </div>

      <div className="catalog-footer-main">
        <div className="catalog-footer-main-inner">
          <div className="catalog-footer-col catalog-footer-brand-col">
            <img src={logo} alt="ClubeMaker" className="catalog-footer-logo" />
            <p className="catalog-footer-tagline">
              Produtos autorais em 3D: chaveiros, miniaturas e presentes
              personalizados, criados e fabricados pela ClubeMaker.
            </p>
            <div className="catalog-footer-social">
              <SocialIcon label="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </SocialIcon>
              <SocialIcon label="TikTok">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M14.5 3h2.6c.2 1.6 1.3 3 3 3.4v2.6c-1.1 0-2.2-.3-3.1-.9v6.4a5.1 5.1 0 1 1-4.2-5v2.7a2.4 2.4 0 1 0 1.7 2.3V3z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="YouTube">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M22 12s0-3.2-.4-4.7a2.9 2.9 0 0 0-2-2C17.9 5 12 5 12 5s-5.9 0-7.6.3a2.9 2.9 0 0 0-2 2C2 8.8 2 12 2 12s0 3.2.4 4.7c.3 1 1 1.7 2 2C6.1 19 12 19 12 19s5.9 0 7.6-.3a2.9 2.9 0 0 0 2-2C22 15.2 22 12 22 12z" fillOpacity={0} stroke="currentColor" strokeWidth={2} />
                  <path d="m10 9 5 3-5 3z" />
                </svg>
              </SocialIcon>
              <SocialIcon label="Facebook">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.9.2-1.5 1.5-1.5H16.5V4.2C16.2 4.1 15.2 4 14 4c-2.4 0-4 1.5-4 4.1v2.4H7.5v3H10V21h3.5z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <div className="catalog-footer-col">
            <h3>Institucional</h3>
            <ul>
              <li><button type="button">Quem somos</button></li>
              <li><button type="button">Nossa história</button></li>
              <li><button type="button">Como imprimimos</button></li>
              <li><button type="button">Trabalhe conosco</button></li>
            </ul>
          </div>

          <div className="catalog-footer-col">
            <h3>Ajuda</h3>
            <ul>
              <li><button type="button">Central de ajuda</button></li>
              <li><button type="button">Trocas e devoluções</button></li>
              <li><button type="button">Prazos de produção</button></li>
              <li>
                <a href="mailto:clubemaker@gmail.com">Fale conosco</a>
              </li>
              <li>
                <a
                  href="https://wa.me/5511942058445"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {categories.length > 0 && (
            <div className="catalog-footer-col">
              <h3>Categorias</h3>
              <ul>
                {categories.map((category) => (
                  <li key={category}>
                    <Link to="/menu">{category}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="catalog-footer-col catalog-footer-trust-col">
            <h3>Formas de pagamento</h3>
            <div className="catalog-footer-payment-badges">
              {PAYMENT_BADGES.map(({ name, src }) => (
                <span
                  key={name}
                  className="catalog-footer-payment-badge"
                  title={name}
                >
                  <img src={src} alt={name} loading="lazy" />
                </span>
              ))}
            </div>

            <h3>Segurança</h3>
            <div className="catalog-footer-security-badges">
              <div className="catalog-footer-security-badge">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
                </svg>
                <span>Compra segura</span>
              </div>
              <div className="catalog-footer-security-badge">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <span>Conexão segura (SSL)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="catalog-footer-bottom-bar">
        <div className="catalog-footer-bottom-inner">
          <span>
            © {new Date().getFullYear()} ClubeMaker. Todos os direitos
            reservados.
          </span>
          <div className="catalog-footer-bottom-links">
            <button type="button">Política de Privacidade</button>
            <button type="button">Termos de Uso</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CatalogFooter;
