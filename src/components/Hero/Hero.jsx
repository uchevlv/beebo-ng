import "./Hero.css";
import heroOne from "../../assets/images/hero/hero-1.jpg";
import heroTwo from "../../assets/images/hero/hero-2.jpg";
import heroThree from "../../assets/images/hero/hero-3.jpg";
export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-caption">
        <span>beebo ng — the collections</span>
      </div>
      <div className="hero-images">
        <img
          src={heroOne}
          alt="A fuchsia halter mini dress with a draped sash"
          width="2880"
          height="3600"
          fetchPriority="high"
        />
        <img
          src={heroTwo}
          alt="A full-length powder-blue lace dress from Beebo NG"
          width="2880"
          height="3600"
          fetchPriority="high"
        />
        <img
          src={heroThree}
          alt="An orange floral floor-length dress from Beebo NG"
          width="2880"
          height="3600"
        />
      </div>
      <div className="hero-content">
        <h1 id="hero-title">
          Made for HER,
          <br />
          <em>worn by all.</em>
        </h1>
        <a href="#collections" className="text-link">
          Explore collections <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
