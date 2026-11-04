import katex from "katex";

interface MathFormulaProps {
  // TeX source, without $ delimiters
  tex: string;
  // Display (block) math, centered on its own line, instead of inline
  display?: boolean;
  className?: string;
}

// Renders TeX with KaTeX while the page is rendered on the server, so the
// HTML already contains the formula: nothing loads from a CDN in the browser.
// KaTeX's CSS and fonts are imported once in _app.tsx and served by the site.
const MathFormula = ({ tex, display = false, className }: MathFormulaProps) => {
  const html = katex.renderToString(tex, {
    displayMode: display,
    // Show invalid TeX in red instead of throwing; the website CI check fails
    // on any such error (see scripts/check-pages.mjs).
    throwOnError: false,
  });
  // Always a span, so it can sit inside a paragraph: KaTeX's CSS makes display
  // math a block. The TeX comes from our own components, not from user input.
  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default MathFormula;
