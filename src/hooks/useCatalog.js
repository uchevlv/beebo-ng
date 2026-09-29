import { useEffect, useState } from "react";
import { fetchCatalog } from "../lib/catalog";
export function useCatalog(admin = false) {
  const [state, setState] = useState({
    collections: [],
    products: [],
    loading: true,
    error: "",
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let ignore = false;
    fetchCatalog(admin)
      .then((data) => {
        if (!ignore) setState({ ...data, loading: false, error: "" });
      })
      .catch(() => {
        if (!ignore)
          setState({
            collections: [],
            products: [],
            loading: false,
            error: "The collection could not be loaded. Please try again.",
          });
      });
    return () => {
      ignore = true;
    };
  }, [admin, version]);
  return { ...state, refresh: () => setVersion((value) => value + 1) };
}
