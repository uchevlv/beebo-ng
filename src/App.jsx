import { lazy, Suspense, useEffect, useRef } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import FeaturedCollections from "./components/FeaturedCollections/FeaturedCollections";
import Footer from "./components/Footer/Footer";
import CollectionPage from "./pages/CollectionPage";
import { useCatalog } from "./hooks/useCatalog";
const Admin = lazy(() => import("./pages/admin/Admin"));
function RouteEffects() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    const changed = previousPath.current !== pathname;
    previousPath.current = pathname;
    document.title = pathname.startsWith("/admin")
      ? "Studio | beebo ng"
      : "beebo ng | Made for HER, worn by all.";
    if (hash) {
      let id;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return;
      }
      const observer = new MutationObserver(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView();
          observer.disconnect();
        }
      });
      const el = document.getElementById(id);
      if (el) el.scrollIntoView();
      else observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
    window.scrollTo(0, 0);
    if (changed)
      document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [pathname, hash]);
  return null;
}
function Storefront() {
  const catalog = useCatalog();
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex="-1">
        {catalog.loading ? (
          <p className="empty-state" role="status">
            Loading the collections…
          </p>
        ) : catalog.error ? (
          <div className="empty-state" role="alert">
            <p>{catalog.error}</p>
            <button className="button" onClick={catalog.refresh}>
              Try again
            </button>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Hero />
                  <FeaturedCollections {...catalog} />
                </>
              }
            />
            <Route
              path="/collections/:slug"
              element={<CollectionPage {...catalog} />}
            />
            <Route
              path="*"
              element={
                <div className="page empty-state">
                  <h1>Page not found</h1>
                  <Link to="/" className="text-link">
                    Return to beebo ng ↗
                  </Link>
                </div>
              }
            />
          </Routes>
        )}
      </main>
      <Footer />
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <RouteEffects />
      <Suspense
        fallback={
          <p className="empty-state" role="status">
            Loading…
          </p>
        }
      >
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Storefront />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
