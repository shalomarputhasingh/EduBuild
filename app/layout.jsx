import './globals.css';
import Providers from './providers';
import AppShell from '@/src/components/layout/AppShell';

/**
 * Fonts are loaded through next/font rather than a <link> in the document head.
 * It self-hosts the files at build time, so there is no render-blocking request
 * to fonts.googleapis.com and no layout shift while the face swaps in — and the
 * CSP no longer needs to allow Google's font hosts at all.
 */
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'EDUBUILD — Low-cost STEM project guides for the classroom',
  description:
    'EDUBUILD — practical, low-cost STEM project guides for the classroom. Materials, costs, steps, safety notes and tutorial videos, shared by teachers.',
};

export const viewport = {
  themeColor: '#10362a',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Every route renders per request.
 *
 * The CSP carries a per-request nonce (see middleware.js), and Next can only
 * stamp that onto its inline bootstrap scripts while it is rendering. A page
 * served from the build-time prerender has HTML that predates the nonce, so its
 * scripts go out unsigned, the browser blocks them, and the page never
 * hydrates — which showed up as the sign-in form spinning forever.
 *
 * The cost is small here: every page is a client component that fetches its own
 * data after mount, so the prerendered HTML was only ever an empty shell.
 */
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
