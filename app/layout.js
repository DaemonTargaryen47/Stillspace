import { DM_Serif_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { DarkModeProvider } from '../lib/darkMode'
import AppLayout from '../components/AppLayout'
import BreathingBackground from '../components/BreathingBackground'
import InkTransition from '../components/InkTransition'
import SundaySummary from '../components/SundaySummary'

const serif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
})

const sans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'Stillspace',
  description: 'A quiet place to exist.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body style={{ fontFamily: 'var(--font-sans)' }} suppressHydrationWarning>
        <DarkModeProvider>
          <BreathingBackground />
          <AppLayout>
            <InkTransition>
              {children}
            </InkTransition>
          </AppLayout>
          <SundaySummary />
        </DarkModeProvider>
      </body>
    </html>
  )
}
