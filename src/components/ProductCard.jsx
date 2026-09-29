import { orderLink, formatPrice } from "../data/settings";
export default function ProductCard({ product, collection }) {
  const link = orderLink(product, collection);
  return (
    <article className="product-card">
      <div className="product-image">
        <img
          src={product.image_url}
          alt={product.name + " — " + collection.name}
          loading="lazy"
          decoding="async"
        />
      </div>
      <p className="eyebrow">{collection.name}</p>
      <div className="product-title">
        <h2>{product.name}</h2>
        <span>{formatPrice(product.price)}</span>
      </div>
      {product.description && (
        <p className="product-description">{product.description}</p>
      )}
      {link ? (
        <a
          className="button order-button"
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          Order on WhatsApp <span aria-hidden="true"> </span>
        </a>
      ) : (
        <>
          <button className="button order-button" disabled>
            Order on WhatsApp
          </button>
          <p className="form-hint">
            WhatsApp ordering will be available soon.{" "}
            <a href="/#contact">Contact us</a>.
          </p>
        </>
      )}
    </article>
  );
}
