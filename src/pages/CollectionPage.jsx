import { Link, useParams } from "react-router-dom";
import { collectionCover } from "../data/collections";
import ProductCard from "../components/ProductCard";
export default function CollectionPage({ collections, products }) {
  const { slug } = useParams();
  const collection = collections.find((item) => item.slug === slug);
  if (!collection)
    return (
      <section className="page empty-state">
        <h1>Collection not found</h1>
        <Link className="text-link" to="/#collections">
          Explore the collections  
        </Link>
      </section>
    );
  const dresses = products.filter(
    (item) => item.collection_id === collection.id,
  );
  return (
    <section className="page">
      <Link className="text-link back-link" to="/#collections">
        ← All collections
      </Link>
      <div className="collection-intro">
        <div>
          <p className="eyebrow">The {collection.name} collection</p>
          <h1>{collection.name}</h1>
          <p>{collection.description}</p>
          <span className="eyebrow">
            {dresses.length
              ? dresses.length + (dresses.length === 1 ? " dress" : " dresses")
              : collection.expected_count
                ? collection.expected_count + " dresses · catalogue coming soon"
                : "Catalogue coming soon"}
          </span>
        </div>
        {collectionCover(collection) && (
          <img
            src={collectionCover(collection)}
            alt={collection.name + " campaign"}
          />
        )}
      </div>
      {dresses.length ? (
        <div className="product-grid">
          {dresses.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              collection={collection}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state collection-empty">
          <h2>A closer look, coming soon.</h2>
          <p>
            The dresses in this collection will be available to browse here
            shortly.
          </p>
          <a className="text-link" href="/#contact">
            Enquire about {collection.name}  
          </a>
        </div>
      )}
    </section>
  );
}
