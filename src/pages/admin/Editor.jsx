import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { collectionCover } from "../../data/collections";
import {
  saveRecord,
  uploadImage,
  discardUpload,
  friendlyError,
} from "../../lib/catalog";
import ImageField from "./ImageField";
export default function Editor({ kind, catalog }) {
  const { id } = useParams();
  const product = kind === "products";
  const existing = id ? catalog[kind].find((item) => item.id === id) : null;
  if (id && !existing)
    return (
      <div className="empty-state">
        <h1>Item not found</h1>
        <Link to={"/admin/" + kind}>Back to {kind}</Link>
      </div>
    );
  if (product && !catalog.collections.length)
    return (
      <div className="empty-state">
        <h1>Add a collection first</h1>
        <p>Every dress belongs to a collection.</p>
        <Link className="button" to="/admin/collections/new">
          Add collection
        </Link>
      </div>
    );
  return (
    <EditorForm
      key={kind + (id || "new")}
      kind={kind}
      existing={existing}
      catalog={catalog}
    />
  );
}
function EditorForm({ kind, existing, catalog }) {
  const product = kind === "products";
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name) {
      setError("Please enter a name.");
      return;
    }
    setBusy(true);
    setError("");
    let uploaded;
    try {
      if (file) uploaded = await uploadImage(file);
      const record = {
        name,
        description: String(form.get("description")).trim(),
        active: form.get("active") === "on",
      };
      if (product) {
        record.collection_id = form.get("collection_id");
        record.price = Number(form.get("price"));
        record.image_url = uploaded?.url || existing?.image_url;
        if (
          !Number.isFinite(record.price) ||
          record.price <= 0 ||
          record.price > 999999999
        )
          throw new Error("Enter a valid price greater than zero.");
        if (!record.image_url)
          throw new Error("Please choose an image for this dress.");
      } else {
        record.slug = String(form.get("slug")).trim().toLowerCase();
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug))
          throw new Error(
            "Use lowercase letters, numbers and single hyphens for the collection address.",
          );
        record.cover_url = uploaded?.url || existing?.cover_url || null;
        if (!record.cover_url && !collectionCover(record))
          throw new Error("Please choose a collection cover.");
        record.sort_order = Number(form.get("sort_order") || 0);
      }
      await saveRecord(kind, record, existing?.id);
      catalog.refresh();
      navigate("/admin/" + kind, { state: { notice: name + " saved." } });
    } catch (err) {
      if (uploaded) await discardUpload(uploaded.path).catch(() => {});
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="text-link back-link" to={"/admin/" + kind}>
        ← {product ? "Products" : "Collections"}
      </Link>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Your catalogue</p>
          <h1>
            {existing ? "Edit " : "Add "}
            {product ? "dress" : "collection"}
          </h1>
        </div>
      </div>
      <form className="editor-form" onSubmit={submit}>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <fieldset disabled={busy}>
          <div className="editor-grid">
            <div className="form-fields">
              <label htmlFor="name">
                {product ? "Dress name" : "Collection name"}
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength="120"
                defaultValue={existing?.name || ""}
              />
              {product ? (
                <>
                  <label htmlFor="collection_id">Collection</label>
                  <select
                    id="collection_id"
                    name="collection_id"
                    required
                    defaultValue={
                      existing?.collection_id || catalog.collections[0]?.id
                    }
                  >
                    {catalog.collections.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                        {item.active === false ? " (hidden)" : ""}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="price">Price (₦)</label>
                  <input
                    id="price"
                    name="price"
                    inputMode="decimal"
                    type="number"
                    min="0.01"
                    max="999999999"
                    step="0.01"
                    required
                    defaultValue={existing?.price ?? ""}
                  />
                </>
              ) : (
                <>
                  <label htmlFor="slug">Collection address</label>
                  <input
                    id="slug"
                    name="slug"
                    required
                    maxLength="100"
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    defaultValue={existing?.slug || ""}
                    placeholder="e.g. resurgence"
                    aria-describedby="slug-help"
                  />
                  <p id="slug-help" className="form-hint">
                    Appears in the page link. Changing it changes the link
                    visitors use.
                  </p>
                  <label htmlFor="sort_order">Display order</label>
                  <input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    min="0"
                    max="9999"
                    step="1"
                    defaultValue={existing?.sort_order ?? 0}
                  />
                  <p className="form-hint">Lower numbers appear first.</p>
                </>
              )}
              <label htmlFor="description">
                Description <span className="optional">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                maxLength="2000"
                defaultValue={existing?.description || ""}
              />
              <label className="checkbox">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={existing ? existing.active : true}
                />{" "}
                Show {product ? "this dress" : "this collection"} on the website
              </label>
              <p className="form-hint">
                {product
                  ? "Dresses in a hidden collection remain hidden."
                  : "Hiding a collection also hides its dresses."}
              </p>
            </div>
            <ImageField
              existing={
                product
                  ? existing?.image_url
                  : existing && collectionCover(existing)
              }
              onChange={setFile}
              required={product}
            />
          </div>
          <div className="form-actions">
            <button className="button" type="submit">
              {busy ? "Saving…" : "Save " + (product ? "dress" : "collection")}
            </button>
            <Link className="button secondary" to={"/admin/" + kind}>
              Cancel
            </Link>
          </div>
        </fieldset>
      </form>
    </>
  );
}
