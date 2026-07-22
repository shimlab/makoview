.PHONY: dev build webdev demobuild init publish_to_pypi

webdev:
	cd frontend && npm run dev

build:
	cd frontend && npm run build
	rm -rf dist
	rm -rf backend/makoview/static/
	mkdir -p backend/makoview/static
	mv frontend/dist/* backend/makoview/static/
	uv build

demobuild:
	cd frontend && ../scripts/make_demo_build.sh

dev: build
	uv run makoview serve \
		--gtf gencode.v49.annotation.gtf.gz \
		--sites sites.duckdb \
		--fits adaptive_binomial_fits.tsv \
		--genome GRCh38.p14.genome.fa \
		--coverage /Volumes/Tungsten/lfs/coverage.dorado.duckdb \
		--reads reads.duckdb \
		--modified_prob_threshold 0.5

init:
	uv run makoview init \
		--gtf gencode.v49.annotation.gtf.gz \
		--genome GRCh38.p14.genome.fa

publish_to_pypi: build
	uvx twine upload dist/*