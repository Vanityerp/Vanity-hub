"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, UserPlus, Menu, LogOut, ShoppingCart, Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { useRouter, usePathname } from "next/navigation"
import { CartProvider, useCart } from "@/lib/cart-provider"
import { ClientPortalLogo, FooterLogo } from "@/components/ui/logo"
import { ClientThemeProvider } from "@/components/theme-provider"
import { ClientModeToggle } from "@/components/client-mode-toggle"

// Header component that uses cart context
function ClientPortalHeader({
  isLoggedIn,
  handleLogout,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}: {
  isLoggedIn: boolean
  handleLogout: () => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}) {
  const { cartItemCount, wishlistItemCount } = useCart()

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ClientPortalLogo href="/client-portal" className="hidden sm:flex" />
          <ClientPortalLogo href="/client-portal" showName={false} className="sm:hidden" />
        </div>

        {/* Desktop buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Theme toggle */}
          <ClientModeToggle />

          {/* Cart and Wishlist buttons */}
          <Button size="sm" variant="ghost" asChild className="relative">
            <Link href="/client-portal/shop/cart">
              <ShoppingCart className="h-4 w-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </Button>

          <Button size="sm" variant="ghost" asChild className="relative">
            <Link href="/client-portal/wishlist">
              <Heart className="h-4 w-4" />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistItemCount}
                </span>
              )}
            </Link>
          </Button>

          {isLoggedIn ? (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href="/client-portal/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button size="sm" className="bg-pink-600 hover:bg-pink-700" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href="/client-portal#auth-section"
                  onClick={() => document.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: 'login' }))}>
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
              <Button size="sm" className="bg-pink-600 hover:bg-pink-700" asChild>
                <Link href="/client-portal#auth-section"
                  onClick={() => document.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: 'signup' }))}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between py-4 border-b">
                <ClientPortalLogo />
              </div>
              <div className="flex flex-col gap-4 py-6">
                {/* Theme toggle for mobile */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Theme</span>
                  <ClientModeToggle />
                </div>

                {/* Mobile Cart and Wishlist */}
                <Button variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)} className="relative">
                  <Link href="/client-portal/shop/cart">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Cart
                    {cartItemCount > 0 && (
                      <span className="ml-auto bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Button variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)} className="relative">
                  <Link href="/client-portal/wishlist">
                    <Heart className="mr-2 h-4 w-4" />
                    Wishlist
                    {wishlistItemCount > 0 && (
                      <span className="ml-auto bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlistItemCount}
                      </span>
                    )}
                  </Link>
                </Button>

                {isLoggedIn ? (
                  <>
                    <Button variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/client-portal/dashboard">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      className="bg-pink-600 hover:bg-pink-700"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/client-portal#auth-section"
                        onClick={() => document.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: 'login' }))}>
                        <User className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </Button>
                    <Button className="bg-pink-600 hover:bg-pink-700" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/client-portal#auth-section"
                        onClick={() => document.dispatchEvent(new CustomEvent('switch-auth-tab', { detail: 'signup' }))}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

export default function ClientPortalRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("client_auth_token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("client_auth_token");
    localStorage.removeItem("client_email");
    localStorage.removeItem("client_id");

    setIsLoggedIn(false);

    // Dispatch custom event to notify other components of logout
    window.dispatchEvent(new CustomEvent('client-auth-changed', { detail: { isLoggedIn: false } }));

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });

    router.push("/client-portal");
  };

  return (
    <ClientThemeProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <ClientPortalHeader
            isLoggedIn={isLoggedIn}
            handleLogout={handleLogout}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-700 py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <FooterLogo />
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>&copy; {new Date().getFullYear()}. All rights reserved.</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </CartProvider>
    </ClientThemeProvider>
  )
}
