// Fixture for the T115 no-restricted-syntax rule (FR-009).
// The first <button> is the violation; the second opts out via data-allow-raw.
// ESLint (not the structural runner) enforces the rule — run:
//   npx eslint --no-eslintrc -c frontend/eslint.config.mjs <this file>
export default function Page() {
  return (
    <main>
      <button>raw violation</button>
      <button data-allow-raw>escape hatch</button>
    </main>
  );
}
