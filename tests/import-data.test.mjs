import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { strToU8, zipSync } from "fflate";
import { importZip } from "../scripts/import-data.mjs";

const catalog = {
  title: "店铺",
  notice: "",
  template: false,
  products: [
    {
      id: "a-1",
      name: "商品",
      description: "",
      category: "",
      price: 0,
      unit: "件",
      image: "images/a.png",
    },
  ],
};
const image = Buffer.from("original image bytes");
function zip(data = catalog, entries = { "images/a.png": image }) {
  return Buffer.from(
    zipSync(
      { "catalog.json": strToU8(JSON.stringify(data)), ...entries },
      { level: 0 },
    ),
  );
}
async function workspace(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "huifan-import-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await writeFile(path.join(root, "src/data/original.txt"), "keep");
  return root;
}
async function pack(root, bytes) {
  const file = path.join(root, "input.zip");
  await writeFile(file, bytes);
  return file;
}
async function unchanged(root) {
  assert.equal(
    await readFile(path.join(root, "src/data/original.txt"), "utf8"),
    "keep",
  );
  assert.deepEqual(await readdir(path.join(root, "src")), ["data"]);
}

test("imports JSON and original nested image bytes, preserving old data and refusing to overwrite backup", async (t) => {
  const root = await workspace(t);
  const nested = {
    ...catalog,
    products: [{ ...catalog.products[0], image: "images/paper/a.png" }],
  };
  const file = await pack(
    root,
    zip(nested, { "images/": new Uint8Array(), "images/paper/a.png": image }),
  );
  assert.equal(await importZip(file, root), 1);
  assert.deepEqual(
    JSON.parse(
      await readFile(path.join(root, "src/data/catalog.json"), "utf8"),
    ),
    nested,
  );
  assert.deepEqual(
    await readFile(path.join(root, "src/data/images/paper/a.png")),
    image,
  );
  assert.equal(
    await readFile(path.join(root, "src/data.previous/original.txt"), "utf8"),
    "keep",
  );
  await assert.rejects(importZip(file, root), /data.previous/);
  assert.deepEqual(
    await readFile(path.join(root, "src/data/images/paper/a.png")),
    image,
  );
});

test("invalid packages leave original data intact and clean temporary files", async (t) => {
  const root = await workspace(t);
  const duplicate = {
    ...catalog,
    products: [...catalog.products, ...catalog.products],
  };
  const badReference = {
    ...catalog,
    products: [{ ...catalog.products[0], image: "../a.png" }],
  };
  const missingField = {
    ...catalog,
    products: [{ ...catalog.products[0], image: undefined }],
  };
  const cases = [
    zip(catalog, {}),
    zip(duplicate),
    zip(badReference),
    zip(missingField),
    zip(catalog, { "../escape": image }),
    zip(catalog, { "/escape": image }),
    zip(catalog, { "images\\a.png": image }),
    zip(catalog, { "images/./a.png": image }),
    zip(catalog, { "images/a.png": image, "bad.js": strToU8("script") }),
    zip(catalog, { "images/a.png": [image, { os: 3, attrs: 0o120777 << 16 }] }),
    zip({ ...catalog, products: [{ ...catalog.products[0], price: -1 }] }),
    zip({ ...catalog, products: [{ ...catalog.products[0], price: 1.1 }] }),
    zip({ ...catalog, products: [{ ...catalog.products[0], id: "bad;id" }] }),
    Buffer.from("not a zip"),
  ];
  const corrupt = zip();
  corrupt[corrupt.indexOf(image)] ^= 1;
  cases.push(corrupt);
  const duplicates = zip(catalog, {
    "images/a.png": image,
    "images/b.png": image,
  });
  for (
    let index = duplicates.indexOf("images/b.png");
    index !== -1;
    index = duplicates.indexOf("images/b.png")
  ) {
    duplicates.write("images/a.png", index);
  }
  cases.push(duplicates);
  for (const bytes of cases) {
    await assert.rejects(importZip(await pack(root, bytes), root));
    await unchanged(root);
  }
});

test("empty catalog and null images are valid", async (t) => {
  for (const products of [[], [{ ...catalog.products[0], image: null }]]) {
    const root = await workspace(t);
    assert.equal(
      await importZip(
        await pack(root, zip({ ...catalog, products }, {})),
        root,
      ),
      products.length,
    );
  }
});

test("package boundaries reject too many entries and declared oversized files", async (t) => {
  const root = await workspace(t);
  const entries = Object.fromEntries(
    Array.from({ length: 10000 }, (_, i) => [
      `images/${i}.png`,
      new Uint8Array(),
    ]),
  );
  await assert.rejects(
    importZip(await pack(root, zip(catalog, entries)), root),
    /10000/,
  );
  await unchanged(root);
  const oversized = zip();
  const central = oversized.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  oversized.writeUInt16LE(8, central + 10); // compressed entry: size check must happen before decompression
  oversized.writeUInt32LE(201 * 1024 * 1024, central + 24);
  await assert.rejects(importZip(await pack(root, oversized), root), /200 MiB/);
  await unchanged(root);
});

test("CLI reports usage without requiring an additional runtime", () => {
  const result = spawnSync(process.execPath, ["scripts/import-data.mjs"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /用法: pnpm import:data/);
});
