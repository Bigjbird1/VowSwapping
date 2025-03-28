import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AuthContext from '@/context/AuthContext'
import AuthProvider from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  title: 'VowSwap - Wedding Marketplace',
  description: 'Find and sell wedding items in our marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthContext>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </AuthContext>
      </body>
    </html>
  )
}
