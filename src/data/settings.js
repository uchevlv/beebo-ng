export const settings = {
  whatsapp: (import.meta.env.VITE_WHATSAPP_NUMBER || "").replace(/[^0-9]/g, ""),
  email: "hello@beebong.com",
  instagram: "https://www.instagram.com/beebo_ng",
};
export const formatPrice = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
export function whatsappLink(message, phone = settings.whatsapp) {
  if (!/^[1-9][0-9]{7,14}$/.test(phone)) return null;
  return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
}
export function orderLink(product, collection, phone = settings.whatsapp) {
  return whatsappLink(
    "Hello Beebo NG, I would like to order the " +
      product.name +
      " from the " +
      collection.name +
      " collection priced at " +
      formatPrice(product.price) +
      ".",
    phone,
  );
}
