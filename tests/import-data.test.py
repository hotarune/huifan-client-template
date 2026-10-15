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
