"""Generate activity-diagram HTML files for subsystems 2-7 and screenshot
all eight diagrams (use case + 7 activity diagrams) to PNG via Playwright.

Run from backend/:
    uv run --with playwright python scripts/gen_diagrams.py

Outputs HTML + PNG under <repo_root>/docs/.
"""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DOCS = REPO_ROOT / "docs"
DOCS.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Shared CSS used by every activity-diagram HTML.
# ---------------------------------------------------------------------------
CSS = """
body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
       background: #fafafa; margin: 0; padding: 24px; color: #1c2432; }
.wrap { background: #ffffff; border: 1px solid #c8d0da; border-radius: 8px;
        padding: 16px; overflow: auto; }
svg   { display: block; width: 100%; height: auto; }
text  { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; fill: #1c2432; }
.lane-title { font-size: 15px; font-weight: 600; text-anchor: middle; }
.action     { font-size: 13px; text-anchor: middle; }
.guard      { font-size: 12px; font-style: italic; fill: #444; }
.deco       { font-size: 12px; text-anchor: middle; fill: #1c2432; }
.lane       { fill: #ffffff; stroke: #1c2432; stroke-width: 1.2; }
.lane-head  { fill: #f1f3f7; stroke: #1c2432; stroke-width: 1.2; }
.action-box { fill: #ffffff; stroke: #1c2432; stroke-width: 1.4; }
.diamond    { fill: #ffffff; stroke: #1c2432; stroke-width: 1.4; }
.bar        { fill: #1c2432; }
.flow       { stroke: #1c2432; stroke-width: 1.4; fill: none; }
.start-end  { fill: #1c2432; }
.final-ring { fill: #ffffff; stroke: #1c2432; stroke-width: 1.4; }
"""

ARROW_MARKER = (
    '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" '
    'markerWidth="9" markerHeight="9" orient="auto">'
    '<path d="M0,0 L10,5 L0,10 z" fill="#1c2432"/></marker></defs>'
)


