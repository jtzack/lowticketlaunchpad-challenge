import type { Metadata } from 'next'
import { Fjalla_One, Inter } from 'next/font/google'
import './globals.css'

const fjalla = Fjalla_One({
  weight: '400',
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Launchpad Challenge',
  description:
    'Build, ship, and earn points completing the 6-session Low-Ticket Launchpad LIVE challenge.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${fjalla.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-cream">{children}</body>
    </html>
  )
}
