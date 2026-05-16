"""Generate low-fidelity wireframe PNGs for the FYP report.

Lo-fi conventions: greyscale only, simple boxes, lines for text content,
X-marked rectangles for images, no color-coded charts or pills.
Layouts mirror the actual ConvexHire UI (top navbar, no sidebar) but stay rough.

Run from backend/:
    uv run --with Pillow python scripts/gen_wireframes.py
Outputs PNGs to <repo_root>/docs/wireframes/.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = REPO_ROOT / "docs" / "wireframes"
OUT_DIR.mkdir(parents=True, exist_ok=True)
W, H = 1600, 1100
BG = (255, 255, 255)
STROKE = (90, 90, 90)
STROKE_SOFT = (170, 170, 170)
FILL = (235, 235, 235)
FILL_DARK = (200, 200, 200)
HATCH = (160, 160, 160)
TEXT_DARK = (40, 40, 40)
TEXT_MUTED = (120, 120, 120)


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for candidate in (
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


F_TITLE = load_font(34)
F_BIG = load_font(24)
F_MED = load_font(20)
F_SMALL = load_font(16)
F_TINY = load_font(14)


def base_canvas(h: int = H) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, h), BG)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W - 1, h - 1), outline=STROKE, width=1)
    return img, d


def rect(d, xy, fill=None):
    d.rectangle(xy, outline=STROKE, fill=fill, width=1)


def text_line(d, x: int, y: int, length: int, weight: int = 8) -> None:
    """Draw a placeholder line representing text."""
    d.rectangle((x, y, x + length, y + weight), fill=FILL_DARK)


def x_image(d, xy) -> None:
    """Image placeholder: rectangle with X through it."""
    rect(d, xy, fill=FILL)
    x1, y1, x2, y2 = xy
    d.line((x1, y1, x2, y2), fill=STROKE_SOFT, width=1)
    d.line((x1, y2, x2, y1), fill=STROKE_SOFT, width=1)


def navbar(d, active: str, items: tuple[str, ...]) -> None:
    rect(d, (0, 0, W, 70))
    # Logo placeholder
    rect(d, (20, 18, 60, 50), fill=FILL)
    d.line((20, 18, 60, 50), fill=STROKE_SOFT, width=1)
    d.line((20, 50, 60, 18), fill=STROKE_SOFT, width=1)
    d.text((72, 26), "Logo", fill=TEXT_DARK, font=F_BIG)
    # Center nav (dynamic spacing)
    widths = [d.textlength(item, font=F_MED) for item in items]
    gap = 70
    total = sum(widths) + gap * (len(items) - 1)
    x = W // 2 - int(total) // 2
    for i, item in enumerate(items):
        d.text((x, 28), item, fill=TEXT_DARK, font=F_MED)
        if item == active:
            d.line((x, 58, x + int(widths[i]), 58), fill=STROKE, width=2)
        x += int(widths[i]) + gap
    # Right cluster — bell icon + avatar
    rect(d, (W - 130, 22, W - 90, 50))
    d.text((W - 122, 28), "Bell", fill=TEXT_MUTED, font=F_TINY)
    d.ellipse((W - 70, 18, W - 30, 58), outline=STROKE, width=1)
    d.text((W - 66, 30), "Avatar", fill=TEXT_MUTED, font=F_TINY)


def section_title(d, x: int, y: int, label: str) -> None:
    d.text((x, y), label, fill=TEXT_DARK, font=F_BIG)


def kpi_card(d, xy, value: str, label: str) -> None:
    rect(d, xy)
    x1, y1, x2, _ = xy
    d.text((x1 + 16, y1 + 14), value, fill=TEXT_DARK, font=F_TITLE)
    d.text((x1 + 16, y1 + 60), label, fill=TEXT_MUTED, font=F_SMALL)


def period_tabs(d, x: int, y: int) -> None:
    for i, lbl in enumerate(("7D", "30D", "90D")):
        bx = x + i * 60
        rect(d, (bx, y, bx + 50, y + 30))
        d.text((bx + 14, y + 6), lbl, fill=TEXT_DARK, font=F_SMALL)


def hbar(d, x: int, y: int, bar_width: int, pct: float, label: str, value: str) -> None:
    d.text((x, y - 2), label, fill=TEXT_DARK, font=F_SMALL)
    track_x = x + 230
    rect(d, (track_x, y + 6, track_x + bar_width, y + 22))
    fill_w = int(bar_width * pct)
    d.rectangle((track_x, y + 6, track_x + fill_w, y + 22), fill=FILL_DARK)
    d.text((track_x + bar_width + 14, y - 2), value, fill=TEXT_DARK, font=F_SMALL)


def metric_box(d, xy, label: str, value: str) -> None:
    rect(d, xy)
    x1, y1, _, _ = xy
    d.text((x1 + 14, y1 + 10), label, fill=TEXT_MUTED, font=F_TINY)
    d.text((x1 + 14, y1 + 32), value, fill=TEXT_DARK, font=F_BIG)


def bar_chart(d, xy, heights: list[float]) -> None:
    x1, y1, x2, y2 = xy
    base = y2 - 20
    slot = (x2 - x1 - 40) / len(heights)
    for i, h in enumerate(heights):
        bx = x1 + 20 + int(i * slot) + 4
        bw = max(6, int(slot - 8))
        bh = int((y2 - y1 - 60) * h)
        d.rectangle((bx, base - bh, bx + bw, base), outline=STROKE, fill=FILL_DARK, width=1)
    d.line((x1 + 20, base, x2 - 20, base), fill=STROKE, width=1)


def chip(d, xy, label: str) -> None:
    x1, y1, _, _ = xy
    rect(d, xy, fill=FILL)
    d.text((x1 + 10, y1 + 4), label, fill=TEXT_DARK, font=F_TINY)


# --- 1. Recruiter dashboard ---
def wf_recruiter():
    img, d = base_canvas()
    navbar(d, "Jobs", ("Jobs", "Talent", "Interviews", "Team"))
    # Greeting
    d.text((30, 100), "Heading: Good morning, <name>", fill=TEXT_DARK, font=F_TITLE)
    text_line(d, 30, 146, 480, 6)
    period_tabs(d, 30, 180)

    # KPI row (5)
    kpis = (("38", "Applicants"), ("32", "Reviews"), ("13", "Interviews"), ("2", "Offers"), ("10", "Drafts to approve"))
    for i, (v, l) in enumerate(kpis):
        x = 30 + i * 308
        kpi_card(d, (x, 230, x + 290, 340), v, l)

    # Company funnel card
    rect(d, (30, 360, 770, 690))
    section_title(d, 50, 376, "Company funnel")
    text_line(d, 50, 410, 380, 6)
    d.line((48, 432, 750, 432), fill=STROKE_SOFT, width=1)
    funnel = (
        ("Applied", 0.95, "51"),
        ("Shortlisted", 0.20, "6"),
        ("Interview Booked", 0.28, "8"),
        ("Interview Completed", 0.10, "2"),
        ("Offer", 0.08, "2"),
    )
    for i, (lbl, pct, val) in enumerate(funnel):
        hbar(d, 50, 460 + i * 42, 380, pct, lbl, val)

    # Pipeline velocity card
    rect(d, (790, 360, W - 30, 690))
    section_title(d, 810, 376, "Pipeline velocity")
    text_line(d, 810, 410, 420, 6)
    d.line((808, 432, W - 50, 432), fill=STROKE_SOFT, width=1)
    velocity_top = (("TO REVIEW", "13.2d"), ("TO SHORTLIST", "13.4d"), ("TO INTERVIEW", "17d"))
    for i, (l, v) in enumerate(velocity_top):
        x = 810 + i * 248
        metric_box(d, (x, 458, x + 230, 540), l, v)
    velocity_bot = (("Shortlisted", "6"), ("Interview booked", "8"), ("Offers", "2"))
    for i, (l, v) in enumerate(velocity_bot):
        x = 810 + i * 248
        metric_box(d, (x, 560, x + 230, 660), l, v)

    # Outreach summary
    rect(d, (30, 710, 590, H - 30))
    section_title(d, 50, 726, "Outreach summary")
    text_line(d, 50, 760, 300, 6)
    d.line((48, 784, 570, 784), fill=STROKE_SOFT, width=1)
    d.text((50, 798), "SHORTLIST", fill=TEXT_MUTED, font=F_TINY)
    for i, (v, l) in enumerate((("11", "Sent"), ("2", "Approved"), ("2", "Drafted"), ("0", "Discarded"))):
        x = 50 + i * 134
        metric_box(d, (x, 822, x + 124, 906), l, v)
    d.text((50, 920), "REJECTION", fill=TEXT_MUTED, font=F_TINY)
    for i, (v, l) in enumerate((("14", "Sent"), ("6", "Approved"), ("0", "Drafted"), ("2", "Discarded"))):
        x = 50 + i * 134
        metric_box(d, (x, 944, x + 124, H - 50), l, v)

    # Hiring activity
    rect(d, (610, 710, W - 30, H - 30))
    section_title(d, 630, 726, "Hiring activity")
    text_line(d, 630, 760, 420, 6)
    # Legend placeholders
    for i, lbl in enumerate(("Applicants", "Reviews", "Interviews")):
        lx = 630 + i * 140
        rect(d, (lx, 786, lx + 16, 800), fill=FILL_DARK)
        d.text((lx + 22, 784), lbl, fill=TEXT_MUTED, font=F_TINY)
    bars = [0.18, 0.32, 0.78, 0.22, 0.55, 0.20, 0.18, 0.08, 0.10, 0.85]
    bar_chart(d, (630, 820, W - 50, H - 50), bars)

    img.save(OUT_DIR / "recruiter.png")


# --- 2. Candidate dashboard ---
def wf_candidate():
    img, d = base_canvas(h=1200)
    navbar(d, "Jobs", ("Jobs", "Applications", "Interviews"))
    d.text((30, 100), "Heading: Good morning, <name>", fill=TEXT_DARK, font=F_TITLE)
    chip(d, (560, 108, 760, 138), "o Open to Work | Active")
    chip(d, (780, 108, 880, 138), "[Turn off]")
    text_line(d, 30, 146, 420, 6)
    period_tabs(d, 30, 180)

    # KPI row (4)
    kpis = (("11", "Applications"), ("3", "Shortlisted"), ("1", "Interviews"), ("0", "Offers"))
    for i, (v, l) in enumerate(kpis):
        x = 30 + i * 388
        kpi_card(d, (x, 230, x + 370, 340), v, l)

    # Application funnel
    rect(d, (30, 360, 790, 680))
    section_title(d, 50, 376, "Application funnel")
    text_line(d, 50, 410, 360, 6)
    d.line((48, 432, 770, 432), fill=STROKE_SOFT, width=1)
    fn = (
        ("Applied", 0.95, "20"),
        ("Shortlisted", 0.18, "3"),
        ("Interview", 0.18, "3"),
        ("Offer", 0.02, "0"),
        ("Rejected", 0.50, "8"),
    )
    for i, (lbl, pct, val) in enumerate(fn):
        hbar(d, 50, 460 + i * 40, 400, pct, lbl, val)

    # Readiness
    rect(d, (810, 360, W - 30, 680))
    section_title(d, 830, 376, "Readiness")
    text_line(d, 830, 410, 420, 6)
    d.line((828, 432, W - 50, 432), fill=STROKE_SOFT, width=1)
    # Donut placeholder: outer circle + inner circle + label
    cx, cy, r = 950, 560, 76
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=STROKE, width=2)
    d.ellipse((cx - r + 28, cy - r + 28, cx + r - 28, cy + r - 28), outline=STROKE, width=1)
    d.text((cx - 30, cy - 12), "91%", fill=TEXT_DARK, font=F_BIG)
    d.text((cx - 38, cy + 16), "COMPLETE", fill=TEXT_MUTED, font=F_TINY)
    for i, (l, v) in enumerate((("TARGET ROLES", "3"), ("SKILLS", "15"), ("OPEN TO WORK", "Active"))):
        y = 510 + i * 50
        d.text((1080, y), l, fill=TEXT_MUTED, font=F_TINY)
        d.text((W - 110, y), v, fill=TEXT_DARK, font=F_MED)

    # Pipeline speed
    rect(d, (30, 700, W - 30, 900))
    section_title(d, 50, 716, "Pipeline speed")
    text_line(d, 50, 750, 360, 6)
    d.line((48, 774, W - 50, 774), fill=STROKE_SOFT, width=1)
    for i, (l, v) in enumerate((("AVG. TO SHORTLIST", "14.5d"), ("AVG. TO INTERVIEW", "18.3d"), ("AVG. TO OFFER", "N/A"))):
        x = 50 + i * 510
        metric_box(d, (x, 790, x + 490, 880), l, v)

    # Activity over time
    rect(d, (30, 920, W - 30, 1170))
    section_title(d, 50, 936, "Activity over time")
    text_line(d, 50, 970, 360, 6)
    bars = [0.85, 0.05, 0.05, 0.55, 0.40, 0.55, 0.45, 0.05, 0.05, 0.05]
    bar_chart(d, (50, 1000, W - 50, 1160), bars)

    img.save(OUT_DIR / "candidate.png")


# --- 3. Shortlist drawer over job detail ---
def wf_shortlist():
    img, d = base_canvas()
    navbar(d, "Jobs", ("Jobs", "Talent", "Interviews", "Team"))
    # Back link + heading
    d.text((30, 100), "< Back to Jobs", fill=TEXT_DARK, font=F_SMALL)
    d.text((30, 134), "Heading: Job title", fill=TEXT_DARK, font=F_TITLE)
    text_line(d, 30, 184, 540, 6)
    # Top tabs
    for i, t in enumerate(("Pipeline", "Description")):
        x = 30 + i * 140
        d.text((x, 220), t, fill=TEXT_DARK, font=F_MED)
        if i == 0:
            d.line((x, 252, x + int(d.textlength(t, font=F_MED)), 252), fill=STROKE, width=2)
    d.line((30, 252, 960, 252), fill=STROKE_SOFT, width=1)

    # Stage tabs
    stages = (("Applied", "0"), ("Shortlist", "3"), ("Interview", "0"), ("Offer", "0"), ("Rejected", "2"))
    for i, (s, n) in enumerate(stages):
        x = 30 + i * 170
        d.text((x, 274), s, fill=TEXT_DARK, font=F_SMALL)
        cw = int(d.textlength(s, font=F_SMALL))
        chip(d, (x + cw + 8, 274, x + cw + 44, 296), n)
        if i == 1:
            d.line((x, 304, x + cw, 304), fill=STROKE, width=2)

    # Outreach strip
    d.text((30, 328), "OUTREACH", fill=TEXT_MUTED, font=F_TINY)
    d.text((140, 326), "0 of 3 drafted", fill=TEXT_DARK, font=F_SMALL)
    chip(d, (280, 322, 330, 344), "...")

    # Applicant rows
    applicants = ("Applicant name 1", "Applicant name 2", "Applicant name 3")
    for i, n in enumerate(applicants):
        y = 370 + i * 100
        rect(d, (30, y, 960, y + 84))
        d.ellipse((50, y + 18, 100, y + 68), outline=STROKE, fill=FILL, width=1)
        d.text((118, y + 18), n, fill=TEXT_DARK, font=F_MED)
        text_line(d, 118, y + 50, 260, 6)
        chip(d, (820, y + 30, 920, y + 56), "Pending")

    # Drawer
    drawer_x = 980
    rect(d, (drawer_x, 90, W - 30, H - 30), fill=BG)
    # Header
    d.ellipse((drawer_x + 20, 110, drawer_x + 70, 160), outline=STROKE, fill=FILL, width=1)
    d.text((drawer_x + 86, 116), "Applicant name", fill=TEXT_DARK, font=F_BIG)
    text_line(d, drawer_x + 86, 152, 220, 6)
    d.text((drawer_x + 320, 116), "Change status", fill=TEXT_MUTED, font=F_TINY)
    rect(d, (drawer_x + 320, 138, W - 50, 172))
    d.text((drawer_x + 330, 146), "Current: Shortlisted", fill=TEXT_DARK, font=F_TINY)
    d.text((W - 50, 116), "X", fill=TEXT_DARK, font=F_MED)

    # Other job pills
    for i in range(4):
        x = drawer_x + 20 + i * 140
        rect(d, (x, 196, x + 130, 256), fill=FILL)
        d.text((x + 10, 204), f"Job pill {i + 1}", fill=TEXT_DARK, font=F_TINY)
        text_line(d, x + 10, 232, 90, 6)

    # Profile tabs
    for i, t in enumerate(("Profile", "Interview", "Outreach", "Resume")):
        x = drawer_x + 20 + i * 130
        d.text((x, 280), t, fill=TEXT_DARK, font=F_SMALL)
        if i == 0:
            d.line((x, 306, x + int(d.textlength(t, font=F_SMALL)), 306), fill=STROKE, width=2)
    d.line((drawer_x + 20, 306, W - 50, 306), fill=STROKE_SOFT, width=1)

    # Shortlisting evaluation card
    rect(d, (drawer_x + 20, 326, W - 50, 720), fill=FILL)
    d.text((drawer_x + 38, 342), "SHORTLISTING EVALUATION", fill=TEXT_MUTED, font=F_TINY)
    text_line(d, drawer_x + 38, 372, 380, 6)
    text_line(d, drawer_x + 38, 388, 240, 6)
    d.text((drawer_x + 38, 418), "Score (0-100)", fill=TEXT_DARK, font=F_TINY)
    rect(d, (drawer_x + 38, 442, drawer_x + 138, 480), fill=BG)
    d.text((drawer_x + 72, 450), "79", fill=TEXT_DARK, font=F_MED)
    d.text((drawer_x + 38, 498), "Strengths", fill=TEXT_DARK, font=F_SMALL)
    d.text((drawer_x + 38, 528), "v", fill=TEXT_DARK, font=F_SMALL)
    rect(d, (drawer_x + 68, 524, W - 70, 556), fill=BG)
    d.text((drawer_x + 78, 532), "Add strength", fill=TEXT_MUTED, font=F_TINY)
    d.text((drawer_x + 38, 568), "+ Add strength", fill=TEXT_DARK, font=F_TINY)
    d.text((drawer_x + 38, 596), "Gaps", fill=TEXT_DARK, font=F_SMALL)
    d.text((drawer_x + 38, 626), "x", fill=TEXT_DARK, font=F_SMALL)
    rect(d, (drawer_x + 68, 622, W - 70, 654), fill=BG)
    d.text((drawer_x + 78, 630), "Add gap", fill=TEXT_MUTED, font=F_TINY)
    d.text((drawer_x + 38, 666), "+ Add gap", fill=TEXT_DARK, font=F_TINY)

    # Save button
    rect(d, (drawer_x + 38, 698, drawer_x + 218, 730), fill=FILL_DARK)
    d.text((drawer_x + 70, 706), "Save evaluation", fill=TEXT_DARK, font=F_SMALL)

    # Timeline
    d.text((drawer_x + 38, 758), "TIMELINE", fill=TEXT_MUTED, font=F_TINY)
    d.ellipse((drawer_x + 38, 788, drawer_x + 48, 798), outline=STROKE, fill=FILL_DARK, width=1)
    d.text((drawer_x + 58, 784), "New applicant", fill=TEXT_DARK, font=F_TINY)
    text_line(d, drawer_x + 58, 808, 280, 6)
    text_line(d, drawer_x + 58, 828, 140, 6)

    img.save(OUT_DIR / "shortlist.png")


# --- 4. Floating recruiter chat panel ---
def wf_chat():
    img, d = base_canvas()
    navbar(d, "Jobs", ("Jobs", "Talent", "Interviews", "Team"))

    # Background page (faded content suggestion)
    d.text((30, 100), "Page content in background", fill=TEXT_MUTED, font=F_SMALL)
    for i in range(4):
        x = 30 + i * 156
        rect(d, (x, 130, x + 144, 212), fill=FILL)
        d.text((x + 14, 138), f"KPI {i + 1}", fill=TEXT_MUTED, font=F_TINY)
        text_line(d, x + 14, 168, 100, 6)
    section_title(d, 30, 240, "Team overview")
    text_line(d, 30, 274, 360, 6)
    for i in range(5):
        y = 310 + i * 50
        rect(d, (30, y, 920, y + 40), fill=BG)
        d.ellipse((44, y + 8, 68, y + 32), outline=STROKE, fill=FILL, width=1)
        text_line(d, 84, y + 16, 220, 6)

    # Floating chat panel
    panel_x1, panel_y1, panel_x2, panel_y2 = 980, 90, W - 30, H - 30
    rect(d, (panel_x1, panel_y1, panel_x2, panel_y2), fill=BG)
    # Header
    rect(d, (panel_x1 + 18, panel_y1 + 18, panel_x1 + 50, panel_y1 + 50), fill=FILL)
    d.text((panel_x1 + 60, panel_y1 + 22), "Assistant", fill=TEXT_DARK, font=F_BIG)
    for i, ch in enumerate(("+", "O", "X")):
        bx = panel_x2 - 130 + i * 40
        rect(d, (bx, panel_y1 + 18, bx + 30, panel_y1 + 50))
        d.text((bx + 10, panel_y1 + 24), ch, fill=TEXT_DARK, font=F_SMALL)
    d.line((panel_x1, panel_y1 + 72, panel_x2, panel_y1 + 72), fill=STROKE_SOFT, width=1)

    # User message bubble (right-aligned)
    user_y = panel_y1 + 100
    rect(d, (panel_x1 + 80, user_y, panel_x2 - 30, user_y + 70), fill=FILL)
    d.text((panel_x1 + 96, user_y + 10), "User message", fill=TEXT_DARK, font=F_SMALL)
    text_line(d, panel_x1 + 96, user_y + 36, 280, 6)
    text_line(d, panel_x1 + 96, user_y + 52, 200, 6)

    # AI response
    ai_y = user_y + 110
    rect(d, (panel_x1 + 20, ai_y, panel_x1 + 50, ai_y + 30), fill=FILL)
    d.text((panel_x1 + 60, ai_y + 4), "Assistant reply", fill=TEXT_DARK, font=F_SMALL)
    text_line(d, panel_x1 + 60, ai_y + 36, 400, 6)
    text_line(d, panel_x1 + 60, ai_y + 54, 360, 6)
    d.text((panel_x1 + 60, ai_y + 76), "1.", fill=TEXT_DARK, font=F_TINY)
    text_line(d, panel_x1 + 80, ai_y + 80, 360, 6)
    d.text((panel_x1 + 60, ai_y + 100), "2.", fill=TEXT_DARK, font=F_TINY)
    text_line(d, panel_x1 + 80, ai_y + 104, 320, 6)

    # Match result cards
    for i in range(2):
        cy = ai_y + 140 + i * 90
        rect(d, (panel_x1 + 22, cy, panel_x2 - 30, cy + 76), fill=FILL)
        d.ellipse((panel_x1 + 38, cy + 14, panel_x1 + 78, cy + 54), outline=STROKE, fill=BG, width=1)
        d.text((panel_x1 + 96, cy + 14), "Candidate name", fill=TEXT_DARK, font=F_SMALL)
        text_line(d, panel_x1 + 96, cy + 42, 200, 6)
        chip(d, (panel_x2 - 130, cy + 22, panel_x2 - 60, cy + 46), "status")

    # Show more
    d.text((panel_x1 + 22, ai_y + 330), "v Show more matches", fill=TEXT_DARK, font=F_TINY)

    # Input bar
    inp_y = panel_y2 - 60
    rect(d, (panel_x1 + 20, inp_y, panel_x2 - 80, inp_y + 44))
    d.text((panel_x1 + 34, inp_y + 14), "Ask something...", fill=TEXT_MUTED, font=F_TINY)
    rect(d, (panel_x2 - 68, inp_y, panel_x2 - 24, inp_y + 44), fill=FILL)
    d.text((panel_x2 - 60, inp_y + 14), "Send", fill=TEXT_DARK, font=F_TINY)

    img.save(OUT_DIR / "chat.png")


# --- 5. Find Jobs (candidate) ---
def wf_jobs():
    img, d = base_canvas(h=1200)
    navbar(d, "Jobs", ("Jobs", "Applications", "Interviews"))
    # Heading row
    d.text((30, 100), "Find Jobs", fill=TEXT_DARK, font=F_TITLE)
    text_line(d, 30, 150, 480, 6)
    d.text((W - 200, 110), "7 jobs available", fill=TEXT_MUTED, font=F_SMALL)

    # Search row
    rect(d, (30, 200, 700, 248))
    d.text((46, 214), "Q  Search jobs by title", fill=TEXT_MUTED, font=F_SMALL)
    rect(d, (720, 200, 880, 248))
    d.text((738, 214), "All Types  v", fill=TEXT_DARK, font=F_SMALL)
    rect(d, (900, 200, 1180, 248))
    d.text((918, 214), "o  Location...", fill=TEXT_MUTED, font=F_SMALL)
    rect(d, (1200, 200, 1290, 248))
    d.text((1218, 214), "Min", fill=TEXT_MUTED, font=F_SMALL)
    d.text((1300, 218), "-", fill=TEXT_DARK, font=F_SMALL)
    rect(d, (1310, 200, 1400, 248))
    d.text((1328, 214), "Max", fill=TEXT_MUTED, font=F_SMALL)
    rect(d, (1420, 200, W - 30, 248), fill=FILL_DARK)
    d.text((1490, 214), "Search", fill=TEXT_DARK, font=F_SMALL)

    # Job card grid (4 cols x 2 rows)
    card_w, card_h = 370, 380
    gap_x = 20
    cols = 4
    grid_x = 30
    grid_y = 290
    for i in range(8):
        col = i % cols
        row = i // cols
        x = grid_x + col * (card_w + gap_x)
        y = grid_y + row * (card_h + 30)
        rect(d, (x, y, x + card_w, y + card_h))
        # Logo + title
        d.ellipse((x + 20, y + 20, x + 70, y + 70), outline=STROKE, fill=FILL, width=1)
        d.text((x + 86, y + 22), "Job title", fill=TEXT_DARK, font=F_MED)
        text_line(d, x + 86, y + 52, 220, 6)
        d.text((x + 86, y + 70), "Company name", fill=TEXT_MUTED, font=F_TINY)
        # Meta rows
        meta_y = y + 110
        for j, (icon, label) in enumerate((
            ("o", "Location . work mode"),
            ("$", "NPR salary range"),
            ("c", "Posted date"),
            ("d", "Expires date"),
        )):
            d.text((x + 20, meta_y + j * 32), icon, fill=TEXT_MUTED, font=F_SMALL)
            d.text((x + 44, meta_y + j * 32), label, fill=TEXT_DARK, font=F_SMALL)
            text_line(d, x + 44, meta_y + j * 32 + 22, 200, 4)
        # Divider
        d.line((x + 20, y + 280, x + card_w - 20, y + 280), fill=STROKE_SOFT, width=1)
        # Apply button
        rect(d, (x + 20, y + 310, x + card_w - 20, y + 358), fill=FILL_DARK)
        d.text((x + card_w // 2 - 24, y + 322), "Apply", fill=TEXT_DARK, font=F_MED)

    img.save(OUT_DIR / "jobs.png")


# --- 6. Candidate profile ---
def wf_profile():
    img, d = base_canvas(h=1200)
    navbar(d, "Jobs", ("Jobs", "Applications", "Interviews"))
    # Heading
    d.text((30, 100), "Your profile", fill=TEXT_DARK, font=F_TITLE)
    text_line(d, 30, 150, 360, 6)
    d.text((W - 320, 110), "Changes saved automatically", fill=TEXT_MUTED, font=F_SMALL)

    # Profile header card
    rect(d, (30, 200, W - 30, 380))
    d.ellipse((50, 220, 170, 340), outline=STROKE, fill=FILL, width=1)
    d.line((50, 220, 170, 340), fill=STROKE_SOFT, width=1)
    d.line((50, 340, 170, 220), fill=STROKE_SOFT, width=1)
    d.text((194, 230), "Candidate name", fill=TEXT_DARK, font=F_BIG)
    text_line(d, 194, 270, 360, 6)
    d.text((194, 296), "email@example.com", fill=TEXT_MUTED, font=F_SMALL)
    d.text((420, 296), "[Remove photo]", fill=TEXT_DARK, font=F_TINY)
    # Right side of header: open-to-work toggle + completion
    chip(d, (W - 280, 220, W - 50, 256), "o Open to work . Off")
    d.text((W - 280, 286), "PROFILE COMPLETION", fill=TEXT_MUTED, font=F_TINY)
    d.text((W - 86, 286), "0%", fill=TEXT_DARK, font=F_SMALL)
    rect(d, (W - 280, 312, W - 50, 330))

    # Tabs row
    tabs = ("Overview", "Experience", "Education", "Skills", "Resumes")
    tx = 30
    for i, t in enumerate(tabs):
        d.text((tx, 408), t, fill=TEXT_DARK, font=F_MED)
        tw = int(d.textlength(t, font=F_MED))
        if i == 0:
            d.line((tx, 438, tx + tw, 438), fill=STROKE, width=2)
        tx += tw + 50
    d.line((30, 438, 1100, 438), fill=STROKE_SOFT, width=1)

    # Left: Personal Information card
    rect(d, (30, 460, 1100, 880))
    d.text((50, 478), "ABOUT YOU", fill=TEXT_MUTED, font=F_TINY)
    d.text((50, 502), "Personal Information", fill=TEXT_DARK, font=F_BIG)
    rect(d, (970, 478, 1080, 514))
    d.text((996, 488), "Edit", fill=TEXT_DARK, font=F_SMALL)
    # Field grid (2 cols x 4 rows)
    fields = (
        ("FULL NAME", "Value"),
        ("EMAIL", "Value"),
        ("HEADLINE", "—"),
        ("PHONE", "—"),
        ("LOCATION", "—"),
        ("YEARS OF EXPERIENCE", "—"),
        ("LINKEDIN", "—"),
        ("GITHUB", "—"),
    )
    for i, (lbl, val) in enumerate(fields):
        col = i % 2
        row = i // 2
        x = 50 + col * 520
        y = 550 + row * 80
        d.text((x, y), lbl, fill=TEXT_MUTED, font=F_TINY)
        d.text((x, y + 24), val, fill=TEXT_DARK, font=F_SMALL)
        text_line(d, x, y + 50, 360, 6)
    # Portfolio (single row)
    d.text((50, 870 - 30), "PORTFOLIO", fill=TEXT_MUTED, font=F_TINY)

    # Professional Summary card
    rect(d, (30, 900, 1100, 1080))
    d.text((50, 918), "IN YOUR WORDS", fill=TEXT_MUTED, font=F_TINY)
    d.text((50, 942), "Professional Summary", fill=TEXT_DARK, font=F_BIG)
    rect(d, (970, 918, 1080, 954))
    d.text((996, 928), "Edit", fill=TEXT_DARK, font=F_SMALL)
    d.text((50, 994), "No summary added yet.", fill=TEXT_MUTED, font=F_SMALL)
    text_line(d, 50, 1024, 800, 6)
    text_line(d, 50, 1044, 600, 6)

    # Right column: Snapshot
    rect(d, (1120, 460, W - 30, 660))
    d.text((1140, 478), "SNAPSHOT", fill=TEXT_MUTED, font=F_TINY)
    d.text((1140, 502), "Profile Stats", fill=TEXT_DARK, font=F_BIG)
    for i, (v, l) in enumerate((("0", "ROLES"), ("0", "DEGREES"), ("0", "SKILLS"))):
        x = 1140 + i * 140
        rect(d, (x, 550, x + 120, 640), fill=FILL)
        d.text((x + 14, 562), v, fill=TEXT_DARK, font=F_TITLE)
        d.text((x + 14, 612), l, fill=TEXT_MUTED, font=F_TINY)

    # Target Roles
    rect(d, (1120, 680, W - 30, 880))
    d.text((1140, 698), "WHAT YOU WANT", fill=TEXT_MUTED, font=F_TINY)
    d.text((1140, 722), "Target Roles", fill=TEXT_DARK, font=F_BIG)
    chip(d, (1140, 770, 1340, 802), "target role  X")
    rect(d, (1140, 822, W - 50, 858))
    d.text((1156, 832), "Add a target role...", fill=TEXT_MUTED, font=F_TINY)

    # Import from Resume
    rect(d, (1120, 900, W - 30, 1080))
    d.text((1140, 918), "FASTER SETUP", fill=TEXT_MUTED, font=F_TINY)
    d.text((1140, 942), "Import from Resume", fill=TEXT_DARK, font=F_BIG)
    text_line(d, 1140, 982, 320, 6)
    text_line(d, 1140, 1000, 220, 6)
    rect(d, (1140, 1024, W - 50, 1066), fill=FILL_DARK)
    d.text((1240, 1036), "Import resume", fill=TEXT_DARK, font=F_SMALL)

    # Delete account banner
    rect(d, (30, 1100, W - 30, 1170), fill=FILL)
    d.ellipse((50, 1116, 90, 1156), outline=STROKE, fill=BG, width=1)
    d.text((110, 1112), "Delete account", fill=TEXT_DARK, font=F_MED)
    text_line(d, 110, 1146, 500, 6)
    rect(d, (W - 200, 1118, W - 50, 1154))
    d.text((W - 168, 1128), "Delete account", fill=TEXT_DARK, font=F_TINY)

    img.save(OUT_DIR / "profile.png")


if __name__ == "__main__":
    wf_recruiter()
    wf_candidate()
    wf_shortlist()
    wf_chat()
    wf_jobs()
    wf_profile()
    print("Wireframes generated:", sorted(p.name for p in OUT_DIR.glob("*.png")))
