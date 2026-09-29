import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { collectionCover } from "../../data/collections";
import { formatPrice } from "../../data/settings";
import { deleteRecord, friendlyError } from "../../lib/catalog";
export default function CatalogList({ kind, catalog }) {
  const product = kind === "products";
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const dialog = useRef(null);
  const rows = catalog[kind].filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await deleteRecord(kind, target.id);
      setNotice(target.name + " deleted.");
      catalog.refresh();
      dialog.current.close();
      setTarget(null);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Your catalogue</p>
          <h1>{product ? "Products" : "Collections"}</h1>
        </div>
        <Link className="button" to={"/admin/" + kind + "/new"}>
          Add {product ? "product" : "collection"}{" "}
          <span aria-hidden="true">+</span>
        </Link>
      </div>
      {notice && (
        <p role="status" className="notice success">
          {notice}
        </p>
      )}
      <label htmlFor="search" className="eyebrow">
        Find a {product ? "dress" : "collection"}
      </label>
      <input
        id="search"
        className="search-field"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name"
      />
      <div className="catalog-list">
        {rows.map((item) => {
          const collection = product
            ? catalog.collections.find(
                (entry) => entry.id === item.collection_id,
              )
            : null;
          const image = product ? item.image_url : collectionCover(item);
          return (
            <article className="catalog-row" key={item.id}>
              {image ? (
                <img src={image} alt={item.name} loading="lazy" />
              ) : (
                <div className="image-placeholder">b</div>
              )}
              <div className="catalog-row-info">
                <h2>{item.name}</h2>
                <p>
                  {product
                    ? collection?.name
                    : catalog.products.filter(
                        (entry) => entry.collection_id === item.id,
                      ).length + " dresses"}
                </p>
                <span className="status-pill">
                  {item.active && (!product || collection?.active)
                    ? "Visible"
                    : "Hidden"}
                </span>
              </div>
              {product && (
                <span className="row-price">{formatPrice(item.price)}</span>
              )}
              <div className="row-actions">
                <Link
                  className="button secondary"
                  to={"/admin/" + kind + "/" + item.id + "/edit"}
                  aria-label={"Edit " + item.name}
                >
                  Edit
                </Link>
                <button
                  className="delete-link"
                  onClick={() => {
                    setTarget(item);
                    setError("");
                    dialog.current.showModal();
                  }}
                  aria-label={"Delete " + item.name}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <div className="empty-state">
          <h2>{query ? "No matches" : "Your " + kind + " start here."}</h2>
          <p>
            {query
              ? "Try another name."
              : "Add your first " +
                (product
                  ? "dress with its photo and price."
                  : "collection and cover image.")}
          </p>
        </div>
      )}
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby="delete-title"
        onCancel={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <h2 id="delete-title">Delete {target?.name}?</h2>
        <p>
          This removes the {product ? "dress" : "collection"} from your website.
          You can hide it instead by editing its visibility.
        </p>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            autoFocus
            disabled={busy}
            onClick={() => dialog.current.close()}
          >
            Keep it
          </button>
          <button className="button danger" disabled={busy} onClick={remove}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}
