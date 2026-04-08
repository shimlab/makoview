.PHONY: dev build webdev

webdev:
	cd frontend && npm run dev

build:
	cd frontend && npm run build
	rm -r build/
	mkdir -p build/static
	mv frontend/dist/* build/static/


dev: build
	uv run makoview-v2 --gtf gencode.v49.annotation.gtf.gz --sites sites.duckdb --fits adaptive_binomial_fits.tsv