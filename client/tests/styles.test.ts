import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

describe("hot card text density", () => {
  it("clamps list summaries to three lines on desktop", () => {
    expect(css).toMatch(
      /\.topic small\s*\{[^}]*display:\s*-webkit-box;[^}]*overflow:\s*hidden;[^}]*-webkit-line-clamp:\s*3;[^}]*-webkit-box-orient:\s*vertical;/s,
    );
  });

  it("allows four summary lines on mobile", () => {
    expect(css).toMatch(
      /@media \(max-width:\s*780px\)[\s\S]*?\.topic small\s*\{[^}]*-webkit-line-clamp:\s*4;/,
    );
  });
});
