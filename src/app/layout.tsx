import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from './config';

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export const viewport: Viewport = {
  themeColor: '#1565c0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=localStorage.getItem('theme-mode');if(m!=='light'&&m!=='dark'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-color-scheme',m);}catch(e){}`,
          }}
        />
      </head>
      <body className={cairo.variable} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
