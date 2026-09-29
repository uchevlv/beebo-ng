import { useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { settings } from "../../data/settings";
import { useCatalog } from "../../hooks/useCatalog";
import { useAdminSession } from "./useAdminSession";
import CatalogList from "./CatalogList";
import Editor from "./Editor";
import "./Admin.css";
export default function Admin() {
  const auth = useAdminSession();
  return (
    <div className="admin-shell">
      <header className="admin-brand">
        <Link to="/" className="logo">
          beebo ng
        </Link>
        <span className="eyebrow">The studio</span>
        <Link to="/" className="text-link">
          View website  
        </Link>
      </header>
      <main id="main-content" tabIndex="-1">
        {!supabase ? (
          <div className="login-card">
            <p className="eyebrow">Welcome to your studio</p>
            <h1>A little setup first.</h1>
            <p>
              Your private catalogue workspace is ready. Connect Supabase and
              create your owner account using the project README to enable
              sign-in.
            </p>
            <Link to="/" className="text-link">
              Return to website  
            </Link>
          </div>
        ) : auth.loading ? (
          <p className="empty-state" role="status">
            Checking your access…
          </p>
        ) : !auth.session ? (
          <Login />
        ) : !auth.allowed ? (
          <div className="login-card">
            <h1>Owner access required</h1>
            <p role="alert">
              {auth.error ||
                "This account is not authorised to manage the website. Ask the website administrator to grant owner access."}
            </p>
            <SignOut />
          </div>
        ) : (
          <Workspace />
        )}
      </main>
    </div>
  );
}
function SignOut() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        className="button secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const { error } = await supabase.auth.signOut();
          setError(error ? "Could not sign out. Please try again." : "");
          setBusy(false);
        }}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && (
        <p role="alert" className="form-hint error">
          {error}
        </p>
      )}
    </div>
  );
}
function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="login-card form-fields"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        const form = new FormData(event.currentTarget);
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: String(form.get("email")).trim(),
            password: form.get("password"),
          });
          if (error)
            setError(
              "We could not sign you in. Check your email and password, then try again.",
            );
        } catch {
          setError(
            "Unable to connect. Check your internet connection and try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="eyebrow">Welcome back</p>
      <h1>Your studio.</h1>
      <p>Sign in to care for your collections.</p>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        required
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <button className="button" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="form-hint">
        Need access or a password reset? Contact your website administrator.
      </p>
    </form>
  );
}
function Workspace() {
  const catalog = useCatalog(true);
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <nav aria-label="Studio navigation">
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/collections">Collections</NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/products/new">Add Product</NavLink>
        </nav>
        <SignOut />
      </aside>
      <div className="admin-content">
        {catalog.loading ? (
          <p role="status">Loading your catalogue…</p>
        ) : catalog.error ? (
          <div role="alert">
            <p className="notice error">{catalog.error}</p>
            <button className="button" onClick={catalog.refresh}>
              Try again
            </button>
          </div>
        ) : (
          <Routes>
            <Route index element={<Dashboard catalog={catalog} />} />
            {["products", "collections"].map((kind) => (
              <Route key={kind} path={kind}>
                <Route
                  index
                  element={
                    <CatalogList key={kind} kind={kind} catalog={catalog} />
                  }
                />
                <Route
                  path="new"
                  element={<Editor kind={kind} catalog={catalog} />}
                />
                <Route
                  path=":id/edit"
                  element={<Editor kind={kind} catalog={catalog} />}
                />
              </Route>
            ))}
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>Page not found</h1>
                  <Link to="/admin">Return to dashboard</Link>
                </div>
              }
            />
          </Routes>
        )}
      </div>
    </div>
  );
}
function Dashboard({ catalog }) {
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Your studio</p>
          <h1>Welcome back.</h1>
          <p>A little care for your collections.</p>
        </div>
        <Link className="button" to="/admin/products/new">
          Add product +
        </Link>
      </div>
      {!settings.whatsapp && (
        <p className="notice">
          WhatsApp ordering needs your brand’s phone number. Ask your website
          administrator to add it before launch.
        </p>
      )}
      <div className="dashboard-stats">
        <Link to="/admin/collections">
          <strong>{catalog.collections.length}</strong>
          <span>Collections</span>
        </Link>
        <Link to="/admin/products">
          <strong>{catalog.products.length}</strong>
          <span>Dresses</span>
        </Link>
        <Link to="/admin/products">
          <strong>
            {
              catalog.products.filter(
                (item) =>
                  item.active &&
                  catalog.collections.some(
                    (collection) =>
                      collection.id === item.collection_id && collection.active,
                  ),
              ).length
            }
          </strong>
          <span>Visible dresses</span>
        </Link>
      </div>
      <div className="studio-note">
        <h2>Make room for something beautiful.</h2>
        <p>
          Add a dress, choose its collection, upload a photograph and set its
          price. Your changes appear on the website as soon as you save.
        </p>
        <Link className="text-link" to="/admin/products">
          Manage your dresses  
        </Link>
      </div>
    </>
  );
}
