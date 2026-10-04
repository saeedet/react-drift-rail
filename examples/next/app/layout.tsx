import type { ReactNode } from 'react';
import 'react-drift-rail/styles.css';
import './styles.css';
export const metadata = { title: 'Drift Rail · Next.js example' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
