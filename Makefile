# Agentic data room. Run `make demo` for the ten-minute setup.
SHELL := /bin/bash
PY ?= python3
ENV_FILE ?= .env

.PHONY: help setup index library upload eval eval-files dev demo redis check clean

help:
	@echo "make setup       install Python and Node dependencies"
	@echo "make index       rebuild corpus/_index.md and the citation manifest"
	@echo "make library     render the sample docs into corpus/library (served by the app)"
	@echo "make upload      upload spreadsheet tabs and legal PDFs to the Anthropic Files API"
	@echo "make eval        run the eval in baseline mode"
	@echo "make eval-files  run the eval with sheets and legal docs attached"
	@echo "make dev         start the web app on http://localhost:3000"
	@echo "make demo        setup + index + library + dev"
	@echo "make redis       start Redis with docker compose (optional; memory store is the default)"
	@echo "make check       secrets scan and production build"

setup:
	$(PY) -m pip install -q -r playground/requirements.txt reportlab
	cd web && npm ci --no-audit --no-fund
	@test -f $(ENV_FILE) || (cp .env.example $(ENV_FILE) && echo "created $(ENV_FILE): paste your ANTHROPIC_API_KEY")
	@test -f web/.env.local || (cp web/.env.example web/.env.local && echo "created web/.env.local: set ADMIN_EMAILS to your email")

index:
	$(PY) corpus/build_index.py

library:
	$(PY) corpus/make_sample_library.py

upload:
	set -a && source $(ENV_FILE) && set +a && $(PY) corpus/build_index.py --upload-files --upload-legal-docs

eval:
	set -a && source $(ENV_FILE) && set +a && cd playground && $(PY) eval.py

eval-files:
	set -a && source $(ENV_FILE) && set +a && cd playground && $(PY) eval.py --enable-sheets --enable-legal-docs

dev:
	cd web && npm run dev

demo: setup index library
	@echo
	@echo "Open http://localhost:3000 and sign in with the email from ADMIN_EMAILS."
	@echo "Without RESEND_API_KEY the one-time code is printed in this terminal."
	@echo
	cd web && npm run dev

redis:
	docker compose up -d

check:
	gitleaks detect --source . --redact
	gitleaks protect --staged --redact
	cd web && NEXT_TELEMETRY_DISABLED=1 npx next build

clean:
	rm -rf web/.next corpus/finance/sheets corpus/__pycache__
