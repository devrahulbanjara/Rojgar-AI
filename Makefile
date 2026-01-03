.PHONY: all backend frontend

all:
	$(MAKE) backend & \
	$(MAKE) frontend & \
	wait

backend:
	cd backend && uv run fastapi dev

frontend:
	cd frontend && bun run dev
