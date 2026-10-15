import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import yauzl from "yauzl";
import CRC32 from "crc-32";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const maxBytes = 200 * 1024 * 1024;
const maxEntries = 10000;
const imagePattern = /^images\/[A-Za-z0-9_./-]+\.(png|jpe?g|webp|gif)$/;

function safeImage(name) {
  return (
    typeof name === "string" &&
    imagePattern.test(name) &&
    name.split("/").every((part) => part && part !== "." && part !== "..")
  );
}

function validateCatalog(catalog, files) {
  if (
    !catalog ||
    typeof catalog.title !== "string" ||
    typeof catalog.notice !== "string" ||
    typeof catalog.template !== "boolean" ||
    !Array.isArray(catalog.products)
  ) {
    throw new Error("目录字段不正确");
  }
  const ids = new Set();
  for (const product of catalog.products) {
    const id = product?.id;
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]+$/.test(id) || ids.has(id)) {
      throw new Error("商品 ID 不正确或重复");
    }
    ids.add(id);
    if (
      ["name", "description", "category", "unit"].some(
        (key) => typeof product[key] !== "string",
      ) ||
      !product.name
    ) {
      throw new Error(`商品文本字段不正确: ${id}`);
    }
    if (!Number.isSafeInteger(product.price) || product.price < 0) {
      throw new Error(`价格必须是非负整数分: ${id}`);
    }
    if (
      product.image !== null &&
      (!safeImage(product.image) || !files.has(product.image))
    ) {
      throw new Error(`图片路径或文件不正确: ${id}`);
    }
  }
  return ids.size;
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

/** Validate and stage everything before replacing data; preserve the previous directory. */
export async function importZip(source, root = projectRoot) {
  const target = path.join(root, "src/data");
  const backup = path.join(root, "src/data.previous");
  if (await exists(backup))
    throw new Error("src/data.previous 已存在，请先检查并手动保存或移除");
  const archive = await yauzl.openPromise(source, {
    strictFileNames: true,
    autoClose: false,
  });
  let staging;
  try {
    if (archive.entryCount > maxEntries)
      throw new Error("数据包超过 10000 个条目");
    staging = await mkdtemp(path.join(root, "src/.import-data-"));
    const data = path.join(staging, "data");
    await mkdir(data);
    const names = new Set();
    const files = new Set();
    let size = 0;
    for await (const entry of archive.eachEntry()) {
      const name = entry.fileName;
      const directory = name.endsWith("/");
      const parts = (directory ? name.slice(0, -1) : name).split("/");
      const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
      if (
        name.includes("\\") ||
        path.posix.isAbsolute(name) ||
        parts.some((p) => !p || p === "." || p === "..") ||
        names.has(name) ||
        (mode && mode !== 0o100000 && mode !== 0o040000)
      ) {
        throw new Error(`不安全或重复的路径: ${name}`);
      }
      names.add(name);
      if (names.size > maxEntries) throw new Error("数据包超过 10000 个条目");
      if (directory) {
        if (
          !/^images(?:\/[A-Za-z0-9_.-]+)*\/$/.test(name) ||
          entry.uncompressedSize !== 0
        )
          throw new Error(`不支持的目录: ${name}`);
        continue;
      }
      if (name !== "catalog.json" && !safeImage(name))
        throw new Error(`不支持的文件: ${name}`);
      size += entry.uncompressedSize;
      if (size > maxBytes) throw new Error("数据包超过 200 MiB，请优化图片");
      const stream = await archive.openReadStreamPromise(entry);
      const chunks = [];
      let length = 0;
      let crc = 0;
      for await (const chunk of stream) {
        length += chunk.length;
        if (length > entry.uncompressedSize)
          throw new Error(`文件大小不正确: ${name}`);
        crc = CRC32.buf(chunk, crc);
        chunks.push(chunk);
      }
      if (length !== entry.uncompressedSize || crc >>> 0 !== entry.crc32)
        throw new Error(`文件损坏: ${name}`);
      const destination = path.join(data, name);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, Buffer.concat(chunks, length), {
        flag: "wx",
      });
      files.add(name);
    }
    const catalog = JSON.parse(
      await readFile(path.join(data, "catalog.json"), "utf8"),
    );
    const count = validateCatalog(catalog, files);
    // Recheck after validation, before touching authoritative files.
    if (await exists(backup))
      throw new Error("src/data.previous 已存在，请先检查并手动保存或移除");
    const hadData = await exists(target);
    if (hadData) await rename(target, backup);
    try {
      await rename(data, target);
    } catch (error) {
      if (hadData) await rename(backup, target);
      throw error;
    }
    return count;
  } finally {
    archive.close();
    if (staging) await rm(staging, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    if (process.argv.length !== 3)
      throw new Error("用法: npm run import:data -- /绝对路径/catalog.zip");
    const count = await importZip(process.argv[2]);
    console.log(
      `已导入 ${count} 个商品。旧数据保存在 src/data.previous；核对后可手动移除。`,
    );
  } catch (error) {
    console.error(`导入失败: ${error.message}`);
    process.exitCode = 1;
  }
}
