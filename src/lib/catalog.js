import { supabase } from "./supabase";
import { collections as initialCollections } from "../data/collections";
export async function fetchCatalog(admin = false) {
  if (!supabase) return { collections: initialCollections, products: [] };
  let collectionQuery = supabase
    .from("collections")
    .select("*")
    .order("sort_order")
    .order("created_at");
  let productQuery = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (!admin) {
    collectionQuery = collectionQuery.eq("active", true);
    productQuery = productQuery.eq("active", true);
  }
  const [collections, products] = await Promise.all([
    collectionQuery,
    productQuery,
  ]);
  if (collections.error || products.error)
    throw collections.error || products.error;
  return { collections: collections.data, products: products.data };
}
export async function saveRecord(table, record, id) {
  const query = id
    ? supabase.from(table).update(record).eq("id", id)
    : supabase.from(table).insert(record);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}
export async function deleteRecord(table, id) {
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return data;
}
export async function uploadImage(file) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (!extensions[file.type] || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
  const name = crypto.randomUUID() + "." + extensions[file.type];
  const { error } = await supabase.storage
    .from("catalog-images")
    .upload(name, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return {
    path: name,
    url: supabase.storage.from("catalog-images").getPublicUrl(name).data
      .publicUrl,
  };
}
export async function discardUpload(path) {
  return supabase.storage.from("catalog-images").remove([path]);
}
export function friendlyError(error) {
  if (error?.code === "23503")
    return "This collection still contains dresses. Move or delete them before deleting the collection.";
  if (error?.code === "23505")
    return "That collection address is already in use. Choose another.";
  if (error?.code === "42501" || error?.status === 403)
    return "Your account does not have permission. Please sign in again or contact your website administrator.";
  return error?.message || "Something went wrong. Please try again.";
}
