/** FEED-B1 fix-3 — L-74: Buttons press to scale 0.97 within --duration-press (Bible §9.2 rule 1, §10.7). */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button as AuthButton } from "../../../../../../packages/auth-ui/src/ui/button";
import { Button } from "../button";

describe.each([
  ["forum Button", Button],
  ["auth-ui Button", AuthButton],
])("%s (L-74)", (_name, Btn) => {
  it("scales to 0.97 on :active with the press duration, and transitions scale", () => {
    const { getByRole } = render(<Btn>Go</Btn>);
    const cls = getByRole("button").className;
    expect(cls).toMatch(/(^|\s)active:scale-97(\s|$)/);
    expect(cls).toMatch(/(^|\s)active:duration-press(\s|$)/);
    // Tailwind v4 scale/translate are their own properties: they must be transitioned
    expect(cls).toMatch(/transition-\[[^\]]*\bscale\b[^\]]*\]/);
  });
});
