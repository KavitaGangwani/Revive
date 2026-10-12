# Revive — Typography & Dimension Reference

This document serves as the single source of truth for font sizes, element dimensions, and component paddings across all screens in the Revive desktop recovery application.

---

## 1. Typography Hierarchy

| Role / Element | Font Size | Weight | Line Height / Tracking | Color / Glow Token |
|---|---|---|---|---|
| **Primary Headings (`h1`)** | `15px` | 500 | `normal` / `-0.01em` | `--text` (#FFFFFF) |
| **Section Headings (`h2`)** | `14px` | 500 | `normal` / `-0.01em` | `--text` (#FFFFFF) |
| **Big Focus Counter Numbers** | `30px` | 400 | `1.0` / tabular-nums | `--accent` with `text-shadow: 0 0 14px rgba(175,221,255,.45)` |
| **Mini Counter Numbers (Rest/Rounds)** | `20px` | 400 | `1.0` / tabular-nums | `--accent` with `text-shadow: 0 0 12px rgba(175,221,255,.45)` |
| **Filter Tile Numbers** | `18px` | 400 | `1.0` / tabular-nums | `--accent` with `text-shadow: 0 0 12px rgba(175,221,255,.45)` |
| **Running Clock Numbers** | `30px` | 400 | `1.0` / tabular-nums | `--accent` with `text-shadow: 0 0 14px rgba(175,221,255,.45)` |
| **Body & Descriptions (`.desc`, `.sub`)** | `10.5px – 11px` | 400 | `1.5` / `0.04em` | `--muted` / `--faint` |
| **Notes Line (`#note`)** | `11px` | 400 | `1.5` / `0.04em` | `--muted` with `14px` top margin |
| **Row Item Names** | `11.5px` | 400 | `normal` / `0.04em` | `--text` (ellipsis) |
| **Row Meta Subtitles** | `9.5px` | 400 | `normal` / `0.08em` | `--muted` uppercase |
| **Row Note Quotes** | `9.5px` | 400 | `1.4` / `0` | `--faint` |
| **Nav Items** | `11.5px` | 400 | `normal` / `0.04em` | `--muted` (active `--accent`) |
| **Buttons & Primary Actions (`.btn`)** | `11.5px` | 500 | `normal` / `0.04em` | `#000000` on `--accent` |
| **Pills & Secondary Actions (`.pill`)** | `9.5px – 10px` | 400 | `normal` / `0.04em` | `--muted` (active `--accent`) |
| **Captions & Labels (`.label`)** | `9px` | 400 | `normal` / `0.12em` | `--muted` uppercase |
| **Title Bar Brand (`.brand-title`)** | `12px` | 500 | `normal` / `0.14em` | `--text` with luminous ice-blue dot |
| **Cycle Bar Micro-Labels** | `8.5px` | 400 | `normal` / `0` | `--faint` |

---

## 2. Layout & Window Geometry

| Component / Boundary | Dimension Spec | Padding / Margins |
|---|---|---|
| **Root Application (`.app`)** | `width: 100%; height: 100%; max-width: 900px; max-height: 720px` | Centered in viewport |
| **Sidebar (Expanded)** | `width: 180px` | `padding: 14px 10px; gap: 4px;` |
| **Sidebar (Collapsed)** | `width: 56px` | `padding: 14px 10px; gap: 4px;` |
| **Sidebar Nav Items** | `height: 34px; border-radius: 999px;` | `padding: 0 10px; gap: 10px;` |
| **Sidebar Toggle Button** | `28px × 28px` circle | `place-items: center` |
| **Main Content Grid (`.main`)** | Grid with `gap: 14px;` | `padding: 18px;` |
| **Cards (`.card`)** | `border-radius: 16px; border: 1px solid var(--hair);` | `padding: 18px 16px;` |
| **Top Strip Filter Hero Card (`.hero`)** | `border-radius: 14px;` | `padding: 8px 10px;` |

---

## 3. Atomic Components & Form Elements

| Element | Height / Size | Border Radius | Padding / Gap |
|---|---|---|---|
| **Big Counter Box (`.counter.big`)** | `136px × 78px` | `12px` | Chevron buttons `14px` icon |
| **Mini Counter Box (`.counter.mini`)** | `width: 100%; height: 54px;` | `12px` | Chevron buttons `14px` icon |
| **Counter Pair Container (`.pair`)** | `max-width: 230px; width: 100%;` | — | `gap: 10px;` |
| **Start Session / Primary Button (`.btn`)** | `height: 38px;` | `999px` | `padding: 0 22px; gap: 8px;` |
| **Filter Tile (`.tile`)** | `height: 54px;` | `12px` | `gap: 3px; svg: 15px;` |
| **Type Picker Tile (`.types .tile`)** | `height: 48px;` | `12px` | `gap: 4px; svg: 16px;` |
| **Activity Row (`.row`)** | Flex row | `14px` | `padding: 8px 10px; gap: 8px;` |
| **Row Icon Circle (`.ic`)** | `32px × 32px` | `999px` | `svg: 15px;` |
| **Row Action Pill (`.pill`)** | `height: 24px;` | `999px` | `padding: 0 9px;` |
| **Slot Action Pill (`.slot .pill`)** | `height: 26px;` | `999px` | `padding: 0 10px;` |
| **Delete Button (`.x`)** | `24px × 24px` | `999px` | `svg: 12px;` |
| **Inputs & Textareas** | Textarea `height: 42px;` | `10px` | `padding: 7px 10px; font-size: 11px;` |
| **Breathing Phase Row (`.ph`)** | Grid `1fr 54px 24px` | — | `gap: 5px;` |
| **Cycle Bar (`.cyc`)** | `height: 5px;` | `3px` segments | `gap: 3px;` |
| **Pick Mode Banner (`.pick`)** | Flex banner | `12px` | `padding: 6px 10px;` |
| **Running Countdown Circle** | `viewBox="0 0 180 180"`, radius `80px` | — | Clock `30px`, status `9px` |
