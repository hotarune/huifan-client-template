import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

spec = importlib.util.spec_from_file_location('import_data', Path(__file__).resolve().parents[1] / 'scripts/import-data.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ImportTest(unittest.TestCase):
    def test_shipped_example_zip(self):
        example = Path(__file__).resolve().parents[1] / 'examples/catalog-example.zip'
        with tempfile.TemporaryDirectory() as temp:
            module.ROOT = Path(temp)
            original = module.ROOT / 'src/data'
            original.mkdir(parents=True)
            (original / 'original.txt').write_text('preserved')
            module.import_zip(example)
            with zipfile.ZipFile(example) as archive:
                names = [entry.filename for entry in archive.infolist() if not entry.is_dir()]
                self.assertEqual(len(names), 5)
                for name in names:
                    self.assertEqual((original / name).read_bytes(), archive.read(name))
                    self.assertEqual((example.parent / 'catalog' / name).read_bytes(), archive.read(name))
                catalog = json.loads(archive.read('catalog.json'))
                self.assertEqual(len(catalog['products']), 4)
                self.assertTrue(catalog['template'])
                for product in catalog['products']:
                    self.assertTrue(archive.read(product['image']).startswith(bytes.fromhex('89504e470d0a1a0a')))
            self.assertEqual((module.ROOT / 'src/data.previous/original.txt').read_text(), 'preserved')

    def test_validation_and_replacement(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            module.ROOT = root
            (root / 'src/data').mkdir(parents=True)
            (root / 'src/data/original.txt').write_text('keep')
            catalog = {'title': '店铺', 'notice': '', 'template': False, 'products': [{'id': 'a-1', 'name': 'A', 'description': '', 'category': '', 'price': 0, 'unit': '件', 'image': 'images/a.png'}]}
            def pack(extra=None, data=None):
                path = root / 'input.zip'
                with zipfile.ZipFile(path, 'w') as z:
                    z.writestr('catalog.json', json.dumps(data or catalog))
                    if extra:
                        for k, v in extra.items(): z.writestr(k, v)
                return path
            for extra in [None, {'../escape': 'bad'}, {'images/a.png': 'image', 'bad.js': 'bad'}]:
                with self.assertRaises((ValueError, FileNotFoundError)):
                    module.import_zip(pack(extra))
                self.assertEqual((root / 'src/data/original.txt').read_text(), 'keep')
            duplicate = dict(catalog, products=catalog['products'] * 2)
            with self.assertRaises(ValueError): module.import_zip(pack({'images/a.png': 'image'}, duplicate))
            module.import_zip(pack({'images/a.png': b'original image bytes'}))
            self.assertEqual(json.loads((root / 'src/data/catalog.json').read_text()), catalog)
            self.assertEqual((root / 'src/data/images/a.png').read_bytes(), b'original image bytes')
            self.assertEqual((root / 'src/data.previous/original.txt').read_text(), 'keep')
            with self.assertRaises(ValueError): module.import_zip(pack({'images/a.png': 'replacement'}))
            self.assertEqual((root / 'src/data/images/a.png').read_bytes(), b'original image bytes')

if __name__ == '__main__': unittest.main()