def header(title: str, vw: int, vh: int) -> str:
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>{title}</title>
<style>{CSS}</style></head><body><div class="wrap">
<svg viewBox="0 0 {vw} {vh}" xmlns="http://www.w3.org/2000/svg">{ARROW_MARKER}
"""


def footer() -> str:
    return "</svg></div></body></html>"


def lanes(lane_names: list[str], vw: int, vh: int) -> str:
    parts: list[str] = []
    n = len(lane_names)
    lw = vw / n
    for i in range(n):
        x = i * lw
        parts.append(f'<rect class="lane" x="{x:.0f}" y="60" width="{lw:.0f}" height="{vh - 60}"/>')
        parts.append(f'<rect class="lane-head" x="{x:.0f}" y="20" width="{lw:.0f}" height="40"/>')
        parts.append(f'<text class="lane-title" x="{x + lw / 2:.0f}" y="46">{lane_names[i]}</text>')
    return "\n".join(parts)


def lane_center(idx: int, n_lanes: int, vw: int) -> float:
    lw = vw / n_lanes
    return idx * lw + lw / 2


# ---------------------------------------------------------------------------
# Node primitives.  Each returns SVG fragment.
# ---------------------------------------------------------------------------
def start_node(cx: float, cy: float) -> str:
    return f'<circle class="start-end" cx="{cx}" cy="{cy}" r="11"/>'


def end_node(cx: float, cy: float) -> str:
    return (
        f'<circle class="final-ring" cx="{cx}" cy="{cy}" r="14"/>'
        f'<circle class="start-end"  cx="{cx}" cy="{cy}" r="8"/>'
    )


def finalflow_node(cx: float, cy: float) -> str:
    return (
        f'<circle class="final-ring" cx="{cx}" cy="{cy}" r="14"/>'
        f'<line class="flow" x1="{cx - 10}" y1="{cy - 10}" x2="{cx + 10}" y2="{cy + 10}"/>'
        f'<line class="flow" x1="{cx + 10}" y1="{cy - 10}" x2="{cx - 10}" y2="{cy + 10}"/>'
    )


def action_node(cx: float, cy: float, label: str, w: int = 220, h: int = 46) -> str:
    x = cx - w / 2
    y = cy - h / 2
    # break long labels into two lines manually
    if "||" in label:
        a, b = label.split("||", 1)
        return (
            f'<rect class="action-box" x="{x}" y="{y}" width="{w}" height="{h}" rx="22"/>'
            f'<text class="action" x="{cx}" y="{cy - 4}">{a.strip()}</text>'
            f'<text class="action" x="{cx}" y="{cy + 14}">{b.strip()}</text>'
        )
    return (
        f'<rect class="action-box" x="{x}" y="{y}" width="{w}" height="{h}" rx="22"/>'
        f'<text class="action" x="{cx}" y="{cy + 5}">{label}</text>'
    )


def decision_node(cx: float, cy: float, label: str) -> str:
    w, h = 160, 100
    pts = f"{cx},{cy - h / 2} {cx + w / 2},{cy} {cx},{cy + h / 2} {cx - w / 2},{cy}"
    return (
        f'<polygon class="diamond" points="{pts}"/>'
        f'<text class="deco" x="{cx}" y="{cy + 5}">{label}</text>'
    )


def merge_node(cx: float, cy: float) -> str:
    w, h = 120, 80
    pts = f"{cx},{cy - h / 2} {cx + w / 2},{cy} {cx},{cy + h / 2} {cx - w / 2},{cy}"
    return (
        f'<polygon class="diamond" points="{pts}"/>'
        f'<text class="deco" x="{cx}" y="{cy + 5}">merge</text>'
    )


def fork_join_bar(cx: float, cy: float, w: int = 260) -> str:
    return f'<rect class="bar" x="{cx - w / 2}" y="{cy - 4}" width="{w}" height="8"/>'


# ---------------------------------------------------------------------------
# Edge primitives.
# ---------------------------------------------------------------------------
def line_edge(x1: float, y1: float, x2: float, y2: float, guard: str | None = None) -> str:
    parts = [f'<line class="flow" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" marker-end="url(#arrow)"/>']
    if guard:
        gx, gy = (x1 + x2) / 2 + 12, (y1 + y2) / 2 - 4
        parts.append(f'<text class="guard" x="{gx}" y="{gy}">{guard}</text>')
    return "\n".join(parts)


def path_edge(d: str, guard: str | None = None, guard_xy: tuple[float, float] | None = None) -> str:
    parts = [f'<path class="flow" d="{d}" marker-end="url(#arrow)"/>']
    if guard and guard_xy:
        gx, gy = guard_xy
        parts.append(f'<text class="guard" x="{gx}" y="{gy}">{guard}</text>')
    return "\n".join(parts)


# ===========================================================================
# Subsystem 2: ML + Multi-Agent Shortlisting
# ===========================================================================
def build_subsystem2() -> str:
    vw, vh = 1400, 1520
    ln = ["Recruiter", "Backend", "AI Service"]
    cx = [lane_center(i, len(ln), vw) for i in range(len(ln))]

    parts = [header("Subsystem 2 Activity", vw, vh), lanes(ln, vw, vh)]

    parts += [
        start_node(cx[0], 90),
        action_node(cx[0], 150, "Trigger shortlisting"),
        action_node(cx[1], 240, "Load applications"),
        action_node(cx[1], 320, "ML pre-filter scores every applicant"),
        decision_node(cx[1], 410, "in top 20%?"),
        action_node(cx[1], 540, "Anonymize resume (remove PII)"),
        action_node(cx[2], 640, "CTO + HR agents || evaluate in parallel"),
        action_node(cx[2], 740, "Critique agent judges confidence"),
        decision_node(cx[2], 850, "confident?"),
        action_node(cx[2], 980, "Final merge agent || compiles strengths + concerns"),
        action_node(cx[1], 1090, "Record evaluation"),
        decision_node(cx[1], 1190, "score ≥ threshold?"),
        action_node(cx[1], 1320, "Mark rejected with feedback"),
        action_node(cx[0], 1320, "Mark shortlisted"),
        end_node(cx[0], 1450),
    ]
    # Flows
    parts += [
        line_edge(cx[0], 101, cx[0], 128),                                          # start → trigger
        path_edge(f"M {cx[0] + 110} 150 L {cx[1] - 110} 240"),                       # trigger → load
        line_edge(cx[1], 263, cx[1], 298),                                           # load → ML
        line_edge(cx[1], 343, cx[1], 360),                                           # ML → decision
        # decision: no → mark rejected (right column, will be reached via cross-lane)
        path_edge(f"M {cx[1] + 80} 410 L {cx[1] + 80} 1320 L {cx[1] + 110} 1320",
                  guard="[bottom 80%]", guard_xy=(cx[1] + 96, 600)),
        line_edge(cx[1], 460, cx[1], 517, guard="[top 20%]"),                        # → anonymize
        path_edge(f"M {cx[1] + 110} 540 L {cx[2] - 110} 640"),                       # → CTO + HR
        line_edge(cx[2], 663, cx[2], 717),                                           # → critique
        line_edge(cx[2], 763, cx[2], 800),                                           # → confident?
        # confident? no → loop back to CTO+HR
        path_edge(f"M {cx[2] - 80} 850 L {cx[2] - 200} 850 L {cx[2] - 200} 640 L {cx[2] - 110} 640",
                  guard="[reflect]", guard_xy=(cx[2] - 260, 750)),
        line_edge(cx[2], 900, cx[2], 957, guard="[confident]"),                      # → final merge
        path_edge(f"M {cx[2] - 110} 980 L {cx[1] + 110} 1090"),                      # → record eval
        line_edge(cx[1], 1113, cx[1], 1140),                                         # → threshold?
        line_edge(cx[1], 1240, cx[1], 1297, guard="[no]"),                           # → rejected
        path_edge(f"M {cx[1] - 80} 1190 L {cx[0] + 110} 1320",
                  guard="[yes]", guard_xy=(cx[1] - 80, 1240)),                       # → shortlisted
        line_edge(cx[0], 1343, cx[0], 1437),                                         # → final
    ]
    parts.append(footer())
    return "\n".join(parts)


# ===========================================================================
# Subsystem 3: Recruiter Chatbot Agentic RAG
# ===========================================================================
def build_subsystem3() -> str:
    vw, vh = 1500, 1500
    ln = ["Recruiter", "Backend", "AI Service"]
    cx = [lane_center(i, len(ln), vw) for i in range(len(ln))]
    parts = [header("Subsystem 3 Activity", vw, vh), lanes(ln, vw, vh)]
    parts += [
        start_node(cx[0], 90),
        action_node(cx[0], 150, "Send message"),
        action_node(cx[1], 250, "Run input safety check"),
        action_node(cx[1], 350, "Recall recent conversation || summarize older turns"),
        action_node(cx[2], 460, "Determine recruiter intent"),
        decision_node(cx[2], 590, "intent?"),
        # 6 branches: 3 Backend (left side), 3 AI Service (right side), all vertically spaced
        action_node(cx[1], 770, "Semantic candidate search"),
        action_node(cx[1], 870, "Retrieve matching job"),
        action_node(cx[1], 970, "Show edit preview || await confirmation"),
        action_node(cx[2], 770, "Gather salary insights"),
        action_node(cx[2], 870, "Generate written response"),
        action_node(cx[2], 970, "Politely decline"),
        merge_node(cx[1], 1110),
        action_node(cx[1], 1230, "Stream answer back via SSE"),
        action_node(cx[1], 1330, "Persist conversation"),
        end_node(cx[0], 1430),
    ]
    parts += [
        line_edge(cx[0], 101, cx[0], 128),
        path_edge(f"M {cx[0] + 110} 150 L {cx[1] - 110} 250"),
        line_edge(cx[1], 273, cx[1], 327),
        path_edge(f"M {cx[1] + 110} 350 L {cx[2] - 110} 460"),
        line_edge(cx[2], 483, cx[2], 540),
        # 6 branches from intent decision
        path_edge(f"M {cx[2] - 80} 590 L {cx[1] + 110} 770", guard="[find]", guard_xy=(cx[1] + 240, 680)),
        path_edge(f"M {cx[2] - 80} 600 L {cx[1] + 110} 870", guard="[lookup]", guard_xy=(cx[1] + 240, 760)),
        path_edge(f"M {cx[2] - 80} 610 L {cx[1] + 110} 970", guard="[edit]", guard_xy=(cx[1] + 240, 850)),
        path_edge(f"M {cx[2] - 20} 640 L {cx[2] - 20} 747", guard="[salary]", guard_xy=(cx[2] + 4, 690)),
        path_edge(f"M {cx[2] + 20} 640 L {cx[2] + 20} 847", guard="[general]", guard_xy=(cx[2] + 44, 740)),
        path_edge(f"M {cx[2] + 60} 640 L {cx[2] + 60} 947", guard="[out of scope]", guard_xy=(cx[2] + 84, 820)),
        # branches → merge (Backend) - route Backend actions straight to merge
        path_edge(f"M {cx[1]} 793 L {cx[1]} 1070"),
        path_edge(f"M {cx[1] + 110} 870 L {cx[1] + 60} 1110"),
        path_edge(f"M {cx[1] + 110} 970 L {cx[1] + 60} 1110"),
        path_edge(f"M {cx[2] - 110} 770 L {cx[1] + 60} 1090"),
        path_edge(f"M {cx[2] - 110} 870 L {cx[1] + 60} 1110"),
        path_edge(f"M {cx[2] - 110} 970 L {cx[1] + 60} 1130"),
        line_edge(cx[1], 1150, cx[1], 1207),
        line_edge(cx[1], 1253, cx[1], 1307),
        path_edge(f"M {cx[1] - 110} 1330 L {cx[0] + 14} 1430"),
    ]
    parts.append(footer())
    return "\n".join(parts)


# ===========================================================================
# Subsystem 4: Resume Parsing + Gap Analysis
# ===========================================================================
def build_subsystem4() -> str:
    vw, vh = 1500, 1850
    ln = ["Candidate", "Backend", "AI Service"]
    cx = [lane_center(i, len(ln), vw) for i in range(len(ln))]
    # Sub-columns inside the wide Candidate lane.
    sub_l = cx[0] - 120
    sub_r = cx[0] + 120
    parts = [header("Subsystem 4 Activity", vw, vh), lanes(ln, vw, vh)]
    parts += [
        # --- Profile resume creation (top block) ---
        start_node(cx[0], 90),
        decision_node(cx[0], 200, "create resume?"),
        # Import branch (left sub-col)
        action_node(sub_l, 340, "Upload resume", w=190),
        action_node(cx[2], 460, "Extract skills, experience, || education, projects"),
        action_node(sub_l, 590, "Preview + confirm", w=190),
        # Build branch (right sub-col) — placed lower so it does not collide with the
        # Upload → Extract diagonal arrow.
        action_node(sub_r, 590, "Edit fields with || live preview", w=190),
        # Merge + save
        merge_node(cx[1], 720),
        action_node(cx[1], 840, "Save resume to profile"),
        end_node(cx[1], 940),

        # --- Apply flow (bottom block) ---
        start_node(cx[0], 1080),
        action_node(cx[0], 1150, "Open application form"),
        action_node(cx[2], 1260, "Run gap analysis || vs job description"),
        action_node(cx[0], 1380, "View fit score + missing skills"),
        decision_node(cx[0], 1500, "response?"),
        action_node(cx[2], 1640, "Propose safe edits || (factual fields frozen)"),
        decision_node(cx[2], 1760, "confirm?"),
        action_node(sub_r, 1640, "Submit updated", w=190),
        action_node(cx[1], 1760, "Submit original", w=210),
        end_node(cx[1], 1830),
    ]
    parts += [
        # Start → decision
        line_edge(cx[0], 101, cx[0], 150),
        # decision → import / build
        path_edge(f"M {cx[0] - 80} 200 L {sub_l} 317",
                  guard="[import]", guard_xy=(cx[0] - 220, 270)),
        path_edge(f"M {cx[0] + 80} 200 L {cx[0] + 80} 530 L {sub_r} 567",
                  guard="[build]", guard_xy=(cx[0] + 100, 380)),
        # Import chain
        path_edge(f"M {sub_l + 95} 340 L {cx[2] - 110} 460"),
        path_edge(f"M {cx[2] - 110} 460 L {sub_l + 95} 590"),
        path_edge(f"M {sub_l + 95} 590 L {cx[1] - 60} 720"),
        # Build → merge
        path_edge(f"M {sub_r + 95} 590 L {cx[1] - 60} 720"),
        # Merge → Save → end
        line_edge(cx[1], 760, cx[1], 817),
        line_edge(cx[1], 863, cx[1], 926),

        # --- Apply flow ---
        line_edge(cx[0], 1091, cx[0], 1127),
        path_edge(f"M {cx[0] + 110} 1150 L {cx[2] - 110} 1260"),
        path_edge(f"M {cx[2] - 110} 1260 L {cx[0] + 110} 1380"),
        line_edge(cx[0], 1403, cx[0], 1450),
        # response decision
        path_edge(f"M {cx[0] + 80} 1500 L {cx[2] - 110} 1640",
                  guard="[accept]", guard_xy=(cx[0] + 200, 1560)),
        path_edge(f"M {cx[0] - 80} 1500 L {cx[0] - 80} 1760 L {cx[1] - 110} 1760",
                  guard="[apply as-is]", guard_xy=(cx[0] - 230, 1620)),
        # accept: Propose edits → confirm? (both in AI lane)
        line_edge(cx[2], 1663, cx[2], 1710),
        # confirm? yes → Submit updated, no → Submit original
        path_edge(f"M {cx[2] - 80} 1760 L {sub_r + 95} 1640",
                  guard="[yes]", guard_xy=(cx[2] - 220, 1690)),
        path_edge(f"M {cx[2] - 80} 1760 L {cx[1] + 110} 1760",
                  guard="[no]", guard_xy=(cx[2] - 100, 1750)),
        # Both submit → end
        path_edge(f"M {sub_r} 1663 L {cx[1] - 14} 1830"),
        line_edge(cx[1], 1783, cx[1], 1816),
    ]
    parts.append(footer())
    return "\n".join(parts)


# ===========================================================================
# Subsystem 5: Whisper ASR Transcription + Scoring
# ===========================================================================
def build_subsystem5() -> str:
    vw, vh = 1400, 1520
    ln = ["Recruiter", "Backend", "AI Service"]
    cx = [lane_center(i, len(ln), vw) for i in range(len(ln))]
    parts = [header("Subsystem 5 Activity", vw, vh), lanes(ln, vw, vh)]
    parts += [
        start_node(cx[0], 90),
        action_node(cx[0], 150, "Upload interview recording"),
        action_node(cx[1], 240, "Store recording in S3"),
        action_node(cx[2], 340, "Fine-tuned Whisper transcribes"),
        decision_node(cx[2], 460, "transcription ok?"),
        action_node(cx[1] + 200, 580, "Mark for retry", w=160),
        finalflow_node(cx[1] + 200, 680),
        action_node(cx[1], 580, "Save transcript", w=160),
        action_node(cx[2], 720, "Evaluation agent scores transcript"),
        action_node(cx[1], 820, "Record AI evaluation"),
        decision_node(cx[1], 940, "add human scores?"),
        action_node(cx[0], 1080, "Record scores per criterion"),
        merge_node(cx[1], 1200),
        action_node(cx[1], 1310, "Final score = weighted(AI, human)"),
        action_node(cx[0], 1410, "Show side-by-side evaluation"),
        end_node(cx[0], 1480),
    ]
    parts += [
        line_edge(cx[0], 101, cx[0], 128),
        path_edge(f"M {cx[0] + 110} 150 L {cx[1] - 110} 240"),
        path_edge(f"M {cx[1] + 110} 240 L {cx[2] - 110} 340"),
        line_edge(cx[2], 363, cx[2], 410),
        # transcription decision
        path_edge(f"M {cx[2] - 80} 460 L {cx[1] + 200 - 80} 557",
                  guard="[failed]", guard_xy=(cx[2] - 140, 510)),
        line_edge(cx[1] + 200, 603, cx[1] + 200, 666),  # Mark for retry → flow final
        path_edge(f"M {cx[2] - 80} 470 L {cx[1] + 80} 557",
                  guard="[success]", guard_xy=(cx[2] - 200, 540)),
        # Save transcript → Evaluation agent (drop down then diagonal to avoid Mark-for-retry box)
        path_edge(f"M {cx[1]} 603 L {cx[1]} 670 L {cx[2] - 110} 720"),
        # Evaluation agent → Record AI evaluation
        path_edge(f"M {cx[2] - 110} 720 L {cx[1] + 110} 820"),
        line_edge(cx[1], 843, cx[1], 890),
        path_edge(f"M {cx[1] - 80} 940 L {cx[0] + 110} 1080",
                  guard="[yes]", guard_xy=(cx[1] - 220, 1010)),
        path_edge(f"M {cx[1] + 80} 940 L {cx[1] + 60} 1200",
                  guard="[no, AI only]", guard_xy=(cx[1] + 90, 1060)),
        path_edge(f"M {cx[0] + 110} 1080 L {cx[1] - 60} 1200"),
        line_edge(cx[1], 1240, cx[1], 1287),
        path_edge(f"M {cx[1] - 110} 1310 L {cx[0] + 110} 1410"),
        line_edge(cx[0], 1433, cx[0], 1466),
    ]
    parts.append(footer())
    return "\n".join(parts)

# (separator)
# ===========================================================================
# Subsystem 6: AI Job Drafting + Hybrid Search
# ===========================================================================
def build_subsystem6() -> str:
    vw, vh = 1600, 1600
    ln = ["Recruiter / Candidate", "Backend", "AI Service"]
    cx = [lane_center(i, len(ln), vw) for i in range(len(ln))]
    parts = [header("Subsystem 6 Activity", vw, vh), lanes(ln, vw, vh)]
    parts += [
        # ---- Single start, single action? decision ----
        start_node(cx[0], 90),
        decision_node(cx[0], 200, "action?"),
        # ---- AI draft branch ----
        action_node(cx[0], 340, "Provide role idea + keywords"),
        action_node(cx[2], 450, "Gather salary benchmarks"),
        action_node(cx[2], 560, "Generate draft + flag missing fields"),
        action_node(cx[0], 680, "Review draft"),
        decision_node(cx[0], 800, "decision?"),
        action_node(cx[1], 940, "Publish job"),
        action_node(cx[1], 1050, "Store draft privately"),
        action_node(cx[1], 1160, "Discard draft"),
        end_node(cx[1], 1240),
        # ---- Search branch (separate sub-flow) ----
        action_node(cx[0], 1320, "Enter natural-language search"),
        action_node(cx[1], 1420, "Hybrid semantic search || (dense + BM25 + RRF)"),
        action_node(cx[0], 1530, "View ranked results"),
        end_node(cx[0], 1580),
    ]
    parts += [
        line_edge(cx[0], 101, cx[0], 150),
        # action? → 3 branches
        line_edge(cx[0], 250, cx[0], 317, guard="[AI draft]"),
        # manual branch detours past Provide role idea via x = cx[0]+200 down to Publish
        path_edge(
            f"M {cx[0] + 80} 200 L {cx[0] + 200} 250 L {cx[0] + 200} 940 L {cx[1] - 110} 940",
            guard="[manual]", guard_xy=(cx[0] + 210, 480),
        ),
        # search branch detours past Review draft on the left to Enter search
        path_edge(
            f"M {cx[0] - 80} 200 L {cx[0] - 200} 250 L {cx[0] - 200} 1290 L {cx[0] - 110} 1290",
            guard="[search]", guard_xy=(cx[0] - 270, 700),
        ),
        # AI draft chain
        path_edge(f"M {cx[0] + 110} 340 L {cx[2] - 110} 450"),
        line_edge(cx[2], 473, cx[2], 537),
        path_edge(f"M {cx[2] - 110} 560 L {cx[0] + 110} 680"),
        line_edge(cx[0], 703, cx[0], 750),
        # decision? → improve loop / approve / save / discard
        path_edge(
            f"M {cx[2] - 110} 560 L {cx[2] - 230} 560 L {cx[2] - 230} 800 L {cx[0] + 80} 800",
            guard="[improve]", guard_xy=(cx[2] - 320, 680),
        ),
        path_edge(f"M {cx[0] + 80} 800 L {cx[1] - 110} 940",
                  guard="[approve]", guard_xy=(cx[0] + 100, 870)),
        path_edge(f"M {cx[0] + 80} 800 L {cx[1] - 110} 1050",
                  guard="[save]", guard_xy=(cx[0] + 100, 940)),
        path_edge(f"M {cx[0] + 80} 800 L {cx[1] - 110} 1160",
                  guard="[discard]", guard_xy=(cx[0] + 100, 1010)),
        # publish/store/discard → AI-draft end node (cx[1], 1240)
        # Publish and Store route around the right side to avoid crossing later boxes.
        path_edge(f"M {cx[1] + 110} 940 L {cx[1] + 220} 940 L {cx[1] + 220} 1240 L {cx[1] + 14} 1240"),
        path_edge(f"M {cx[1] + 110} 1050 L {cx[1] + 180} 1050 L {cx[1] + 180} 1240 L {cx[1] + 14} 1240"),
        path_edge(f"M {cx[1]} 1183 L {cx[1]} 1226"),
        # Search chain
        path_edge(f"M {cx[0] + 110} 1320 L {cx[1] - 110} 1420"),
        path_edge(f"M {cx[1] - 110} 1420 L {cx[0] + 110} 1530"),
        line_edge(cx[0], 1553, cx[0], 1566),
    ]
    parts.append(footer())
    return "\n".join(parts)


# ===========================================================================
# Subsystem 7: Outreach + Interview Scheduling
# ===========================================================================
def build_subsystem7() -> str:
    vw, vh = 1600, 1500
    ln = ["Recruiter", "Backend", "AI Service", "Candidate"]
    cx = [lane_center(i, len(ln), vw) for i in range(len(ln))]
    parts = [header("Subsystem 7 Activity", vw, vh), lanes(ln, vw, vh)]
    parts += [
        start_node(cx[0], 90),
        action_node(cx[0], 150, "Finalize shortlist"),
        action_node(cx[2], 240, "Draft personalized email per candidate"),
        decision_node(cx[2], 360, "outcome?"),
        action_node(cx[2], 510, "Warm invite || + interview booking link"),
        action_node(cx[2], 630, "Rejection note || + AI feedback", w=210),
        merge_node(cx[1], 760),
        action_node(cx[0], 870, "Review and approve drafts"),
        action_node(cx[1], 970, "Send approved emails"),
        decision_node(cx[1], 1080, "outreach type?"),
        finalflow_node(cx[1], 1240),
        action_node(cx[3], 1240, "Select interview slot"),
        action_node(cx[1], 1350, "Receive booking confirmation"),
        action_node(cx[1], 1430, "Schedule interview"),
        action_node(cx[0], 1430, "Notify recruiter + candidate"),
        end_node(cx[0], 1480),
    ]
    parts += [
        line_edge(cx[0], 101, cx[0], 128),
        path_edge(f"M {cx[0] + 110} 150 L {cx[2] - 110} 240"),
        line_edge(cx[2], 263, cx[2], 310),
        # outcome branches
        path_edge(f"M {cx[2] - 80} 360 L {cx[2] - 80} 487",
                  guard="[shortlist]", guard_xy=(cx[2] - 220, 420)),
        path_edge(f"M {cx[2] + 80} 360 L {cx[2] + 80} 607",
                  guard="[reject]", guard_xy=(cx[2] + 100, 480)),
        # Both → merge in Backend
        path_edge(f"M {cx[2] - 110} 510 L {cx[1] + 60} 760"),
        path_edge(f"M {cx[2] - 110} 630 L {cx[1] + 60} 760"),
        # merge → review → send
        path_edge(f"M {cx[1] - 60} 760 L {cx[0] + 110} 870"),
        path_edge(f"M {cx[0] + 110} 870 L {cx[1] - 110} 970"),
        line_edge(cx[1], 993, cx[1], 1030),
        # outreach type? → either select slot (Candidate) or flow-final (reject)
        path_edge(f"M {cx[1] + 80} 1080 L {cx[3] - 110} 1240",
                  guard="[shortlist]", guard_xy=(cx[1] + 200, 1150)),
        path_edge(f"M {cx[1] - 80} 1080 L {cx[1] - 14} 1240",
                  guard="[reject]", guard_xy=(cx[1] - 200, 1150)),
        # candidate → backend chain
        path_edge(f"M {cx[3] - 110} 1240 L {cx[1] + 110} 1350"),
        path_edge(f"M {cx[1]} 1373 L {cx[1]} 1407"),
        path_edge(f"M {cx[1] - 110} 1430 L {cx[0] + 110} 1430"),
        line_edge(cx[0], 1453, cx[0], 1466),
    ]
    parts.append(footer())
    return "\n".join(parts)


DIAGRAMS = {
    "activity_subsystem2.html": build_subsystem2,
    "activity_subsystem3.html": build_subsystem3,
    "activity_subsystem4.html": build_subsystem4,
    "activity_subsystem5.html": build_subsystem5,
    "activity_subsystem6.html": build_subsystem6,
    "activity_subsystem7.html": build_subsystem7,
}

ALL_HTML = [
    "usecase.html",
    "activity_subsystem1.html",
    "activity_subsystem2.html",
    "activity_subsystem3.html",
    "activity_subsystem4.html",
    "activity_subsystem5.html",
    "activity_subsystem6.html",
    "activity_subsystem7.html",
]


def write_html_files() -> None:
    for name, builder in DIAGRAMS.items():
        (DOCS / name).write_text(builder(), encoding="utf-8")
        print(f"wrote {name}")


def screenshot_all() -> None:
    from playwright.sync_api import sync_playwright

    brave = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=brave)
        page = browser.new_page(viewport={"width": 1800, "height": 1200}, device_scale_factor=2)
        for html_name in ALL_HTML:
            html_path = DOCS / html_name
            if not html_path.exists():
                print(f"skip {html_name}: missing")
                continue
            page.goto(f"file://{html_path}")
            page.locator("svg").screenshot(path=str(DOCS / html_name.replace(".html", ".png")))
            print(f"rendered {html_name} → png")
        browser.close()


if __name__ == "__main__":
    write_html_files()
    screenshot_all()
