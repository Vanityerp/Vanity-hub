import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CheckCircle, Star, Users, ShoppingBag, BarChart, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-lg"></div>
              <div className="absolute inset-[2px] bg-white dark:bg-black rounded-md flex items-center justify-center">
                <span className="font-bold text-primary">V</span>
              </div>
            </div>
            <span className="text-xl font-bold">Vanity</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:underline">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:underline">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:underline">
              Testimonials
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:underline">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_600px] lg:gap-12 xl:grid-cols-[1fr_800px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="mb-2" variant="outline">
                    No commission fees
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    <span className="bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">
                      Vanity
                    </span>{" "}
                    - Beauty scheduling that works for you
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Perfect for Salons, SPAs, Barbershops or Individual Specialists.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Free trial
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline">
                      Book demo
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">No credit card required</p>

                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="inline-block h-8 w-8 rounded-full border-2 border-background bg-muted overflow-hidden"
                      >
                        <Image
                          src={`/placeholder.svg?height=32&width=32&text=${i}`}
                          alt={`User ${i}`}
                          width={32}
                          height={32}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">4.9/5</span> from 2,000+ reviews
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="relative w-full max-w-[800px]">
                  {/* Main calendar view */}
                  <div className="rounded-lg border bg-background shadow-xl overflow-hidden">
                    <Image
                      src="/images/landing/Calendar.png"
                      alt="Calendar interface"
                      width={1600}
                       height={1200}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Mobile app view */}
                  <div className="absolute -right-6 bottom-0 md:-right-12 md:bottom-12 w-[200px] md:w-[250px] rounded-lg border bg-gray-900 shadow-xl overflow-hidden rotate-6">
                    <Image
                      src="/images/landing/Calendar.png"
                      alt="Mobile app interface"
                      width={250}
                      height={500}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Chat bubbles */}
                  <div className="absolute -left-4 top-1/4 max-w-[200px] rounded-lg bg-primary text-white p-3 shadow-lg">
                    <p className="text-sm">Your booking is set for tomorrow, 12pm!</p>
                    <div className="absolute border-primary border-8 border-t-transparent border-l-transparent border-b-transparent right-[-16px] top-[calc(50%-8px)]"></div>
                  </div>

                  <div className="absolute left-20 top-1/3 max-w-[200px] rounded-lg bg-gray-700 text-white p-3 mt-12 shadow-lg">
                    <p className="text-sm">That sounds great! I'm in.</p>
                    <div className="absolute border-gray-700 border-8 border-r-transparent border-t-transparent border-b-transparent left-[-16px] top-[calc(50%-8px)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="outline">Features</Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Everything you need to manage your salon
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides all the tools you need to streamline your salon operations, from appointment
                  scheduling to inventory management.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-12 mt-12">
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multi-Location Scheduling</h3>
                <p className="text-muted-foreground text-center">
                  Manage appointments across multiple salon locations with our intuitive calendar interface.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Client Management</h3>
                <p className="text-muted-foreground text-center">
                  Keep track of client preferences, appointment history, and contact information in one place.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Inventory & POS</h3>
                <p className="text-muted-foreground text-center">
                  Track retail products and process sales with our integrated point of sale system.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Advanced Analytics</h3>
                <p className="text-muted-foreground text-center">
                  Gain insights into your business with comprehensive reports and customizable dashboards.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Secure Access Control</h3>
                <p className="text-muted-foreground text-center">
                  Protect your data with role-based access control and secure authentication.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border bg-background p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Online Booking</h3>
                <p className="text-muted-foreground text-center">
                  Allow clients to book appointments online 24/7, reducing phone calls and missed opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Trusted by 1,500 beauty salons around the world
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-center mt-12">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-200"
                >
                  <Image
                    src={`/placeholder.svg?height=80&width=160&text=Salon+Logo+${i}`}
                    alt={`Salon Logo ${i}`}
                    width={160}
                    height={80}
                    className="max-h-12 w-auto"
                  />
                </div>
              ))}
            </div>
            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12">
              {[
                {
                  quote:
                    "Vanity has completely transformed how we manage our three salon locations. The staff love it!",
                  author: "Jessica Chen",
                  role: "Owner, Bliss Beauty",
                },
                {
                  quote:
                    "The multi-location features are exactly what we needed. I can finally see all my salon data in one place.",
                  author: "Michael Rodriguez",
                  role: "Director, Style Studios",
                },
                {
                  quote:
                    "Our clients love the online booking system, and we've seen a 30% increase in appointments since switching.",
                  author: "Sarah Johnson",
                  role: "Manager, Glow Spa",
                },
              ].map((testimonial, i) => (
                <div key={i} className="flex flex-col space-y-4 rounded-lg border bg-background p-6 shadow-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  </div>
                  <p className="text-muted-foreground">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-muted h-10 w-10 overflow-hidden">
                      <Image
                        src={`/placeholder.svg?height=40&width=40&text=${testimonial.author[0]}`}
                        alt={testimonial.author}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to transform your salon business?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join thousands of salon professionals who trust Vanity to manage their business.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Start free trial
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline">
                    Book a demo
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">No credit card required. 14-day free trial.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container flex flex-col gap-6 py-8 md:py-12 px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Product</h3>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Features
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Pricing
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Integrations
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Updates
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Company</h3>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                About
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Blog
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Careers
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Contact
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Resources</h3>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Documentation
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Help Center
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Community
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Webinars
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Legal</h3>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Terms
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Security
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Accessibility
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-lg"></div>
                <div className="absolute inset-[2px] bg-white dark:bg-black rounded-md flex items-center justify-center">
                  <span className="font-bold text-primary">V</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">© 2025 Vanity. All rights reserved.</p>
            </div>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

