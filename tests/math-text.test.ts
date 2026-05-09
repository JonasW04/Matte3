import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MathText, parseMathSegments } from "../components/math/math-text";

describe("MathText", () => {
  it("renders inline TeX as KaTeX during React render", () => {
    const html = renderToStaticMarkup(
      createElement(MathText, null, "Vis konvergens for \\(\\sum_{n=1}^{\\infty} x^{2n}\\).")
    );

    assert.match(html, /class="katex"/);
    assert.doesNotMatch(html, /\\\(/);
    assert.doesNotMatch(html, /\\\)/);
  });

  it("keeps unmatched delimiters as text", () => {
    assert.deepEqual(parseMathSegments("Bruk \\(x=1/2 uten slutt."), [
      { type: "text", value: "Bruk \\(x=1/2 uten slutt." }
    ]);
  });
});
