import { Link } from "react-router-dom";
import { settings, whatsappLink } from "../../data/settings";
import "./Footer.css";

export default function Footer() {
  const whatsapp = whatsappLink(
    "Hello Beebo NG, I would like to enquire about your collections.",
  );

  return (
    <footer className="footer" id="contact">
      <Link to="/" className="logo">
        beebo ng
      </Link>

      <div className="footer-contact">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        )}

        <a href={"mailto:" + settings.email}>
          Email
        </a>

        <a href={settings.instagram} target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
      </div>

      <p>© {new Date().getFullYear()} Beebo NG</p>
    </footer>
  );
}