"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MockImage } from "@/components/mock-image"
import { Calendar } from "@/components/ui/calendar"
import { CustomCalendar } from "@/components/client-portal/custom-calendar"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, addDays, startOfDay, addHours, isBefore, parseISO, addMinutes, isWithinInterval, isSameDay } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"
// DEPRECATED: Mock data removed - now using real API data
import { SettingsStorage } from "@/lib/settings-storage"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useClients } from "@/lib/client-provider"
import { initializeAppointmentService, addAppointmentWithValidation, getAllAppointments, saveAppointments, validateStaffAvailability } from "@/lib/appointment-service"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import { useLocations } from "@/lib/location-provider"
import { useServices } from "@/lib/service-provider"
import { useApiStaff } from "@/lib/api-staff-service"
import { realTimeService, RealTimeEventType } from "@/lib/real-time-service"
import { NotificationService } from "@/lib/notification-service"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Scissors,
  User,
  Star,
  Heart,
  Palette,
  Hand,
  Sparkles,
  Brush,
  Flame,
  Flower2,
  AlertCircle,
  Info,
  BadgePercent,
  Badge as BadgeIcon
} from "lucide-react"

export default function BookAppointmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const { clients } = useClients()
  const { staff, isLoading: staffLoading, error: staffError } = useApiStaff()

  // Client state
  const [client, setClient] = useState<any & { loyaltyPoints?: number }>(null)

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // Booking success state - must be declared before useEffect hooks that use it
  const [isBookingSuccess, setIsBookingSuccess] = useState(false)
  const [bookingReference, setBookingReference] = useState<string>("")
  const bookingCompletedRef = useRef(false)

  // Debug current step changes
  useEffect(() => {
    if (bookingCompletedRef.current && currentStep !== 8) {
      console.log("⚠️ WARNING: Step changed away from success screen after booking completion!");
    }
  }, [currentStep]);

  // Check for recent booking success on mount
  useEffect(() => {
    const bookingSuccess = localStorage.getItem('bookingSuccess');
    if (bookingSuccess) {
      try {
        const data = JSON.parse(bookingSuccess);
        // Check if booking was within last 5 minutes
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          setBookingReference(data.reference);
          setIsBookingSuccess(true);
          setCurrentStep(8);
        } else {
          // Clean up old booking success data
          localStorage.removeItem('bookingSuccess');
        }
      } catch (error) {
        console.error("Error parsing booking success data:", error);
        localStorage.removeItem('bookingSuccess');
      }
    }
  }, []);

  // Force re-render when booking success state changes
  useEffect(() => {
    if (isBookingSuccess) {
      // Force component to re-render by updating a dummy state if needed
      setTimeout(() => {
        if (currentStep !== 8) {
          setCurrentStep(8);
        }
        // Scroll to top to ensure success screen is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [isBookingSuccess, currentStep]);

  // Form state
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date()) // Default to today
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [isBooking, setIsBooking] = useState(false)
  const [clientName, setClientName] = useState<string>("")
  const [clientPhone, setClientPhone] = useState<string>("")
  const [clientEmail, setClientEmail] = useState<string>("")
  const [isGuestCheckout, setIsGuestCheckout] = useState(false)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Helper function to get days in month for the calendar
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Create array with empty slots for days from previous month
    const days: (number | null)[] = Array(startingDayOfWeek).fill(null);

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Add empty slots to complete the grid (optional)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push(null);
    }

    return days;
  }

  // Availability state
  const [unavailableStaff, setUnavailableStaff] = useState<string[]>([])
  const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(false)
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0)
  const [willEarnPoints, setWillEarnPoints] = useState<number>(0)

  // Use the service provider to get services and categories
  const {
    services,
    categories,
    loading: servicesLoading,
    error: servicesError,
    getCategoryName,
    refreshData
  } = useServices()

  // Use the locations provider
  const { locations: locationsList } = useLocations()

  // Refresh services and categories when the component mounts
  useEffect(() => {
    refreshData().catch(err => {
      console.error("Failed to load services data:", err)
      toast({
        title: "Error loading services",
        description: "Failed to load services and categories. Please refresh the page.",
        variant: "destructive",
      })
    })
  }, [refreshData, toast])

  // Handle staff loading errors
  useEffect(() => {
    if (staffError) {
      console.error("Failed to load staff data:", staffError)
      toast({
        title: "Error loading staff",
        description: "Failed to load staff members. Please refresh the page.",
        variant: "destructive",
      })
    }
  }, [staffError, toast])

  // Set default location to home service if available
  useEffect(() => {
    if (locationsList.length > 0 && !selectedLocation) {
      // Find home service location
      const homeServiceLocation = locationsList.find(loc =>
        loc.name.toLowerCase().includes("home service") ||
        loc.name.toLowerCase().includes("home")
      );

      if (homeServiceLocation) {
        console.log("Setting default location to home service:", homeServiceLocation.name, homeServiceLocation.id);
        setSelectedLocation(homeServiceLocation.id);
      } else {
        // Fallback to first active location (excluding online store)
        const firstActiveLocation = locationsList.find(loc =>
          loc.status === "Active" &&
          loc.id !== "online" &&
          !loc.name.toLowerCase().includes("online store")
        );
        if (firstActiveLocation) {
          console.log("Setting default location to first active:", firstActiveLocation.name, firstActiveLocation.id);
          setSelectedLocation(firstActiveLocation.id);
        }
      }
    }
  }, [locationsList, selectedLocation]);

  // Debug logging for services and categories
  useEffect(() => {
    console.log("Client Portal Booking - Services loaded:", services.length);
    console.log("Client Portal Booking - Categories loaded:", categories.length);
    console.log("Client Portal Booking - Locations loaded:", locationsList.length);
    console.log("Client Portal Booking - Selected location:", selectedLocation);
    console.log("Client Portal Booking - Available locations:", locationsList.map(l => ({ id: l.id, name: l.name })));

    if (categories.length > 0) {
      console.log("Categories:", categories.map(c => `${c.name} (${c.id})`));
    }

    if (services.length > 0) {
      const servicesByCategory = {};
      const servicesByLocation = {};
      services.forEach(service => {
        if (!servicesByCategory[service.category]) {
          servicesByCategory[service.category] = 0;
        }
        servicesByCategory[service.category]++;

        // Track services by location
        if (service.locations) {
          service.locations.forEach(loc => {
            if (!servicesByLocation[loc]) {
              servicesByLocation[loc] = 0;
            }
            servicesByLocation[loc]++;
          });
        } else {
          if (!servicesByLocation['no-location']) {
            servicesByLocation['no-location'] = 0;
          }
          servicesByLocation['no-location']++;
        }
      });
      console.log("Services by category:", servicesByCategory);
      console.log("Services by location:", servicesByLocation);


    }
  }, [services, categories, locationsList, selectedLocation])

  // Get unique category names from the categories array
  const serviceCategories = categories.map(category => category.name)

  // Get service details
  const serviceDetails = selectedService
    ? services.find(service => service.id === selectedService)
    : null

  // Get staff details
  const staffDetails = selectedStaff
    ? staff.find(member => member.id === selectedStaff)
    : null

  // Get location data from the location provider
  const { getLocationName, isHomeServiceEnabled, isHomeServiceLocation } = useLocations();

  // Helper function to check if a location is home service
  const isHomeServiceLocationById = useCallback((locationId: string) => {
    const location = locationsList.find(loc => loc.id === locationId);
    return location ? isHomeServiceLocation(location) : false;
  }, [locationsList, isHomeServiceLocation])

  // Filter services by category and location
  const filteredServices = services.filter(service => {
    // Check if the selected category matches the service's category
    const categoryMatches = selectedCategory ?
      (getCategoryName(service.category) === selectedCategory || service.category === selectedCategory) : true;

    // Check if the service is available at the selected location
    let locationMatches = true;

    if (service.locations && service.locations.length > 0) {
      // If home service is selected, check if service is available at the selected location
      if (isHomeServiceLocationById(selectedLocation)) {
        // For home service, check if the service includes the selected home service location
        locationMatches = service.locations.includes(selectedLocation);
      } else {
        locationMatches = service.locations.includes(selectedLocation);
      }
    } else {
      // If service has no location restrictions, it's available everywhere
      locationMatches = true;
    }

    return categoryMatches && locationMatches;
  })

  // Debug home service filtering
  useEffect(() => {
    if (isHomeServiceLocationById(selectedLocation)) {
      const homeServices = services.filter(service => {
        if (!service.locations || service.locations.length === 0) return true;
        return service.locations.includes(selectedLocation);
      });
      console.log("Home service available services:", homeServices.length);
      console.log("Home service categories:", [...new Set(homeServices.map(s => s.category))]);
      console.log("Selected location ID:", selectedLocation);
      console.log("Sample service locations:", services.slice(0, 2).map(s => ({ name: s.name, locations: s.locations })));
    }
  }, [selectedLocation, services, isHomeServiceLocationById])

  // Add and remove body class for CSS targeting
  useEffect(() => {
    // Add class to body
    document.body.classList.add('booking-page');

    // Add custom styles for the date picker
    const style = document.createElement('style');
    style.id = 'custom-date-picker-styles';
    style.innerHTML = `
      .date-picker-button {
        position: relative;
        overflow: hidden;
      }

      .date-picker-button::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, rgba(236, 72, 153, 0.05), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .date-picker-button:hover::after {
        opacity: 1;
      }

      .date-picker-popover {
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove class and styles when component unmounts
    return () => {
      document.body.classList.remove('booking-page');
      const styleElement = document.getElementById('custom-date-picker-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Debug initial state
  useEffect(() => {
    console.log("🚀 === BOOKING PAGE INITIALIZED ===")
    console.log("🚀 Initial selected date:", selectedDate?.toDateString())
    console.log("🚀 Current time:", new Date().toLocaleString())
    console.log("🚀 Is initial date today?", selectedDate ? isSameDay(selectedDate, new Date()) : false)
    console.log("🚀 === END INITIALIZATION ===")
  }, []) // Run only once on mount

  // Load client data
  useEffect(() => {
    const storedClientEmail = localStorage.getItem("client_email")
    const clientId = localStorage.getItem("client_id")

    if (storedClientEmail || clientId) {
      let foundClient

      if (clientId) {
        foundClient = clients.find(c => c.id === clientId)
      } else if (storedClientEmail) {
        foundClient = clients.find(c => c.email === storedClientEmail)
      }

      if (foundClient) {
        setClient(foundClient)
        setLoyaltyPoints((foundClient as any).loyaltyPoints || 0)
        setClientName(foundClient.name || "")
        setClientPhone(foundClient.phone || "")
        setClientEmail(foundClient.email || "")
      } else {
        // Mock client for demo
        const mockClient = {
          id: "client123",
          name: "Jane Smith",
          email: storedClientEmail || "jane@example.com",
          phone: "555-123-4567",
          loyaltyPoints: 150
        }
        setClient(mockClient)
        setLoyaltyPoints(150)
        setClientName(mockClient.name)
        setClientPhone(mockClient.phone)
        setClientEmail(mockClient.email)
      }
    } else {
      // Redirect to login if no client is found
      router.push("/client-portal")
    }
  }, [clients, router])

  // Generate time slots when date changes - REBUILT FROM SCRATCH
  useEffect(() => {
    if (!selectedDate) {
      setTimeSlots([])
      return
    }

    console.log("🕒 === TIME SLOT GENERATION (REBUILT) ===")

    const now = new Date()
    const isToday = isSameDay(selectedDate, now)

    console.log("📅 Current time:", now.toLocaleString())
    console.log("📅 Selected date:", selectedDate.toDateString())
    console.log("📅 Is today?", isToday)

    const slots = []
    const businessStartHour = 9  // 9 AM
    const businessEndHour = 22   // 10 PM

    // Generate all possible 15-minute time slots during business hours
    for (let hour = businessStartHour; hour <= businessEndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {

        // Create a full date/time object for this slot
        const slotDateTime = new Date(selectedDate)
        slotDateTime.setHours(hour, minute, 0, 0)

        // Apply 2-hour advance booking restriction ONLY for today
        if (isToday) {
          const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000)) // Add 2 hours in milliseconds

          console.log(`⏰ Checking slot ${hour}:${minute.toString().padStart(2, '0')}`)
          console.log(`   Slot time: ${slotDateTime.toLocaleTimeString()}`)
          console.log(`   Two hours from now: ${twoHoursFromNow.toLocaleTimeString()}`)
          console.log(`   Is slot valid? ${slotDateTime >= twoHoursFromNow}`)

          if (slotDateTime < twoHoursFromNow) {
            console.log(`   ❌ SKIPPED - too soon (less than 2 hours from now)`)
            continue
          }

          console.log(`   ✅ INCLUDED - meets 2-hour requirement`)
        } else {
          console.log(`⏰ Future date slot ${hour}:${minute.toString().padStart(2, '0')} - automatically included`)
        }

        // Format time for display (12-hour format with AM/PM)
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        const period = hour >= 12 ? 'PM' : 'AM'
        const formattedTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`

        slots.push(formattedTime)
      }
    }

    console.log("📋 Final time slots generated:", slots.length)
    console.log("📋 First 5 slots:", slots.slice(0, 5))
    if (slots.length > 5) {
      console.log("📋 Last 5 slots:", slots.slice(-5))
    }
    console.log("🕒 === END TIME SLOT GENERATION ===")

    setTimeSlots(slots)

    // If no slots are available, show a message
    if (slots.length === 0 && isToday) {
      toast({
        title: "No available time slots",
        description: "There are no available time slots for today. Please select another date.",
        variant: "destructive",
      });
    }
  }, [selectedDate, toast])

  // Update unavailable staff when date, time, service, or location changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      // Default duration if no service is selected yet
      let duration = 60; // Default to 60 minutes

      // If a service is selected, use its duration
      if (selectedService) {
        const service = services.find(s => s.id === selectedService);
        if (service) {
          duration = service.duration;
        }
      }

      // Check each staff member's availability - CLEANED UP
      console.log("👥 === STAFF AVAILABILITY CHECK ===")
      console.log("👥 Checking availability for time:", selectedTime)
      console.log("👥 Selected date:", selectedDate.toDateString())
      console.log("👥 Service duration:", duration, "minutes")
      console.log("👥 Total appointments in system:", getAllAppointments().length)

      const unavailable = staff
        // Filter by status, role and location first
        .filter(member => {
          // Only check active staff members
          if (member.status !== 'Active') {
            return false;
          }

          if (isHomeServiceLocationById(selectedLocation)) {
            return member.homeService === true ||
                   member.locations.includes(selectedLocation)
          }
          return member.locations.includes(selectedLocation)
        })
        // Then check availability (conflicts, day-offs only - NO time restrictions)
        .filter(member => {
          const isAvailable = checkStaffAvailability(member.id, selectedDate, selectedTime, duration)
          console.log(`👥 ${member.name} (${member.id}): ${isAvailable ? '✅ Available' : '❌ Unavailable'}`)
          return !isAvailable
        })
        .map(member => member.id)

      console.log("👥 Unavailable staff IDs:", unavailable)
      console.log("👥 === END STAFF AVAILABILITY CHECK ===");

      setUnavailableStaff(unavailable);
      setShowAvailabilityWarning(unavailable.length > 0);

      // If the currently selected staff is unavailable, clear the selection
      if (selectedStaff && unavailable.includes(selectedStaff)) {
        setSelectedStaff(null);

        toast({
          title: "Staff unavailable",
          description: "The selected stylist is not available at this time. Please choose another stylist.",
          variant: "destructive"
        });
      }
    }
  }, [selectedDate, selectedTime, selectedService, selectedStaff, selectedLocation]);

  // Refresh appointment data periodically to catch new appointments
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Refresh appointment data to ensure we have the latest information
      initializeAppointmentService();

      // If we have a selected time and staff, re-check availability
      if (selectedDate && selectedTime && selectedStaff) {
        console.log("🔄 Periodic refresh: Re-checking staff availability");
        // The staff availability useEffect will automatically trigger due to dependency changes
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [selectedDate, selectedTime, selectedStaff]);

  // Update loyalty points when service changes
  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService)
      if (service) {
        // Calculate loyalty points (1 point per unit of currency spent)
        const points = Math.floor(service.price)
        setWillEarnPoints(points)
      }
    } else {
      setWillEarnPoints(0)
    }
  }, [selectedService, services])

  // Check if a staff member has a day off on a specific date
  const hasStaffDayOff = (staffId: string, date: Date) => {
    try {
      // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = date.getDay();

      // Convert to day name
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayName = dayNames[dayOfWeek];

      // Get staff schedules from localStorage
      const schedulesJson = localStorage.getItem('vanity_staff_schedules');
      if (!schedulesJson) return false;

      const schedules = JSON.parse(schedulesJson);

      // Find if the staff has a day off schedule for this day
      return schedules.some((schedule: any) => {
        return (
          schedule.staffId === staffId &&
          schedule.day === dayName &&
          schedule.isDayOff === true &&
          schedule.isRecurring === true
        );
      });
    } catch (error) {
      console.error("Error checking staff day off:", error);
      return false;
    }
  };

  // Check if a staff member is available at a specific time - CLEANED UP
  const checkStaffAvailability = (staffId: string, date: Date, timeString: string, duration: number) => {
    try {
      console.log(`👤 Checking staff availability for ${staffId} at ${timeString}`)

      // Check if the staff has a day off on this date
      if (hasStaffDayOff(staffId, date)) {
        console.log(`👤 Staff ${staffId} has day off on ${date.toDateString()}`)
        return false
      }

      // Parse the time string (e.g., "1:30 PM")
      const [time, period] = timeString.split(' ')
      const [hourStr, minuteStr] = time.split(':')
      let hour = parseInt(hourStr)
      const minute = parseInt(minuteStr)

      // Convert to 24-hour format
      if (period === 'PM' && hour < 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0

      // Create appointment start and end times
      const appointmentStart = new Date(date)
      appointmentStart.setHours(hour, minute, 0, 0)

      const appointmentEnd = new Date(appointmentStart)
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + duration)

      console.log(`👤 Appointment window: ${appointmentStart.toLocaleTimeString()} - ${appointmentEnd.toLocaleTimeString()}`)

      // NOTE: NO 2-hour advance booking check here - that's handled in time slot generation only

      // Get all appointments from the appointment service to ensure sync with main app
      const allAppointments = getAllAppointments();

      // Check for conflicts with existing appointments
      const conflicts = allAppointments.some(appointment => {
        // Skip appointments that aren't for this staff member
        if (appointment.staffId !== staffId) return false

        // IMPORTANT: Skip completed appointments - they don't block staff availability
        if (appointment.status === "completed") {
          return false;
        }

        // IMPORTANT: Skip cancelled and no-show appointments - they don't block staff availability
        if (appointment.status === "cancelled" || appointment.status === "no-show") {
          return false;
        }

        // Skip appointments that aren't on the same day
        const appointmentDate = parseISO(appointment.date)
        if (!isSameDay(appointmentDate, date)) return false

        // Calculate the appointment's end time
        const existingAppointmentEnd = addMinutes(appointmentDate, appointment.duration)

        // Check for overlap
        return isWithinInterval(appointmentStart, { start: appointmentDate, end: existingAppointmentEnd }) ||
               isWithinInterval(appointmentEnd, { start: appointmentDate, end: existingAppointmentEnd }) ||
               (isBefore(appointmentStart, appointmentDate) && isBefore(existingAppointmentEnd, appointmentEnd))
      })

      // Staff is available if there are no conflicts
      return !conflicts
    } catch (error) {
      console.error("Error checking staff availability:", error)
      return false
    }
  }

  const handleNextStep = () => {
    // Prevent errors by wrapping in try/catch
    try {
      // Step 1: Date validation
      if (currentStep === 1 && !selectedDate) {
        toast({
          title: "Please select a date",
          description: "You need to select a date to proceed.",
          variant: "destructive",
        })
        console.log("Date selection validation failed. Current selectedDate:", selectedDate);
        return
      }

      // Step 2: Time validation
      if (currentStep === 2 && !selectedTime) {
        toast({
          title: "Please select a time",
          variant: "destructive",
        })
        return
      }

      // Step 3: Category validation
      if (currentStep === 3 && !selectedCategory) {
        toast({
          title: "Please select a service category",
          variant: "destructive",
        })
        return
      }

      // Step 4: Service validation
      if (currentStep === 4 && !selectedService) {
        toast({
          title: "Please select a service",
          variant: "destructive",
        })
        return
      }

      // Step 5: Stylist validation
      if (currentStep === 5 && !selectedStaff) {
        toast({
          title: "Please select a stylist",
          variant: "destructive",
        })
        return
      }

      // Check if selected staff is unavailable
      if (currentStep === 5 && selectedStaff && unavailableStaff.includes(selectedStaff)) {
        toast({
          title: "Staff unavailable",
          description: "The selected stylist is not available at this time. Please choose another stylist.",
          variant: "destructive",
        })
        setSelectedStaff(null)
        return
      }

      // When moving from step 5 (stylist) to step 6 (confirm), verify staff is still available
      if (currentStep === 5 && selectedTime && selectedStaff && selectedService && selectedDate) {
        const service = services.find(s => s.id === selectedService);
        if (service && !checkStaffAvailability(selectedStaff, selectedDate, selectedTime, service.duration)) {
          toast({
            title: "Staff unavailable",
            description: "The selected stylist is no longer available at this time. Please choose another stylist.",
            variant: "destructive",
          })
          return
        }
      }

      // Step 6: Contact information validation
      if (currentStep === 6) {
        if (!clientName.trim()) {
          toast({
            title: "Please enter your full name",
            variant: "destructive",
          })
          return
        }

        if (!clientPhone.trim()) {
          toast({
            title: "Please enter your phone number",
            variant: "destructive",
          })
          return
        }

        if (isGuestCheckout && !clientEmail.trim()) {
          toast({
            title: "Please enter your email address",
            variant: "destructive",
          })
          return
        }

        if (isGuestCheckout && clientEmail.trim() && !clientEmail.includes('@')) {
          toast({
            title: "Please enter a valid email address",
            variant: "destructive",
          })
          return
        }
      }

      if (currentStep < 7) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error("Error in handleNextStep:", error);
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      // If going back from service selection to category selection, clear the selected service
      if (currentStep === 4) {
        setSelectedService(null)
      }

      // If going back from category selection, clear the selected category
      if (currentStep === 3) {
        setSelectedCategory(null)
      }

      setCurrentStep(currentStep - 1)
    }
  }

  const handleGuestCheckoutToggle = (checked: boolean) => {
    console.log("Guest checkout toggle:", checked)
    setIsGuestCheckout(checked)

    if (checked) {
      // Clear client info for guest checkout
      setClientName("")
      setClientPhone("")
      setClientEmail("")
      console.log("Switched to guest checkout - cleared form fields")
    } else {
      // Restore client info from logged in user
      setClientName(client?.name || "")
      setClientPhone(client?.phone || "")
      setClientEmail(client?.email || "")
      console.log("Switched to account info - restored form fields")
    }
  }

  const handleBookAppointment = async () => {
    try {
      if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !client) {
        toast({
          title: "Missing information",
          description: "Please complete all required fields.",
          variant: "destructive",
        })
        return
      }

      if (!clientName.trim()) {
        toast({
          title: "Missing information",
          description: "Please enter your full name.",
          variant: "destructive",
        })
        return
      }

      if (!clientPhone.trim()) {
        toast({
          title: "Missing information",
          description: "Please enter your phone number.",
          variant: "destructive",
        })
        return
      }

      // Check if guest checkout is selected and email is provided
      if (isGuestCheckout && !clientEmail.trim()) {
        toast({
          title: "Missing information",
          description: "Please enter your email address.",
          variant: "destructive",
        })
        return
      }

      const finalClientEmail = isGuestCheckout ? clientEmail : client.email;

      setIsBooking(true)

      // Refresh appointment data before final validation
      initializeAppointmentService();

      // Parse the time string
      const [time, period] = selectedTime.split(' ')
      const [hourStr, minuteStr] = time.split(':')
      let hour = parseInt(hourStr)
      const minute = parseInt(minuteStr)

      // Convert to 24-hour format
      if (period === 'PM' && hour < 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0

      // Create appointment date
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(hour, minute, 0, 0)

      // NOTE: 2-hour advance booking restriction is handled in time slot generation
      // If the user got to this point, the time slot was already validated
      console.log("📝 Final booking validation - time slot already validated in generation phase")

      // Get service details
      const service = services.find(s => s.id === selectedService)
      if (!service) {
        throw new Error("Service not found")
      }

      // Final staff availability check using the local function
      const isStaffStillAvailable = checkStaffAvailability(selectedStaff, appointmentDate, selectedTime, service.duration);
      if (!isStaffStillAvailable) {
        setIsBooking(false)
        toast({
          title: "Time slot no longer available",
          description: "This time slot was just booked by another client. Please select a different time.",
          variant: "destructive",
        })
        return
      }

      // Validate staff availability across all locations before booking
      const availabilityValidation = await validateStaffAvailability({
        id: `temp-${Date.now()}`, // Temporary ID for validation
        staffId: selectedStaff,
        date: appointmentDate.toISOString(),
        duration: service.duration,
        location: selectedLocation,
        clientId: client.id,
        clientName: clientName || client.name,
        service: service.name,
        serviceId: service.id,
        status: "confirmed"
      })

      if (!availabilityValidation.isValid) {
        setIsBooking(false)

        const errorMessage = availabilityValidation.error || "The selected staff member is not available at this time."
        const isConflictError = errorMessage.includes("already has an appointment")

        toast({
          title: isConflictError ? "Time slot unavailable" : "Staff unavailable",
          description: isConflictError
            ? "This time slot is no longer available. Please select a different time or stylist."
            : errorMessage,
          variant: "destructive",
        })
        return
      }

      // Create appointment object
      const appointment = {
        id: `appointment-${Date.now()}`,
        clientId: client.id,
        clientName: clientName || client.name,
        clientEmail: finalClientEmail,
        clientPhone: clientPhone || client.phone,
        isGuestCheckout: isGuestCheckout,
        staffId: selectedStaff,
        staffName: staffDetails?.name || "Unknown Staff",
        service: service.name,
        serviceId: service.id,
        date: appointmentDate.toISOString(),
        duration: service.duration,
        location: selectedLocation,
        price: service.price,
        notes: "",
        status: "confirmed",
        source: "client_portal",
        bookedVia: "client_portal",
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date().toISOString(),
            updatedBy: "Client Portal"
          },
          {
            status: "confirmed",
            timestamp: new Date().toISOString(),
            updatedBy: "Client Portal"
          }
        ],
        type: "appointment",
        additionalServices: [],
        products: [],
        metadata: {
          source: "client_portal",
          bookedVia: "client_portal",
          bookingChannel: "Client Portal",
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        }
      }

      // Send the appointment to the API
      const response = await fetch('/api/client-portal/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointment),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to book appointment")
      }

      const result = await response.json()

      // Display booking reference in a more prominent toast
      toast({
        title: "🎉 Appointment Booked Successfully!",
        description: `Booking Reference: ${result.appointment.bookingReference}`,
        duration: 5000, // Shorter duration since success screen will show details
      })

      // Show browser notification if permission is granted
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Appointment Booked Successfully! 🎉', {
              body: `Your ${service.name} appointment is confirmed for ${format(selectedDate, "MMM d")} at ${selectedTime}. Reference: ${result.appointment.bookingReference}`,
              icon: '/favicon.ico',
              tag: 'appointment-booking',
              requireInteraction: true
            });
          } else if (Notification.permission === 'default') {
            // Request permission for future notifications
            Notification.requestPermission();
          }
        }
      } catch (error) {
        console.log("Browser notifications not supported or failed:", error);
      }

      // Add the appointment to localStorage directly as a fallback
      try {
        const storedAppointments = localStorage.getItem("vanity_appointments")
        if (storedAppointments) {
          const appointments = JSON.parse(storedAppointments)
          appointments.push(result.appointment)
          localStorage.setItem("vanity_appointments", JSON.stringify(appointments))
          console.log("Added appointment to localStorage directly")
        }
      } catch (error) {
        console.error("Error adding appointment to localStorage directly:", error)
      }

      // Initialize the appointment service to ensure all storage is in sync
      initializeAppointmentService()

      // Add the appointment to the appointment service with validation
      const appointmentResult = await addAppointmentWithValidation(result.appointment)

      if (!appointmentResult.success) {
        console.log("Appointment booking validation failed:", appointmentResult.error)

        // Check if it's a conflict error and provide better messaging
        const errorMessage = appointmentResult.error || "Failed to create appointment. Please try again."
        const isConflictError = errorMessage.includes("already has an appointment")

        toast({
          title: isConflictError ? "Time slot unavailable" : "Booking failed",
          description: isConflictError
            ? "The selected stylist is already booked for this time. Please choose a different time or stylist."
            : errorMessage,
          variant: "destructive",
        })
        setIsBooking(false)
        return
      }

      // Get all appointments and save them to ensure consistency
      const allAppointments = getAllAppointments()
      saveAppointments(allAppointments)

      // Sync with the main app's calendar view
      try {
        // Ensure the appointment is properly formatted for the main calendar
        const formattedAppointment = {
          ...result.appointment,
          // Make sure these fields are properly set for the main calendar
          bookingReference: result.appointment.bookingReference || `REF-${Date.now().toString().slice(-6)}`,
          status: "confirmed",
          paymentStatus: "unpaid",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: "client_portal"
        };

        // Dispatch a custom event that the main app can listen for
        const syncEvent = new CustomEvent('appointment-created', {
          detail: { appointment: formattedAppointment }
        });
        window.dispatchEvent(syncEvent);

        // Also update any shared storage that might be used by the main app
        if (typeof window !== 'undefined' && window.localStorage) {
          // Store the last update timestamp to trigger refresh in main app
          localStorage.setItem('vanity_appointments_last_update', new Date().toISOString());

          // Store a flag indicating a new appointment was created through the client portal
          localStorage.setItem('vanity_new_client_appointment', 'true');

          // Store the appointment ID for reference
          localStorage.setItem('vanity_last_created_appointment_id', formattedAppointment.id);
        }

        console.log("Appointment synced with main app calendar:", formattedAppointment);
      } catch (error) {
        console.error("Error syncing with main app calendar:", error);
      }

      console.log("Appointment added to service and saved:", result.appointment)

      // Add loyalty points for the booking
      try {
        // Calculate loyalty points (10 points per $1 spent on services)
        const pointsToAdd = willEarnPoints;

        if (pointsToAdd > 0) {
          const loyaltyResponse = await fetch('/api/client-portal/loyalty', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId: client.id,
              points: pointsToAdd,
              description: `Service: ${service.name}`
            }),
          });

          const loyaltyData = await loyaltyResponse.json();

          if (loyaltyResponse.ok) {
            console.log("Loyalty points added:", loyaltyData);

            // Update local loyalty points
            setLoyaltyPoints(prev => prev + pointsToAdd);

            // If the client reached a new tier, show a special toast
            if (loyaltyData.tierUpdated) {
              toast({
                title: "Tier Upgraded!",
                description: `Congratulations! You've reached ${loyaltyData.newTier} tier.`,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error adding loyalty points:", error);
      }

      // Trigger admin notifications for new booking
      try {
        // Create a notification for admin users
        const notificationData = {
          type: 'appointment_created' as const,
          title: 'New Appointment Booked',
          message: `${clientName} booked ${service.name} for ${format(selectedDate, "MMM d, yyyy")} at ${selectedTime}`,
          priority: 'normal' as const,
          category: 'appointment' as const,
          data: {
            appointmentId: result.appointment.id,
            bookingReference: result.appointment.bookingReference,
            clientName: clientName,
            serviceName: service.name,
            staffName: staff.name,
            date: selectedDate,
            time: selectedTime,
            location: getLocationName(selectedLocation),
            amount: service.price
          }
        };

        // Add to notification service for persistent notifications
        NotificationService.addNotification(notificationData);

        // Emit real-time event for immediate notifications
        realTimeService.emitEvent(RealTimeEventType.APPOINTMENT_CREATED, {
          appointment: result.appointment,
          clientName: clientName,
          staffName: staff.name,
          service: service.name,
          date: result.appointment.date,
          location: getLocationName(selectedLocation),
          amount: service.price,
          bookingReference: result.appointment.bookingReference
        }, {
          source: 'ClientPortal',
          userId: result.appointment.staffId,
          locationId: selectedLocation
        });

        // Show real-time notification for admin users
        realTimeService.showNotification({
          type: 'success',
          title: '📅 New Booking Received!',
          message: `${clientName} booked ${service.name} for ${format(selectedDate, "MMM d, yyyy")} at ${selectedTime}`,
          duration: 15000,
          actions: [
            {
              label: 'View Calendar',
              action: () => {
                // This will be handled by admin dashboard listeners
                window.dispatchEvent(new CustomEvent('navigate-to-calendar', {
                  detail: { appointmentId: result.appointment.id }
                }));
              }
            }
          ]
        });

        console.log("Admin notifications triggered for new booking:", result.appointment.bookingReference);
      } catch (error) {
        console.error("Error triggering admin notifications:", error);
      }

      // Instead of navigating away immediately, show a success screen
      console.log("🎉 Booking successful! Showing confirmation screen");

      // Mark booking as completed
      bookingCompletedRef.current = true;

      // Update state immediately
      setBookingReference(result.appointment.bookingReference);
      setIsBookingSuccess(true);
      setCurrentStep(8); // Add a new step for booking success

      // Store in localStorage as backup
      localStorage.setItem('bookingSuccess', JSON.stringify({
        reference: result.appointment.bookingReference,
        timestamp: Date.now()
      }));

      // We'll let the user navigate away manually from the success screen
    } catch (error) {
      console.log("Error booking appointment:", error)

      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      const isConflictError = errorMessage.includes("already has an appointment")

      toast({
        title: isConflictError ? "Time slot unavailable" : "Error booking appointment",
        description: isConflictError
          ? "The selected stylist is already booked for this time. Please choose a different time or stylist."
          : errorMessage,
        variant: "destructive",
      })
    } finally {
      // Only reset isBooking if booking was not successful
      // If booking was successful, keep isBooking true to maintain button state
      // until user navigates away from success screen
      if (!bookingCompletedRef.current) {
        setIsBooking(false)
      }
    }
  }

  // Wrap the component in a try-catch to handle any rendering errors
  try {
    return (
      <ClientPortalLayout>
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
          }

          /* Custom styling for the calendar in client portal */
          .date-picker-popover {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-color: #f9a8d4;
            width: auto !important;
            max-width: none !important;
          }

          .date-picker-button:focus {
            box-shadow: 0 0 0 2px #fdf2f8, 0 0 0 4px #db2777;
          }

          /* Fix for duplicate month headers */
          .date-picker-popover .rdp-caption {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 0 !important;
            margin-bottom: 0.5rem !important;
          }

          .date-picker-popover .rdp-caption_label {
            font-size: 1rem !important;
            font-weight: 600 !important;
            color: #be185d !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .date-picker-popover .rdp-nav {
            display: flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
          }

          .date-picker-popover .rdp-multiple_months .rdp-caption:not(:first-of-type) {
            display: none !important;
          }

          /* Override calendar styles to match the new appointment dialog */
          .date-picker-popover .rdp-day_selected,
          .date-picker-popover .rdp-day_selected:focus-visible,
          .date-picker-popover .rdp-day_selected:hover {
            background-color: #db2777 !important;
            color: white !important;
          }

          .date-picker-popover .rdp-day_today {
            background-color: #fce7f3 !important;
            color: #be185d !important;
            font-weight: bold !important;
          }

          .date-picker-popover .rdp-button:hover:not([disabled]) {
            background-color: #fdf2f8 !important;
          }

          .date-picker-popover .rdp-nav_button {
            color: #db2777 !important;
          }

          .date-picker-popover .rdp-nav_button:hover {
            background-color: #fdf2f8 !important;
          }

          /* Ensure proper spacing and layout */
          .date-picker-popover .rdp {
            margin: 0 !important;
          }

          .date-picker-popover .rdp-months {
            justify-content: center !important;
          }
        `}</style>
        <div className="container mx-auto px-4 py-8" style={{ backgroundImage: 'none !important' }}>
          <div className="max-w-6xl mx-auto" style={{ backgroundImage: 'none !important' }}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Book an Appointment</h1>
              <p className="text-gray-600">
                Follow the steps below to schedule your next appointment with us.
              </p>
            </div>

            {/* Location Selector */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-pink-600" />
                <h3 className="font-medium">Select Location</h3>
              </div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {/* Map through active locations from settings, excluding online store */}
                  {locationsList
                    .filter(location =>
                      location.status === "Active" &&
                      location.enableOnlineBooking &&
                      location.id !== "online" &&
                      !location.name.toLowerCase().includes("online store")
                    )
                    .map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Progress Steps */}
            <div className="relative mb-8">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2"></div>
              <div className="relative flex justify-between">
                {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        step < currentStep
                          ? "bg-green-500 text-white"
                          : step === currentStep
                            ? "bg-pink-600 text-white"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${
                      step === currentStep ? "text-pink-600 font-medium" : "text-gray-500"
                    }`}>
                      {step === 1 ? "Date" :
                       step === 2 ? "Time" :
                       step === 3 ? "Category" :
                       step === 4 ? "Service" :
                       step === 5 ? "Stylist" :
                       step === 6 ? "Your Info" :
                       "Confirm"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <Card className="mb-6 relative bg-white" style={{ backgroundImage: 'none !important' }}>
              <CardContent className="pt-6 relative z-10 bg-white" style={{ backgroundImage: 'none !important' }}>
                {/* Step 1: Select Date */}
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Select a Date</h2>
                    <div className="flex flex-col items-center">
                      <div className="w-full max-w-md mx-auto mb-6">
                        <div className="bg-pink-50 p-4 rounded-lg mb-4 text-sm text-pink-800 border border-pink-200">
                          <div className="flex items-center">
                            <Info className="h-5 w-5 mr-2 flex-shrink-0 text-pink-600" />
                            <div>
                              <p className="font-medium">Booking Information</p>
                              <p>Select a date for your appointment. You can book for today (at least 2 hours in advance) or any future date.</p>
                            </div>
                          </div>
                        </div>

                        {/* Simple Calendar Component */}
                        <div className="mx-auto max-w-md bg-white rounded-lg border border-pink-200 shadow-md overflow-hidden">
                          {selectedDate && (
                            <div className="bg-pink-50 border-b border-pink-200 p-3 text-center">
                              <div className="font-medium text-pink-800 flex items-center justify-center">
                                <CalendarIcon className="h-4 w-4 mr-2 text-pink-600" />
                                <span>Selected Date: {format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                              </div>
                            </div>
                          )}

                          {/* Simple Month Navigation */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4 bg-pink-50 p-2 rounded-md">
                              <button
                                type="button"
                                className="p-1 rounded-full hover:bg-white border border-pink-200"
                                onClick={() => {
                                  const newDate = new Date(currentMonth);
                                  newDate.setMonth(newDate.getMonth() - 1);
                                  setCurrentMonth(newDate);
                                }}
                              >
                                <ChevronLeft className="h-5 w-5 text-pink-600" />
                              </button>
                              <h3 className="text-lg font-semibold text-pink-700">
                                {format(currentMonth, 'MMMM yyyy')}
                              </h3>
                              <button
                                type="button"
                                className="p-1 rounded-full hover:bg-white border border-pink-200"
                                onClick={() => {
                                  const newDate = new Date(currentMonth);
                                  newDate.setMonth(newDate.getMonth() + 1);
                                  setCurrentMonth(newDate);
                                }}
                              >
                                <ChevronRight className="h-5 w-5 text-pink-600" />
                              </button>
                            </div>

                            {/* Day Headers */}
                            <div className="grid grid-cols-7 mb-2">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {getDaysInMonth().map((day, index) => {
                                const date = day ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) : null;
                                const isToday = date ? isSameDay(date, new Date()) : false;
                                const isSelected = date && selectedDate ? isSameDay(date, selectedDate) : false;
                                const isPast = date ? isBefore(date, startOfDay(new Date())) : false;
                                const isDisabled = isPast; // Only disable past dates, salon is open all week

                                return (
                                  <div
                                    key={index}
                                    className={`
                                      h-10 flex items-center justify-center rounded-full
                                      ${!day ? 'text-gray-300' : isDisabled ? 'text-gray-400 line-through' : 'cursor-pointer hover:bg-pink-50'}
                                      ${isSelected ? 'bg-pink-600 text-white font-semibold' : ''}
                                      ${isToday && !isSelected ? 'border-2 border-pink-500 text-pink-600 font-semibold' : ''}
                                    `}
                                    onClick={() => {
                                      if (day && !isDisabled) {
                                        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                        setSelectedDate(newDate);
                                      }
                                    }}
                                  >
                                    {day || ''}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>


                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Time */}
                {currentStep === 2 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Select a Time</h2>
                    {timeSlots.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                          No available time slots for the selected date. Please choose another date.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Go Back to Calendar
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg mb-6 text-sm text-pink-800 flex items-start border border-pink-200 shadow-sm">
                          <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-pink-600" />
                          <div>
                            <p className="font-medium">Selected Date: {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</p>
                            <p>Please select an available time slot for your appointment.</p>
                          </div>
                        </div>

                        {selectedTime && (
                          <div className="bg-pink-50 border border-pink-100 rounded-lg p-3 text-center w-full max-w-md mb-6">
                            <div className="font-medium text-pink-800 flex items-center justify-center">
                              <Clock className="h-4 w-4 mr-2 text-pink-600" />
                              <span>Selected Time: {selectedTime}</span>
                            </div>
                          </div>
                        )}

                        {/* Morning time slots */}
                        <div className="mb-6">
                          <h3 id="time-morning" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-yellow-100 p-1 rounded-full mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                              </svg>
                            </span>
                            Morning (9:00 AM - 11:45 AM)
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {timeSlots.filter(time => {
                              const [timeStr, period] = time.split(' ');
                              const hour = parseInt(timeStr.split(':')[0]);
                              // Morning: 9:00 AM - 11:45 AM
                              return period === 'AM' && hour >= 9 && hour <= 11;
                            }).map((time) => (
                              <div key={time} className="relative">
                                <Button
                                  variant="outline"
                                  className={`w-full h-12 flex flex-col items-center justify-center p-1 ${
                                    selectedTime === time
                                      ? 'border-pink-600 bg-pink-50 text-pink-700'
                                      : 'hover:border-pink-200 hover:bg-pink-50/30'
                                  }`}
                                  onClick={() => setSelectedTime(time)}
                                >
                                  <Clock className={`h-3 w-3 mb-0.5 ${selectedTime === time ? 'text-pink-600' : 'text-gray-500'}`} />
                                  <span className="text-xs">{time}</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Afternoon time slots */}
                        <div className="mb-6">
                          <h3 id="time-afternoon" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-blue-100 p-1 rounded-full mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                              </svg>
                            </span>
                            Afternoon (12:00 PM - 4:45 PM)
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {(() => {
                              const afternoonSlots = timeSlots.filter(time => {
                                const [timeStr, period] = time.split(' ');
                                const hour = parseInt(timeStr.split(':')[0]);
                                // Afternoon: 12:00 PM - 4:45 PM
                                const isAfternoon = period === 'PM' && ((hour === 12) || (hour >= 1 && hour <= 4));
                                if (isAfternoon) {
                                  console.log(`🌅 Afternoon slot found: ${time} (hour: ${hour}, period: ${period})`);
                                }
                                return isAfternoon;
                              });
                              console.log(`🌅 Total afternoon slots: ${afternoonSlots.length}`, afternoonSlots);
                              return afternoonSlots;
                            })().map((time) => (
                              <div key={time} className="relative">
                                <Button
                                  variant="outline"
                                  className={`w-full h-12 flex flex-col items-center justify-center p-1 ${
                                    selectedTime === time
                                      ? 'border-pink-600 bg-pink-50 text-pink-700'
                                      : 'hover:border-pink-200 hover:bg-pink-50/30'
                                  }`}
                                  onClick={() => setSelectedTime(time)}
                                >
                                  <Clock className={`h-3 w-3 mb-0.5 ${selectedTime === time ? 'text-pink-600' : 'text-gray-500'}`} />
                                  <span className="text-xs">{time}</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Evening time slots */}
                        <div className="mb-6">
                          <h3 id="time-evening" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <span className="bg-purple-100 p-1 rounded-full mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                              </svg>
                            </span>
                            Evening (5:00 PM - 10:00 PM)
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                            {timeSlots.filter(time => {
                              const [timeStr, period] = time.split(' ');
                              const hour = parseInt(timeStr.split(':')[0]);
                              // Evening: 5:00 PM - 10:00 PM
                              return period === 'PM' && hour >= 5 && hour <= 10;
                            }).map((time) => (
                              <div key={time} className="relative">
                                <Button
                                  variant="outline"
                                  className={`w-full h-12 flex flex-col items-center justify-center p-1 ${
                                    selectedTime === time
                                      ? 'border-pink-600 bg-pink-50 text-pink-700'
                                      : 'hover:border-pink-200 hover:bg-pink-50/30'
                                  }`}
                                  onClick={() => setSelectedTime(time)}
                                >
                                  <Clock className={`h-3 w-3 mb-0.5 ${selectedTime === time ? 'text-pink-600' : 'text-gray-500'}`} />
                                  <span className="text-xs">{time}</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Time slot navigation for easier browsing */}
                        <div className="mt-4 flex justify-center">
                          <div className="flex flex-wrap gap-2 justify-center">
                            {['Morning', 'Afternoon', 'Evening'].map((timeOfDay) => (
                              <Button
                                key={timeOfDay}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const element = document.getElementById(`time-${timeOfDay.toLowerCase()}`);
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }}
                              >
                                {timeOfDay}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Hidden anchors for scrolling */}
                        <div id="time-morning" className="scroll-mt-4"></div>
                        <div id="time-afternoon" className="scroll-mt-4"></div>
                        <div id="time-evening" className="scroll-mt-4"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Select Service Category */}
                {currentStep === 3 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Select a Service Category</h2>

                    {servicesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading services and categories...</p>
                      </div>
                    ) : servicesError ? (
                      <div className="text-center py-8">
                        <p className="text-red-500 mb-2">Error loading services: {servicesError}</p>
                        <Button
                          onClick={() => refreshData()}
                          variant="outline"
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">No service categories available at this location.</p>
                        <p className="text-sm text-gray-400">Please select a different location.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Category Selection with Visual Enhancements */}
                        <div className="bg-pink-50 p-4 rounded-lg mb-6 text-sm text-pink-800 border border-pink-200">
                          <div className="flex items-center">
                            <Info className="h-5 w-5 mr-2 flex-shrink-0 text-pink-600" />
                            <div>
                              <p className="font-medium">Service Categories</p>
                              <p>Select a category to view available services at {getLocationName(selectedLocation)}.</p>
                            </div>
                          </div>
                        </div>



                        <Tabs defaultValue={selectedCategory || (categories[0]?.name || "All")} className="w-full" onValueChange={setSelectedCategory}>
                          <TabsList className="mb-6 w-full h-auto p-2 bg-muted/50 grid gap-2" style={{
                            gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`,
                            gridAutoRows: 'min-content'
                          }}>
                            <TabsTrigger
                              key="all"
                              value="All"
                              className="flex items-center justify-center gap-2 h-auto min-h-[2.5rem] px-3 py-2 text-sm font-medium text-center"
                            >
                              <BadgePercent className="h-4 w-4 flex-shrink-0" />
                              <span>All</span>
                            </TabsTrigger>

                            {categories.map((category) => {
                              // Get the count of services in this category for this location
                              const serviceCount = services.filter(service => {
                                const categoryMatches = service.category === category.name || service.category === category.id;

                                let locationMatches = true;
                                if (service.locations && service.locations.length > 0) {
                                  locationMatches = service.locations.includes(selectedLocation);
                                }

                                return categoryMatches && locationMatches;
                              }).length;



                              // Skip categories with no services at this location
                              if (serviceCount === 0) return null;

                              return (
                                <TabsTrigger
                                  key={category.id}
                                  value={category.name}
                                  className="flex items-center justify-center gap-2 h-auto min-h-[2.5rem] px-3 py-2 text-sm font-medium text-center"
                                >
                                  {category.name === "Hair" && <Scissors className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Color" && <Palette className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Nails" && <Hand className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Skin" && <Sparkles className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Massage" && <Heart className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Makeup" && <Brush className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Waxing" && <Flame className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Extensions" && <Scissors className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Bridal" && <Heart className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Henna" && <Flower2 className="h-4 w-4 flex-shrink-0" />}
                                  {category.name === "Weyba Tis" && <Sparkles className="h-4 w-4 flex-shrink-0" />}
                                  <span className="text-center leading-tight">{category.name}</span>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>

                          {/* All Services Tab */}
                          <TabsContent key="all" value="All" className="mt-6 space-y-4">
                            <div className="grid gap-4">
                              {filteredServices.length === 0 ? (
                                <div className="text-center py-8">
                                  <p className="text-gray-500 mb-2">No services available at this location.</p>
                                </div>
                              ) : (
                                filteredServices.map((service) => (
                                  <div
                                    key={service.id}
                                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                      selectedService === service.id
                                        ? "border-pink-500 bg-pink-50"
                                        : "border-gray-200 hover:border-pink-300 hover:bg-pink-50/50"
                                    }`}
                                    onClick={() => {
                                      setSelectedService(service.id);
                                      setCurrentStep(4); // Move to next step automatically
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-medium">{service.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{service.description || `${service.name} service`}</p>
                                        <div className="flex items-center gap-3 mt-2">
                                          <div className="flex items-center text-gray-500 text-sm">
                                            <Clock className="h-3.5 w-3.5 mr-1" />
                                            {service.duration} min
                                          </div>
                                          <div className="flex items-center text-gray-500 text-sm">
                                            <Badge variant="outline" className="text-xs">
                                              {getCategoryName(service.category)}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {(service.showPrices ?? true) && (
                                          <p className="font-medium text-pink-600"><CurrencyDisplay amount={service.price} /></p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </TabsContent>

                          {/* Category Tabs */}
                          {categories.map((category) => {
                            // Get services for this category at this location
                            const categoryServices = services.filter(service => {
                              const categoryMatches = service.category === category.name || service.category === category.id;

                              let locationMatches = true;
                              if (service.locations && service.locations.length > 0) {
                                locationMatches = service.locations.includes(selectedLocation);
                              }

                              return categoryMatches && locationMatches;
                            });

                            if (categoryServices.length === 0) return null;

                            return (
                              <TabsContent key={category.id} value={category.name} className="mt-6 space-y-4">
                                <div className="grid gap-4">
                                  {categoryServices.map((service) => (
                                    <div
                                      key={service.id}
                                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                        selectedService === service.id
                                          ? "border-pink-500 bg-pink-50"
                                          : "border-gray-200 hover:border-pink-300 hover:bg-pink-50/50"
                                      }`}
                                      onClick={() => {
                                        setSelectedService(service.id);
                                        setCurrentStep(4); // Move to next step automatically
                                      }}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="font-medium">{service.name}</h3>
                                          <p className="text-sm text-gray-500 mt-1">{service.description || `${service.name} service`}</p>
                                          <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center text-gray-500 text-sm">
                                              <Clock className="h-3.5 w-3.5 mr-1" />
                                              {service.duration} min
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {(service.showPrices ?? true) && (
                                            <p className="font-medium text-pink-600"><CurrencyDisplay amount={service.price} /></p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Service Details */}
                {currentStep === 4 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">
                      Service Details
                    </h2>

                    {!serviceDetails ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">No service selected.</p>
                        <p className="text-sm text-gray-400">Please go back and select a service.</p>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentStep(3)}
                          className="mt-4 border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Go Back to Services
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-pink-50 p-4 rounded-lg mb-6 text-sm text-pink-800 border border-pink-200">
                          <div className="flex items-center">
                            <Info className="h-5 w-5 mr-2 flex-shrink-0 text-pink-600" />
                            <div>
                              <p className="font-medium">Service Information</p>
                              <p>You've selected {serviceDetails.name}. Please review the details and click Next to choose your stylist.</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg border border-pink-200 overflow-hidden shadow-sm">
                          <div className="bg-pink-50 border-b border-pink-200 p-3">
                            <h3 className="text-lg font-semibold text-pink-800 flex items-center">
                              <Badge className="mr-2 bg-pink-600">
                                {getCategoryName(serviceDetails.category)}
                              </Badge>
                              {serviceDetails.name}
                            </h3>
                          </div>

                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-gray-600">{serviceDetails.description || `${serviceDetails.name} service`}</p>

                                <div className="mt-4 flex flex-wrap gap-4">
                                  <div className="flex items-center text-gray-600">
                                    <Clock className="h-4 w-4 mr-1.5 text-pink-600" />
                                    <span>{serviceDetails.duration} minutes</span>
                                  </div>

                                  <div className="flex items-center text-gray-600">
                                    <MapPin className="h-4 w-4 mr-1.5 text-pink-600" />
                                    <span>{getLocationName(selectedLocation)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {serviceDetails.price && (
                                  <p className="text-xl font-semibold text-pink-600">
                                    <CurrencyDisplay amount={serviceDetails.price} showSymbol={true} useLocaleFormat={false} />
                                  </p>
                                )}
                                {willEarnPoints > 0 && (
                                  <div className="text-sm text-green-600 mt-1">
                                    <Star className="h-3 w-3 inline-block mr-1" />
                                    Earn {willEarnPoints} points
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Additional service details */}
                            {serviceDetails.additionalInfo && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <h4 className="font-medium text-gray-700 mb-2">Additional Information</h4>
                                <p className="text-sm text-gray-600">{serviceDetails.additionalInfo}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5: Select Stylist */}
                {currentStep === 5 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Select a Stylist</h2>

                    {showAvailabilityWarning && (
                      <Alert className="mb-4 bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-600">
                          Some stylists are unavailable at the selected time. Unavailable stylists are marked in red.
                        </AlertDescription>
                      </Alert>
                    )}

                    {staffLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading staff members...</p>
                      </div>
                    ) : staffError ? (
                      <div className="text-center py-8">
                        <p className="text-red-500 mb-2">Error loading staff: {staffError.message}</p>
                        <Button
                          onClick={() => window.location.reload()}
                          variant="outline"
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          Refresh Page
                        </Button>
                      </div>
                    ) : (
                      <RadioGroup value={selectedStaff || ""} onValueChange={setSelectedStaff}>
                      <div className="grid gap-5">
                        {staff
                          .filter(member => {
                            // Only show active staff members
                            if (member.status !== 'Active') {
                              return false;
                            }
                            // Exclude admin, super admin, and manager roles
                            if (["ADMIN", "SUPER_ADMIN", "MANAGER"].includes((member.role || "").toUpperCase())) {
                              return false;
                            }
                            // For home service location, include staff with home service capability
                            if (isHomeServiceLocationById(selectedLocation)) {
                              return member.homeService === true ||
                                     member.locations.includes(selectedLocation);
                            }
                            // For regular locations, include staff assigned to that location
                            return member.locations.includes(selectedLocation);
                          })
                          .map((member) => {
                            const isUnavailable = unavailableStaff.includes(member.id);
                            return (
                              <div key={member.id} className="relative">
                                <RadioGroupItem
                                  value={member.id}
                                  id={`staff-${member.id}`}
                                  className="peer sr-only"
                                  disabled={isUnavailable}
                                />
                                <Label
                                  htmlFor={`staff-${member.id}`}
                                  className={`flex items-center justify-between p-5 border rounded-lg shadow-sm ${
                                    isUnavailable
                                      ? "border-red-200 bg-red-50 opacity-60 cursor-not-allowed"
                                      : "cursor-pointer hover:border-pink-200 hover:shadow peer-data-[state=checked]:border-pink-600 peer-data-[state=checked]:bg-pink-50 transition-all"
                                  }`}
                                >
                                  <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 overflow-hidden">
                                      {member.profileImage ? (
                                        <img
                                          src={member.profileImage}
                                          alt={member.name}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      ) : (
                                        <span className="text-lg font-medium">{member.avatar}</span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center">
                                        <p className={`font-medium text-lg ${isUnavailable ? "text-red-500" : ""}`}>{member.name}</p>
                                        {isUnavailable && (
                                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                                            Unavailable
                                          </span>
                                        )}
                                        {member.employeeNumber && (
                                          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            {member.employeeNumber}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-500 capitalize mt-1">Stylist</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="flex text-amber-400">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-5 w-5 fill-amber-400" />
                                      ))}
                                    </div>
                                    <span className="text-sm text-gray-500 ml-1">(120+)</span>
                                  </div>
                                </Label>
                              </div>
                            );
                          })}
                      </div>
                    </RadioGroup>
                    )}
                  </div>
                )}

                {/* Step 6: Your Information */}
                {currentStep === 6 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">
                      Your Information
                    </h2>

                    <div className={`bg-white rounded-lg border p-6 mb-6 ${isGuestCheckout ? 'border-pink-300 bg-pink-50/30' : ''}`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">Contact Details</h3>
                          {isGuestCheckout && (
                            <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">Guest Mode</span>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
                          isGuestCheckout
                            ? 'bg-pink-100 border-pink-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <span className={`text-xs ${isGuestCheckout ? 'text-pink-700' : 'text-gray-600'}`}>
                            Guest Checkout
                          </span>
                          <label htmlFor="guestCheckout" className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isGuestCheckout}
                              className="sr-only peer"
                              id="guestCheckout"
                              onChange={(e) => handleGuestCheckoutToggle(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="clientName" className="text-sm text-gray-500">
                            Full Name
                            {!isGuestCheckout && <span className="text-xs text-gray-400 ml-1">(from account)</span>}
                          </Label>
                          <Input
                            id="clientName"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Your full name"
                            className={`mt-1 ${!isGuestCheckout ? 'bg-gray-50' : ''}`}
                            readOnly={!isGuestCheckout}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientPhone" className="text-sm text-gray-500">
                            Phone Number
                            {!isGuestCheckout && <span className="text-xs text-gray-400 ml-1">(from account)</span>}
                          </Label>
                          <Input
                            id="clientPhone"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="Your phone number"
                            className={`mt-1 ${!isGuestCheckout ? 'bg-gray-50' : ''}`}
                            readOnly={!isGuestCheckout}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="clientEmail" className="text-sm text-gray-500">Email</Label>
                          {isGuestCheckout ? (
                            <Input
                              id="clientEmail"
                              type="email"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              placeholder="Your email address"
                              className="mt-1"
                              required
                            />
                          ) : (
                            <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded border">{client?.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-gray-500">
                        <p>Your contact information is used to send appointment confirmations and reminders.</p>
                        {isGuestCheckout && (
                          <div className="mt-2 p-2 bg-pink-50 border border-pink-200 rounded text-pink-700">
                            <p className="font-medium">Guest Checkout Mode</p>
                            <p>You're booking as a guest. Enter your contact details below to receive appointment confirmations.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                      <p>
                        <strong>Note:</strong> Please ensure your contact information is correct as this will be used for appointment confirmations and updates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 7: Confirmation */}
                {currentStep === 7 && (
                  <div className="relative bg-white z-10" style={{ backgroundImage: 'none !important' }}>
                    <h2 className="text-xl font-bold mb-4 confirm-your-appointment">Confirm Your Appointment</h2>
                    <div className="space-y-6 relative z-10 bg-white" style={{ backgroundImage: 'none !important' }}>
                      <div className="bg-gray-50 p-4 rounded-lg relative z-10" style={{ backgroundImage: 'none !important' }}>
                        <h3 className="font-medium mb-3">Appointment Details</h3>
                        {/* Booking reference will be shown here after booking */}
                        {bookingReference && (
                          <div className="mb-3 p-2 bg-pink-50 border border-pink-200 rounded-md">
                            <p className="text-sm font-medium text-pink-800">Booking Reference: {bookingReference}</p>
                            <p className="text-xs text-pink-600">Please save this number for your records</p>
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <Scissors className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium">{serviceDetails?.name}</p>
                              <div className="text-sm text-gray-500">
                                {serviceDetails?.price && (
                                  <span className="bg-white px-1 rounded">
                                    <CurrencyDisplay amount={serviceDetails.price} showSymbol={true} useLocaleFormat={false} />
                                  </span>
                                )}
                                {serviceDetails?.price && " • "}
                                {serviceDetails?.duration} min
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <User className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium">{staffDetails?.name}</p>
                              <p className="text-sm text-gray-500 capitalize">Stylist</p>
                              <div className="flex items-center mt-1">
                                <div className="flex text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500 ml-1">(120+)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <CalendarIcon className="h-5 w-5 text-pink-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">
                                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
                              </p>
                              <p className="text-sm text-gray-500">{selectedTime}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium">{getLocationName(selectedLocation)}</p>
                              <p className="text-sm text-gray-500">
                                {selectedLocation === "home"
                                  ? "Our stylist will come to your address"
                                  : "123 Main Street, Suite 100"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <User className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">Client Information</p>
                                {isGuestCheckout && (
                                  <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">Guest</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{clientName}</p>
                              <p className="text-sm text-gray-500">{clientPhone}</p>
                              <p className="text-sm text-gray-500">
                                {isGuestCheckout ? clientEmail : client?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 relative z-10 bg-white" style={{ backgroundImage: 'none !important' }}>
                        {/* Service pricing section */}
                        {serviceDetails && serviceDetails.price && (
                          <>
                            <div className="flex justify-between mb-2">
                              <span>Service Fee</span>
                              <span className="bg-white px-2 py-1 rounded shadow-sm">
                                <CurrencyDisplay amount={serviceDetails.price} showSymbol={true} useLocaleFormat={false} />
                              </span>
                            </div>
                            {willEarnPoints > 0 && (
                              <div className="flex justify-between mb-2 text-green-600">
                                <span>Loyalty Points</span>
                                <span>+{willEarnPoints} points</span>
                              </div>
                            )}
                            <div className="flex justify-between font-medium text-lg mt-2 pt-2 border-t">
                              <span>Total</span>
                              <span className="bg-white px-2 py-1 rounded shadow-sm">
                                <CurrencyDisplay amount={serviceDetails.price} showSymbol={true} useLocaleFormat={false} />
                              </span>
                            </div>
                          </>
                        )}

                        {/* Fallback if no service details or price */}
                        {(!serviceDetails || !serviceDetails.price) && (
                          <div className="text-center text-gray-500">
                            <p>Service pricing information not available</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p>
                          <strong>Note:</strong> A credit card is not required to book your appointment.
                          You'll pay at the salon after your service is complete.
                        </p>
                      </div>

                      {willEarnPoints > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 flex items-start">
                          <BadgePercent className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Earn {willEarnPoints} Loyalty Points</p>
                            <p>Book this appointment and earn points towards rewards!</p>
                            <div className="mt-2 flex items-center">
                              <div className="flex-1">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${Math.min(100, (loyaltyPoints / (loyaltyPoints + 50)) * 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className="ml-2 text-xs">{loyaltyPoints} / {loyaltyPoints + 50} points</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-pink-50 border border-pink-100 p-4 rounded-lg">
                        <p className="text-sm text-pink-800">
                          By booking this appointment, you agree to our <a href="#" className="underline">cancellation policy</a>.
                          Please provide at least 24 hours notice if you need to cancel or reschedule.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 8: Booking Success */}
                {(currentStep === 8 || isBookingSuccess) && (
                  <div id="booking-confirmed" className="booking-confirmed bg-gradient-to-br from-green-50 to-pink-50 border-2 border-green-200 rounded-lg p-6">

                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                      <p className="text-gray-600 mb-6">Your appointment has been successfully scheduled.</p>

                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6 mx-auto max-w-md">
                        <h3 className="font-medium text-pink-800 mb-1">Booking Reference</h3>
                        <p className="text-2xl font-bold text-pink-700 mb-1">{bookingReference}</p>
                        <p className="text-sm text-pink-600">Please save this number for your records</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg mb-6 mx-auto max-w-md text-left">
                        <h3 className="font-medium mb-3">Appointment Details</h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <Scissors className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium">{serviceDetails?.name}</p>
                              <p className="text-sm text-gray-500">
                                {serviceDetails?.price && (
                                  <span className="bg-white px-1 rounded">
                                    <CurrencyDisplay amount={serviceDetails.price} showSymbol={true} useLocaleFormat={false} />
                                  </span>
                                )}
                                {serviceDetails?.price && " • "}
                                {serviceDetails?.duration} min
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <User className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium">{staffDetails?.name}</p>
                              <p className="text-sm text-gray-500 capitalize">Stylist</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <User className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">Client Information</p>
                                {isGuestCheckout && (
                                  <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">Guest</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{clientName}</p>
                              <p className="text-sm text-gray-500">{clientPhone}</p>
                              <p className="text-sm text-gray-500">
                                {isGuestCheckout ? clientEmail : client?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <CalendarIcon className="h-5 w-5 text-pink-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">
                                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "No date selected"}
                              </p>
                              <p className="text-sm text-gray-500">{selectedTime}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-pink-600 mr-3 mt-0.5" />
                            <div>
                              <p className="font-medium">{getLocationName(selectedLocation)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          className="bg-pink-600 hover:bg-pink-700"
                          onClick={() => {
                            localStorage.removeItem('bookingSuccess');
                            setIsBooking(false);
                            bookingCompletedRef.current = false;
                            router.push("/client-portal/appointments");
                          }}
                        >
                          View My Appointments
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            localStorage.removeItem('bookingSuccess');
                            setIsBooking(false);
                            bookingCompletedRef.current = false;
                            router.push("/client-portal");
                          }}
                        >
                          Return to Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons - Hide on success screen */}
            {currentStep !== 8 && !isBookingSuccess && (
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={currentStep === 1 ? () => router.push('/client-portal') : handlePreviousStep}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {currentStep === 1 ? "Back to Portal" : "Back"}
                </Button>

                {currentStep < 7 ? (
                  <Button
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={handleNextStep}
                    disabled={
                      (currentStep === 1 && !selectedDate) ||
                      (currentStep === 2 && !selectedTime) ||
                      (currentStep === 3 && !selectedCategory) ||
                      (currentStep === 4 && !selectedService) ||
                      (currentStep === 5 && !selectedStaff) ||
                      (currentStep === 6 && (!clientName || !clientPhone || (isGuestCheckout && !clientEmail)))
                    }
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    className={isBookingSuccess ? "bg-green-600 hover:bg-green-700 text-white" : "bg-pink-600 hover:bg-pink-700 text-white"}
                    onClick={handleBookAppointment}
                    disabled={isBooking || isBookingSuccess}
                  >
                    {isBookingSuccess ? "Booking Complete" : isBooking ? "Booking..." : "Book Appointment"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </ClientPortalLayout>
    );
  } catch (error) {
    console.error("Rendering error:", error);
    return <div>Error rendering page. Please try again later.</div>;
  }
}
