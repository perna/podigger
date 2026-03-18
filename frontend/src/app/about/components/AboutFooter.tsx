/**
 * About page footer with legal links and copyright notice.
 */
export function AboutFooter() {
  const links = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Open Source', href: 'https://github.com/podigger' },
  ] as const;

  return (
    <footer className="px-4 py-8 text-center text-xs text-slate-400">
      <p className="mb-3">© 2024 Podigger Inc. All rights reserved.</p>
      <div className="flex justify-center flex-wrap gap-x-4 gap-y-1">
        {links.map(({ label, href }, i) => (
          <span key={label} className="flex items-center gap-4">
            <a
              href={href}
              className="hover:text-primary transition-colors"
            >
              {label}
            </a>
            {i < links.length - 1 && (
              <span className="text-slate-300 dark:text-white/20">•</span>
            )}
          </span>
        ))}
      </div>
    </footer>
  );
}
