import { test, expect } from "@playwright/test";
import catalog from "../src/data/catalog.json" with { type: "json" };
import jsQR from "jsqr";
import { PNG } from "pngjs";
for (const width of [390, 1440, 2560, 3840]) {
  test(`选购与预约码 ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    const requests: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (
        ["fetch", "xhr", "websocket"].includes(r.resourceType()) ||
        !r.url().startsWith("http://localhost:6184")
      )
        requests.push(r.url());
    });
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: "生成预约码", exact: true }),
    ).toBeDisabled();
    if (!catalog.products.length) {
      await expect(
        page.getByText("暂无商品，请先导入商品数据。"),
      ).toBeVisible();
      return;
    }
    const products = catalog.products.slice(0, 2);
    for (const p of products) {
      await page
        .getByRole("button", { name: `增加 ${p.name}`, exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: `增加 ${p.name}`, exact: true })
        .first()
        .click();
    }
    await page.getByRole("button", { name: /购物车 ·/ }).click();
    const cart = page.getByRole("dialog", { name: "购物车", exact: true });
    await cart
      .getByRole("button", { name: `减少 ${products[0].name}`, exact: true })
      .click();
    await cart.getByRole("button", { name: "生成预约码", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "预约码", exact: true });
    await expect(dialog).toBeVisible();
    const expected = products.map((p, i) => `${p.id},${i ? 2 : 1}`).join(";");
    await expect(dialog.locator("code")).toHaveText(expected);
    const src = await dialog.getByAltText("商品预约二维码").getAttribute("src");
    const png = PNG.sync.read(Buffer.from(src!.split(",")[1], "base64"));
    expect(
      jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data,
    ).toBe(expected);
    await dialog.getByRole("button", { name: "继续选购" }).click();
    await page.getByRole("button", { name: "生成预约码", exact: true }).click();
    await expect(dialog.locator("code")).toHaveText(expected);
    await page.keyboard.press("Escape");
    await page.getByLabel("搜索商品").fill("___no_match___");
    await expect(
      page.getByText("没有匹配的商品，请更换搜索词或分类。"),
    ).toBeVisible();
    await page.getByLabel("搜索商品").fill("");
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
    expect(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.every((img) => img.complete && img.naturalWidth > 0),
        ),
    ).toBe(true);
    expect(errors).toEqual([]);
    expect(requests).toEqual([]);
    await page.screenshot({
      path: `test-results/catalog-${width}.png`,
      fullPage: true,
    });
  });
}
