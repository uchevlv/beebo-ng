import { Link } from "react-router-dom";
import { collectionCover } from "../../data/collections";
import "./FeaturedCollections.css";
export default function FeaturedCollections({ collections, products }) {
  return (
    <section
      className="featured-collections"
      id="collections"
      aria-labelledby="collections-title"
    >
      <div className="collections-heading">
        <div>
          <p className="eyebrow">The wardrobe, reimagined</p>
          <h2 id="collections-title">The collections</h2>
        </div>
      </div>
      <div className="collections-grid">
        {collections.map((collection, index) => {
          const count =
            products.filter(
              (product) => product.collection_id === collection.id,
            ).length ||
            collection.expected_count ||
            0;
          return (
            <article className="collection-card" key={collection.id}>
              <Link
                className="collection-image-wrap"
                to={"/collections/" + collection.slug}
                aria-label={"Explore " + collection.name}
              >
                {collectionCover(collection) ? (
                  <img
                    src={collectionCover(collection)}
                    alt={collection.name + " collection campaign"}
                    className="collection-image"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="image-placeholder">{collection.name}</span>
                )}
              </Link>
              <div className="collection-info">
                <div className="collection-title">
                  <h3>
                    <Link to={"/collections/" + collection.slug}>
                      {collection.name}
                    </Link>
                  </h3>
                  <span className="eyebrow">
                    {count
                      ? count + (count === 1 ? " dress" : " dresses")
                      : "Collection"}
                  </span>
                </div>
                <p className="collection-description">
                  {collection.description}
                </p>
                <Link
                  className="text-link"
                  to={"/collections/" + collection.slug}
                >
                  Explore <span aria-hidden="true">↗</span>
                </Link>
                <span className="collection-index" aria-hidden="true">
                  0{index + 1}
                </span>
              </div>
            </article>
          );
        })}
      </div>
      {!collections.length && (
        <p className="empty-state">New collections are on their way.</p>
      )}
    </section>
  );
}
