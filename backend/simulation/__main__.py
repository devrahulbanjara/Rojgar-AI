"""CLI: uv run python -m simulation {fairness,redteam,load} [options]"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys


def _quiet_app_logs() -> None:
    from loguru import logger

    logger.remove()
    logger.add(sys.stderr, level=os.getenv("SIM_LOG_LEVEL", "WARNING"))


def _settings_db() -> str:
    from simulation.safety import assert_local_settings

    assert_local_settings()
    from app.core.config import settings

    return settings.db_name


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="python -m simulation", description=__doc__)
    sub = parser.add_subparsers(dest="mode", required=True)

    def common_cost(p: argparse.ArgumentParser) -> None:
        p.add_argument("--yes", action="store_true", help="confirm spends above $0.50")
        p.add_argument(
            "--max-cost", type=float, default=2.0, help="hard USD cap (default 2.00)"
        )
        p.add_argument("--trace", action="store_true", help="keep LangSmith tracing on")
        p.add_argument("--seed", type=int, default=7)
        p.add_argument("--tag", default="")

    f = sub.add_parser("fairness", help="counterfactual identity audit (in-process)")
    f.add_argument("--bases", type=int, default=8)
    f.add_argument(
        "--no-cross", action="store_true", help="skip off-target (borderline) pairings"
    )
    f.add_argument(
        "--nontech",
        type=int,
        default=5,
        help="non-tech base cases (nurse, cashier, driver, teller, Nepali-answers cook)",
    )
    f.add_argument(
        "--with-llm", action="store_true", help="also run the live Groq review"
    )
    f.add_argument("--llm-bases", type=int, default=1)
    f.add_argument("--repeats", type=int, default=2)
    common_cost(f)

    r = sub.add_parser(
        "redteam", help="adversarial CVs vs injection rail + review (in-process)"
    )
    r.add_argument("--repeats", type=int, default=2)
    r.add_argument("--with-llm", action="store_true")
    common_cost(r)

    ld = sub.add_parser("load", help="concurrent persona journeys over HTTP")
    ld.add_argument("--base-url", default="http://localhost:8000")
    ld.add_argument("--allow-remote", action="store_true")
    ld.add_argument("--personas", type=int, default=25)
    ld.add_argument("--ramp-seconds", type=float, default=5.0)
    ld.add_argument("--max-rps", type=float, default=200.0)
    ld.add_argument(
        "--include-ai",
        action="store_true",
        help="include semantic search (embedding calls)",
    )
    ld.add_argument(
        "--mutate",
        action="store_true",
        help="recruiters decide + undo (shortlist then undo) on applications",
    )
    ld.add_argument(
        "--login-sample",
        type=int,
        default=3,
        help="real /auth/login calls (spaced 7s apart); journeys use minted tokens",
    )
    ld.add_argument(
        "--db-name",
        default=None,
        help="local DB the target server uses (for minting tokens); default from settings",
    )
    ld.add_argument("--seed", type=int, default=7)
    ld.add_argument("--tag", default="")

    lc = sub.add_parser("limiter-check", help="tiny login rate-limit spoofing check")
    lc.add_argument("--base-url", required=True)
    lc.add_argument("--allow-remote", action="store_true")
    lc.add_argument("--email", default="e2e.candidate.fresh@test.dev")
    lc.add_argument("--password", default="Password123")
    lc.add_argument("--same-ip-attempts", type=int, default=11)
    lc.add_argument("--spoofed-attempts", type=int, default=3)
    lc.add_argument("--tag", default="")

    args = parser.parse_args(argv)

    if args.mode == "limiter-check":
        from simulation import load, report
        from simulation.safety import assert_local_url

        assert_local_url(args.base_url, allow_remote=args.allow_remote)
        if args.base_url.rstrip("/").endswith(":8000"):
            parser.error(
                "refusing :8000 - that server is shared with a human session; use your own instance"
            )
        result = asyncio.run(
            load.limiter_check(
                base_url=args.base_url,
                email=args.email,
                password=args.password,
                same_ip_attempts=args.same_ip_attempts,
                spoofed_attempts=args.spoofed_attempts,
            )
        )
        jpath, mpath = report.write(result, tag=args.tag)
        print(f"[simulation] {result['verdict']}\n[simulation] wrote {mpath}")
        return

    if args.mode == "load":
        from simulation import load, report
        from simulation.safety import assert_local_url

        assert_local_url(args.base_url, allow_remote=args.allow_remote)
        if args.personas > 1000:
            parser.error("--personas is capped at 1000")
        if args.base_url.rstrip("/").endswith(":8000") and (
            args.personas > 25 or args.mutate
        ):
            parser.error(
                ":8000 is shared with a human session - max 25 personas and no --mutate; "
                "start your own instance (see README) for heavier runs"
            )
        result = asyncio.run(
            load.run(
                base_url=args.base_url,
                personas=args.personas,
                ramp_seconds=args.ramp_seconds,
                max_rps=args.max_rps,
                include_ai=args.include_ai,
                mutate=args.mutate,
                login_sample=args.login_sample,
                db_name=args.db_name or _settings_db(),
                seed=args.seed,
            )
        )
    else:
        if not args.trace:
            os.environ["LANGSMITH_TRACING"] = "false"
            os.environ["LANGCHAIN_TRACING_V2"] = "false"
        _quiet_app_logs()
        from simulation import report
        from simulation.safety import assert_local_settings

        assert_local_settings()
        if args.mode == "fairness":
            from simulation import fairness

            result = asyncio.run(
                fairness.run(
                    bases=args.bases,
                    cross=not args.no_cross,
                    nontech=args.nontech,
                    with_llm=args.with_llm,
                    llm_bases=args.llm_bases,
                    repeats=args.repeats,
                    yes=args.yes,
                    max_cost=args.max_cost,
                    seed=args.seed,
                )
            )
        else:
            from simulation import redteam

            result = asyncio.run(
                redteam.run(
                    repeats=args.repeats,
                    with_llm=args.with_llm,
                    yes=args.yes,
                    max_cost=args.max_cost,
                )
            )

    jpath, mpath = report.write(result, tag=args.tag)
    print(f"[simulation] wrote {mpath}\n[simulation] wrote {jpath}")
    if "spend" in result:
        print(f"[simulation] spend: {result['spend']}")


if __name__ == "__main__":
    main()
