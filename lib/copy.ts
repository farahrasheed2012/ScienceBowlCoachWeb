/**
 * Build a single text node for UI copy.
 * Headless a11y trees often drop spaces between React `{expr}` and sibling text.
 */
export function txt(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.reduce((out, part, i) => out + part + (i < values.length ? String(values[i] ?? "") : ""), "");
}
