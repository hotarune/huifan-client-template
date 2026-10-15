import { createRoot } from "react-dom/client";
import { useRef, useState } from "react";
import QRCode from "qrcode";
import {
  loadCatalog,
  imageUrl,
  encodeCart,
  type Product,
  type Catalog,
} from "./catalog";
import "./style.css";
const money = (n: number) => `¥${(n / 100).toFixed(2)}`;
function App({ catalog }: { catalog: Catalog }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState("全部");
  const [search, setSearch] = useState("");
  const [code, setCode] = useState<{ image: string; payload: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const lines = catalog.products.filter((p) => cart[p.id] > 0);
  const quantity = lines.reduce((sum, p) => sum + cart[p.id], 0);
  const total = lines.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  function change(p: Product, delta: number) {
    setCart((current) => {
      const next = (current[p.id] ?? 0) + delta;
      if (!Number.isSafeInteger(next)) return current;
      return { ...current, [p.id]: Math.max(0, next) };
    });
  }
  function stepper(p: Product) {
    return (
      <div className="stepper">
        <button
          aria-label={`减少 ${p.name}`}
          disabled={!cart[p.id]}
          onClick={() => change(p, -1)}
        >
          −
        </button>
        <output aria-label={`${p.name} 数量`}>{cart[p.id] ?? 0}</output>
        <button
          className="plus"
          aria-label={`增加 ${p.name}`}
          onClick={() => change(p, 1)}
        >
          ＋
        </button>
      </div>
    );
  }
  async function generate() {
    if (!quantity || busy) return;
    setBusy(true);
    setError("");
    try {
      const payload = encodeCart(catalog.products, cart);
      const image = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: "M",
        margin: 4,
        scale: 8,
      });
      setCode({ image, payload });
      cartDialog.current?.close();
      dialog.current?.showModal();
    } catch {
      setError(
        "无法生成二维码，所选商品可能超出单个二维码容量。请减少商品种类后重试；购物车已保留。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app">
      <header>
        <div>
          <span className="eyebrow">现场选购</span>
          <h1>{catalog.title}</h1>
          <p>{catalog.notice}</p>
        </div>
        {catalog.template && <span className="mock">MOCK · 模板数据</span>}
      </header>
      <div className="toolbar">
        <label htmlFor="search">搜索商品</label>
        <input
          id="search"
          type="search"
          placeholder="商品名称或描述"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <main>
        <nav aria-label="商品分类">
          {["全部", ...new Set(catalog.products.map((p) => p.category))].map(
            (c) => (
              <button
                key={c}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c || "未分类"}
              </button>
            ),
          )}
        </nav>
        <section className="catalog" aria-label="商品目录">
          <div className="section-title">
            <h2>{category || "未分类"}</h2>
            <span>{catalog.products.length} 款商品</span>
          </div>
          <div className="products">
            {catalog.products
              .filter(
                (p) =>
                  (category === "全部" || p.category === category) &&
                  `${p.name} ${p.description}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((p) => (
                <article key={p.id}>
                  {p.image ? (
                    <img src={imageUrl(p)} alt={p.name} />
                  ) : (
                    <div className="placeholder" aria-hidden="true">
                      {p.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="product-info">
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <div className="product-bottom">
                      <strong>
                        {money(p.price)}
                        <small> / {p.unit}</small>
                      </strong>
                      {stepper(p)}
                    </div>
                  </div>
                </article>
              ))}
          </div>
          {!catalog.products.length ? (
            <p className="empty">暂无商品，请先导入商品数据。</p>
          ) : (
            !catalog.products.some(
              (p) =>
                (category === "全部" || p.category === category) &&
                `${p.name} ${p.description}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
            ) && <p className="empty">没有匹配的商品，请更换搜索词或分类。</p>
          )}
        </section>
      </main>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <footer>
        <button
          className="cart-summary"
          onClick={() => cartDialog.current?.showModal()}
        >
          <span className="bag">袋</span>
          <span>
            <strong>{money(total)}</strong>
            <small>购物车 · {quantity} 件商品</small>
          </span>
        </button>
        <button
          className="primary"
          disabled={!quantity || busy}
          onClick={generate}
        >
          {busy ? "正在生成…" : "生成预约码"}
        </button>
      </footer>
      <dialog ref={cartDialog} aria-labelledby="cart-title">
        <div className="dialog-top">
          <h2 id="cart-title">购物车</h2>
          <button onClick={() => cartDialog.current?.close()}>关闭</button>
        </div>
        <div className="cart-lines">
          {lines.map((p) => (
            <div className="cart-line" key={p.id}>
              <div>
                <h3>{p.name}</h3>
                <span>{money(p.price * cart[p.id])}</span>
              </div>
              {stepper(p)}
            </div>
          ))}
          {!quantity && <p className="empty">购物车为空，先去挑选商品吧。</p>}
        </div>
        <div className="dialog-bottom">
          <strong>合计 {money(total)}</strong>
          <button
            className="primary"
            disabled={!quantity || busy}
            onClick={generate}
          >
            生成预约码
          </button>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </dialog>
      <dialog ref={dialog} aria-labelledby="code-title">
        <div className="dialog-top">
          <h2 id="code-title">预约码</h2>
          <button onClick={() => dialog.current?.close()}>关闭</button>
        </div>
        <p>向现场工作人员出示此二维码</p>
        {code && (
          <>
            <img className="qr" src={code.image} alt="商品预约二维码" />
            <code>{code.payload}</code>
          </>
        )}
        <p className="hint">
          仅记录所选商品与数量，未提交订单、支付或锁定库存。购物车已保留。
        </p>
        <button
          className="primary full"
          onClick={() => dialog.current?.close()}
        >
          继续选购
        </button>
      </dialog>
    </div>
  );
}
const root = createRoot(document.getElementById("root")!);
try {
  root.render(<App catalog={loadCatalog()} />);
} catch {
  root.render(
    <main className="data-error">
      <h1>商品数据无法读取</h1>
      <p>请检查目录格式及图片资源，重新导入并构建。</p>
    </main>,
  );
}
