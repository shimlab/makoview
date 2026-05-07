#!/bin/bash
set -euxo pipefail

rm -rf ./demo_dist
npm run build -- --base /makoview/

# replace templates
python -c "
import sys, json
data = open('sample_data.json').read()
html = sys.stdin.read()
print(html.replace('__VITE_DATA__', data).replace('window.__DEMO__ = false;', 'window.__DEMO__ = true;'))
" < dist/_template.html > temp_output.html

rm dist/_template.html
mv temp_output.html dist/demo.html

mv dist demo_dist
