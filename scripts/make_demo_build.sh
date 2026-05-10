#!/bin/bash
set -euxo pipefail

rm -rf ./demo_dist
npm run build -- --base /makoview/

# replace templates
python -c "
import sys, json
data = open('sample/site.json').read()
html = sys.stdin.read()
print(html.replace('__VITE_SITE_DATA__', data).replace('window.__DEMO__ = false;', 'window.__DEMO__ = true;'))
" < dist/_site_template.html > dist/site.html


python -c "
import sys, json
data = open('sample/gene.json').read()
html = sys.stdin.read()
print(html.replace('__VITE_DATA__', data).replace('window.__DEMO__ = false;', 'window.__DEMO__ = true;'))
" < dist/_gene_template.html > dist/gene.html

rm dist/_site_template.html
rm dist/_gene_template.html

mv dist demo_dist
