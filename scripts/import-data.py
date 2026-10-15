"""Validate a ZIP completely before replacing src/data. No third-party dependencies."""
import json
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]

def import_zip(source):
    target = ROOT / 'src/data'
    with zipfile.ZipFile(source) as archive, tempfile.TemporaryDirectory(dir=ROOT / 'src') as staging:
        stage = Path(staging) / 'data'
        stage.mkdir()
        names = set()
        size = 0
        for item in archive.infolist():
            name = item.filename
            path = PurePosixPath(name)
            if path.is_absolute() or '..' in path.parts or '\\' in name or name in names or (item.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f'不安全或重复的路径: {name}')
            names.add(name)
            if item.is_dir():
                continue
            if name != 'catalog.json' and not re.fullmatch(r'images/[A-Za-z0-9_./-]+\.(png|jpe?g|webp|gif)', name):
                raise ValueError(f'不支持的文件: {name}')
            size += item.file_size
            if size > 200 * 1024 * 1024 or len(names) > 10000:
                raise ValueError('数据包超过 200 MiB 或 10000 个条目，请拆分资源或优化图片')
            dest = stage / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(archive.read(item))
        catalog = json.loads((stage / 'catalog.json').read_text())
        if not isinstance(catalog.get('title'), str) or not isinstance(catalog.get('notice'), str) or type(catalog.get('template')) is not bool or not isinstance(catalog.get('products'), list):
            raise ValueError('目录字段不正确')
        ids = set()
        for product in catalog['products']:
            pid = product.get('id')
            if not isinstance(pid, str) or not re.fullmatch(r'[A-Za-z0-9_-]+', pid) or pid in ids:
                raise ValueError('商品 ID 不正确或重复')
            ids.add(pid)
            if any(not isinstance(product.get(k), str) for k in ['name', 'description', 'category', 'unit']) or not product['name']:
                raise ValueError(f'商品文本字段不正确: {pid}')
            price = product.get('price')
            if type(price) is not int or not 0 <= price <= 9007199254740991:
                raise ValueError(f'价格必须是非负整数分: {pid}')
            if 'image' not in product:
                raise ValueError(f'缺少 image 字段: {pid}')
            image = product['image']
            if image is not None and (not isinstance(image, str) or not re.fullmatch(r'images/[A-Za-z0-9_./-]+\.(png|jpe?g|webp|gif)', image) or '..' in PurePosixPath(image).parts or not (stage / image).is_file()):
                raise ValueError(f'图片路径或文件不正确: {pid}')
        backup = ROOT / 'src/data.previous'
        if backup.exists():
            raise ValueError('src/data.previous 已存在，请先检查并手动保存或移除')
        if target.exists():
            target.rename(backup)
        try:
            shutil.move(str(stage), str(target))
        except BaseException:
            if backup.exists():
                backup.rename(target)
            raise
        print(f'已导入 {len(ids)} 个商品。旧数据保存在 src/data.previous；核对后可手动移除。')

if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise ValueError('用法: pnpm import:data /绝对路径/catalog.zip')
        import_zip(sys.argv[1])
    except Exception as error:
        print(f'导入失败: {error}', file=sys.stderr)
        sys.exit(1)
