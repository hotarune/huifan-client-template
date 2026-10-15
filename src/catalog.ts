import raw from "./data/catalog.json";
export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  image: string | null;
};
export type Catalog = {
  title: string;
  notice: string;
  template: boolean;
  products: Product[];
};
export function validateCatalog(value: unknown): Catalog {
  const c = value as Catalog;
  if (
    !c ||
    typeof c.title !== "string" ||
    typeof c.notice !== "string" ||
    typeof c.template !== "boolean" ||
    !Array.isArray(c.products)
  )
    throw Error("目录格式不正确");
  const ids = new Set<string>();
  for (const p of c.products) {
    if (
      !p ||
      typeof p.id !== "string" ||
      !/^[A-Za-z0-9_-]+$/.test(p.id) ||
      ids.has(p.id) ||
      !p.name ||
      typeof p.name !== "string" ||
      typeof p.description !== "string" ||
      typeof p.category !== "string" ||
      typeof p.unit !== "string" ||
      !Number.isSafeInteger(p.price) ||
      p.price < 0 ||
      !(
        p.image === null ||
        (typeof p.image === "string" &&
          /^images\/[A-Za-z0-9_./-]+\.(png|jpe?g|webp|gif)$/.test(p.image) &&
          !p.image.split("/").includes(".."))
      )
    )
      throw Error("商品字段不正确或 ID 重复");
    ids.add(p.id);
  }
  return c;
}
const assets = import.meta.glob("./data/images/**/*", {
  eager: true,
  query: "?inline",
  import: "default",
}) as Record<string, string>;
export function loadCatalog() {
  const catalog = validateCatalog(raw);
  for (const p of catalog.products)
    if (p.image && !assets[`./data/${p.image}`])
      throw Error(`缺少商品图片：${p.id}`);
  return catalog;
}
export function imageUrl(p: Product) {
  return p.image ? assets[`./data/${p.image}`] : undefined;
}
export function encodeCart(products: Product[], cart: Record<string, number>) {
  return products
    .filter((p) => cart[p.id] > 0)
    .map((p) => {
      if (!Number.isSafeInteger(cart[p.id])) throw Error("商品数量过大");
      return `${p.id},${cart[p.id]}`;
    })
    .join(";");
}
