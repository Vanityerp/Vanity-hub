import type React from "react"
import { Inter } from "next/font/google"
import dynamic from "next/dynamic"
import "./globals.css"

// Import essential providers first
const ThemeProvider = dynamic(() => import("@/components/theme-provider").then(mod => mod.ThemeProvider))
const ClientToaster = dynamic(() => import("@/components/client-toaster").then(mod => mod.ClientToaster))
const NextAuthSessionProvider = dynamic(() => import("@/components/session-provider").then(mod => mod.NextAuthSessionProvider))
const LocationProvider = dynamic(() => import("@/lib/location-provider").then(mod => mod.LocationProvider))
const AuthProvider = dynamic(() => import("@/lib/auth-provider").then(mod => mod.AuthProvider))
const ServiceProvider = dynamic(() => import("@/lib/service-provider").then(mod => mod.ServiceProvider))
const ClientProvider = dynamic(() => import("@/lib/client-provider").then(mod => mod.ClientProvider))
const CurrencyProvider = dynamic(() => import("@/lib/currency-provider").then(mod => mod.CurrencyProvider))
const StaffProvider = dynamic(() => import("@/lib/staff-provider").then(mod => mod.StaffProvider))
const UnifiedStaffProvider = dynamic(() => import("@/lib/unified-staff-provider").then(mod => mod.UnifiedStaffProvider))
const ScheduleProvider = dynamic(() => import("@/lib/schedule-provider").then(mod => mod.ScheduleProvider))
const ProductProvider = dynamic(() => import("@/lib/product-provider").then(mod => mod.ProductProvider))
const TransactionProvider = dynamic(() => import("@/lib/transaction-provider").then(mod => mod.TransactionProvider))
const OrderProvider = dynamic(() => import("@/lib/order-provider").then(mod => mod.OrderProvider))
const GiftCardProvider = dynamic(() => import("@/lib/gift-card-provider").then(mod => mod.GiftCardProvider))
const MembershipProvider = dynamic(() => import("@/lib/membership-provider").then(mod => mod.MembershipProvider))
const ClientCurrencyWrapper = dynamic(() => import("@/components/client-currency-wrapper").then(mod => mod.ClientCurrencyWrapper))
const MobileProvider = dynamic(() => import("@/hooks/use-mobile").then(mod => mod.MobileProvider))
const LocationMigrationRunner = dynamic(() => import("@/components/migration/location-migration-runner").then(mod => mod.LocationMigrationRunner))

const RealTimeNotifications = dynamic(() => import("@/components/real-time/real-time-notifications").then(mod => mod.RealTimeNotifications))
const PageErrorBoundary = dynamic(() => import("@/components/error-boundary").then(mod => mod.PageErrorBoundary))
const ClientErrorHandler = dynamic(() => import("@/components/client-error-handler").then(mod => mod.ClientErrorHandler))
const AuthErrorHandler = dynamic(() => import("@/components/auth-error-handler").then(mod => mod.AuthErrorHandler))
const NotificationAudioProvider = dynamic(() => import("@/components/notifications/notification-audio-context").then(mod => mod.NotificationAudioProvider))

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Vanity | Modern Salon Management",
  description: "Multi-location salon management application for beauty professionals",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <PageErrorBoundary>
          <NextAuthSessionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
              <NotificationAudioProvider>
                <MobileProvider>
                  <LocationProvider>
                    <ServiceProvider>
                      <AuthProvider>
                        <StaffProvider>
                          <UnifiedStaffProvider>
                            <ClientProvider>
                              <CurrencyProvider>
                                <ProductProvider>
                                  <TransactionProvider>
                                    <OrderProvider>
                                      <GiftCardProvider>
                                        <MembershipProvider>
                                          <ScheduleProvider>
                                            <ClientCurrencyWrapper>
                                              <LocationMigrationRunner />
                                              {children}
                                            </ClientCurrencyWrapper>
                                          </ScheduleProvider>
                                        </MembershipProvider>
                                      </GiftCardProvider>
                                    </OrderProvider>
                                  </TransactionProvider>
                                </ProductProvider>
                              </CurrencyProvider>
                            </ClientProvider>
                          </UnifiedStaffProvider>
                        </StaffProvider>
                      </AuthProvider>
                    </ServiceProvider>
                  </LocationProvider>
                </MobileProvider>
              </NotificationAudioProvider>
            </ThemeProvider>
            <ClientErrorHandler />
            <AuthErrorHandler />
            <RealTimeNotifications />
          </NextAuthSessionProvider>
        </PageErrorBoundary>
        <ClientToaster />
      </body>
    </html>
  )
}

