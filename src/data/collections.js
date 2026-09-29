import eclatCover from "../assets/images/collections/eclat/eclat-cover.jpg";
import resurgenceCover from "../assets/images/collections/resurgence/resurgence-cover.jpg";
export const collections = [
  {
    id: "eclat",
    name: "Éclat",
    slug: "eclat",
    expected_count: 9,
    cover_url: eclatCover,
    description:
      "A refined collection of radiant silhouettes made for unforgettable moments.",
  },
  {
    id: "resurgence",
    name: "Resurgence",
    slug: "resurgence",
    expected_count: 8,
    cover_url: resurgenceCover,
    description:
      "A graceful return to confidence, elegance, and timeless femininity.",
  },
];
export function collectionCover(collection) {
  return (
    collection.cover_url ||
    collections.find((item) => item.slug === collection.slug)?.cover_url ||
    ""
  );
}
