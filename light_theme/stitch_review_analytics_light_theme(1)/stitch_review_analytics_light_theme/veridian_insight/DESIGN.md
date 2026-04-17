# Design System Document: Editorial Intelligence

## 1. Overview & Creative North Star

### The Creative North Star: "The Lucid Analyst"
This design system rejects the cluttered, "dashboard-heavy" tropes of traditional AI platforms in favor of **The Lucid Analyst**. Our goal is to transform complex sentiment data into a narrative that feels as breathable and prestigious as a high-end financial broadsheet. 

By leveraging the tension between **Manrope’s** geometric authority and **Inter’s** functional clarity, we create an experience that feels both human and mathematically precise. We move beyond the "boxed-in" web by using intentional asymmetry, generous white space (kerning and margins), and a sophisticated "no-line" philosophy. The result is a platform that doesn't just show data; it reveals insights through a lens of quiet, premium confidence.

---

## 2. Colors: Tonal Depth vs. Structural Lines

Our palette is rooted in an organic white (`#f4fbf4`) and an authoritative emerald (`#006c49`). We use color not just for branding, but as the primary tool for spatial navigation.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. 
Structure must be achieved through **background color shifts**. A card (`surface_container_lowest: #ffffff`) should sit on a section (`surface_container_low: #eef6ee`), which in turn sits on the global background (`surface: #f4fbf4`). This tonal stepping creates a softer, more sophisticated hierarchy than rigid lines.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper.
*   **Base:** `surface` (#f4fbf4) – The infinite canvas.
*   **Sectioning:** `surface_container_low` (#eef6ee) – Used for large background areas to group related content.
*   **Interactive Cards:** `surface_container_lowest` (#ffffff) – The highest point of focus.

### The "Glass & Gradient" Rule
To elevate the AI experience, use **Glassmorphism** for floating elements (like hover-state tooltips or navigation bars). Use `surface` colors at 80% opacity with a `24px` backdrop-blur. 
*   **Signature Textures:** For primary CTAs, do not use flat fills. Use a subtle linear gradient from `primary` (#006c49) to `primary_container` (#10b981) at a 135° angle. This adds "soul" and a sense of light source to the interface.

---

## 3. Typography: Editorial Authority

The typography scale is designed to mimic a data-journalism piece. 

*   **Display & Headlines (Manrope):** Use `display-lg` and `headline-md` for high-impact data points. The geometric nature of Manrope suggests AI precision.
*   **Body & Titles (Inter):** Use `body-md` for review text. Inter’s high x-height ensures readability in dense data environments.
*   **Tonal Contrast:** Primary insights should use `on_surface` (#161d19), while meta-data (timestamps, AI confidence scores) must use `on_surface_variant` (#3c4a42) to create a clear reading path.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is organic, not artificial. We stack tiers to create focus:
1.  **Level 0 (Base):** `surface`
2.  **Level 1 (The Bed):** `surface_container_low`
3.  **Level 2 (The Insight):** `surface_container_lowest` (White Card)

### Ambient Shadows
When an element must "float" (e.g., a dropdown or a prioritized AI insight card), use an **Ambient Shadow**:
*   **Y-Offset:** 8px | **Blur:** 32px
*   **Color:** `on_surface` at 6% opacity.
*   **Logic:** Shadows should feel like a soft glow of light being blocked, never a dark "drop shadow."

### The "Ghost Border" Fallback
If contrast testing requires a boundary, use a **Ghost Border**: `outline_variant` (#bbcabf) at 15% opacity. If you can see the border clearly, it is too heavy.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary_container`). White text. `0.75rem` (md) roundedness.
*   **Secondary:** `surface_container_high` background with `on_surface` text. No border.
*   **Tertiary:** No background. `primary` text with an underline that appears only on hover.

### Sentiment Cards
*   **Styling:** Forbidden use of divider lines between the "Reviewer Name" and "Review Body." Use a `1.5rem` vertical spacing gap instead.
*   **The AI Indicator:** Use a small, high-chroma `primary_fixed` (#6ffbbe) dot next to "AI Confidence" to draw the eye without overwhelming it.

### Sentiment Chips
*   **Positive:** `primary_container` (#10b981) background with `on_primary_container` (#00422b) text.
*   **Negative:** `tertiary_container` (#fc7c78) background with `on_tertiary_container` (#711419) text.
*   **Shape:** Use `full` (pill) roundedness for chips to contrast against the `md` roundedness of cards.

### Input Fields
*   **Base State:** `surface_container_highest` background. No border.
*   **Focus State:** A 2px "Ghost Border" using `primary` at 30% and a subtle `surface_tint` outer glow.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. For example, a 70/30 split for the "Live Feed" vs "Analytics Sidebar" creates visual interest.
*   **Do** use `headline-lg` for single, "Hero" numbers (e.g., "98% Positive Sentiment").
*   **Do** allow content to breathe. If a card feels full, increase the padding to `xl` (1.5rem).

### Don't:
*   **Don't** use black (#000000). Use `on_surface` (#161d19) for all "dark" elements to maintain the organic, professional tone.
*   **Don't** use 1px dividers to separate list items. Use a background shift to `surface_container_low` on hover instead.
*   **Don't** use sharp corners. Everything must adhere to the **Roundedness Scale**, specifically `md` (0.75rem) for primary containers to feel approachable.