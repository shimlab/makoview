# cd to project root
cd "$(dirname "$(dirname "$0")")"

curl http://localhost:8001/api/genes?id=ENSG00000112715.26 > ./frontend/sample/gene.json
curl "127.0.0.1:8001/api/siteInfo?id=ENST00000000233.10&position=338" > ./frontend/sample/site.json