import pytest


class TestSystem:
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        assert resp.json()["data"]["app"] == "ConvexHire API"

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["data"]["database"] == "connected"
