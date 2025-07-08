"use client"

import { useState, useEffect } from "react"
import { EnhancedSalonCalendar } from "@/components/scheduling/enhanced-salon-calendar"
import { EnhancedAppointmentDetailsDialog } from "@/components/scheduling/enhanced-appointment-details-dialog"
import { useToast } from "@/components/ui/use-toast"
import { ServiceStorage } from "@/lib/service-storage"
import { parseISO, format } from "date-fns"
import { AppointmentStatus } from "@/lib/types/appointment"
import { getAllAppointments, addAppointmentWithValidation, updateAppointment, initializeAppointmentService, saveAppointments } from "@/lib/appointment-service"
import { useTransactions } from "@/lib/transaction-provider"
import { InventoryTransactionService } from "@/lib/inventory-transaction-service"
import { TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { ConsolidatedTransactionService } from "@/lib/consolidated-transaction-service"
import {
  findExistingTransactionsForAppointment,
  canCreateTransactionForAppointment,
  markTransactionCreationInProgress,
  validateTransactionCreation
} from "@/lib/transaction-deduplication"
import { getCleanClientName } from "@/lib/utils/client-name-utils"

export default function AppointmentsPage() {
  const { toast } = useToast()
  const { addTransaction, transactions } = useTransactions()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [isAppointmentDetailsDialogOpen, setIsAppointmentDetailsDialogOpen] = useState(false)
  const [appointments, setAppointments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])



  // Load services on component mount
  useEffect(() => {
    const loadedServices = ServiceStorage.getServices()
    setServices(loadedServices)
  }, [])

  // Initialize inventory transaction service with transaction callback
  const inventoryService = new InventoryTransactionService((transaction) => {
    addTransaction(transaction)
  })

  // Helper function to calculate appointment total
  const calculateAppointmentTotal = (appointment: any) => {
    let total = 0;

    // Add main service price
    if (typeof appointment.price === 'number') {
      total += appointment.price;
    }

    // Add additional services prices
    if (appointment.additionalServices && appointment.additionalServices.length > 0) {
      appointment.additionalServices.forEach((service: any) => {
        if (typeof service.price === 'number') {
          total += service.price;
        }
      });
    }

    // Add products prices
    if (appointment.products && appointment.products.length > 0) {
      appointment.products.forEach((product: any) => {
        if (typeof product.price === 'number') {
          total += product.price;
        }
      });
    }

    return total;
  };

  // Function to record consolidated appointment transaction when completed
  // Updated: Accept paymentMethod, discountPercentage, discountAmount
const recordAppointmentTransaction = (
  appointment: any,
  paymentMethod: string = PaymentMethod.CASH,
  discountPercentage: number = 0,
  discountAmount: number = 0
) => {
    try {
      console.log("=== RECORD CONSOLIDATED APPOINTMENT TRANSACTION CALLED ===");
      console.log("Recording consolidated transaction for appointment:", appointment);
      console.log("addTransaction function available:", typeof addTransaction);

      // Ensure price is set from service data if missing
      if (appointment.service && !appointment.price) {
        const service = services.find(s => s.name === appointment.service);
        if (service) {
          appointment.price = service.price;
          console.log(`Set price from service data: ${appointment.service} = ${service.price}`);
        }
      }

      // Calculate total amount to validate
      const totalAmount = calculateAppointmentTotal(appointment);

      console.log("Appointments page - Recording consolidated appointment transaction:", {
        totalAmount,
        appointmentId: appointment.id,
        clientName: appointment.clientName
      });

      if (totalAmount <= 0) {
        console.log("Appointments page - No amount to charge, skipping transaction");
        return;
      }

      // Create consolidated transaction using the new service
      const consolidatedTransaction = ConsolidatedTransactionService.createConsolidatedTransaction(
  appointment,
  paymentMethod,
  discountPercentage,
  discountAmount
);

      console.log('📊 APPOINTMENTS PAGE: Creating consolidated transaction:', {
        transactionId: consolidatedTransaction.id,
        totalAmount: consolidatedTransaction.amount,
        serviceAmount: consolidatedTransaction.serviceAmount,
        productAmount: consolidatedTransaction.productAmount,
        itemCount: consolidatedTransaction.items?.length || 0
      });

      // Add the consolidated transaction
      const result = addTransaction(consolidatedTransaction);
      console.log("🔍 Appointments page - Consolidated transaction add result:", result);

      if (result) {
        console.log("✅ Appointments page: Consolidated transaction created successfully:", {
          transactionId: consolidatedTransaction.id,
          totalAmount: consolidatedTransaction.amount,
          serviceAmount: consolidatedTransaction.serviceAmount,
          productAmount: consolidatedTransaction.productAmount
        });
      } else {
        console.error("❌ Appointments page: Failed to create consolidated transaction");
      }

      // Force a localStorage check to verify the consolidated transaction was saved
      setTimeout(() => {
        const storedTransactions = localStorage.getItem('vanity_transactions');
        if (storedTransactions) {
          const parsed = JSON.parse(storedTransactions);
          console.log("Appointments page - Transactions in localStorage after appointment completion:", parsed.length);
          const appointmentTransactions = parsed.filter((tx: any) =>
            tx.source === 'calendar' &&
            tx.reference?.type === 'appointment' &&
            tx.reference?.id === appointment.id
          );
          console.log("Appointments page - This appointment's consolidated transactions in localStorage:", appointmentTransactions.length);

          const consolidatedTransactions = appointmentTransactions.filter((tx: any) => tx.type === 'consolidated_sale');
          console.log("Appointments page - Consolidated transaction details:", {
            consolidatedTransactions: consolidatedTransactions.length,
            consolidatedDetails: consolidatedTransactions.map(tx => ({
              id: tx.id,
              amount: tx.amount,
              serviceAmount: tx.serviceAmount,
              productAmount: tx.productAmount,
              itemCount: tx.items?.length || 0
            }))
          });
        }
      }, 1000);

      toast({
        title: "Transaction Recorded",
        description: `Consolidated transaction of QAR ${totalAmount.toFixed(2)} has been recorded for ${appointment.clientName}.`,
      });

      console.log("Appointments page - Consolidated appointment transaction recorded for:", appointment.id);
    } catch (error) {
      console.error("Error recording appointment transaction:", error);
      toast({
        variant: "destructive",
        title: "Transaction Error",
        description: "Failed to record transaction for completed appointment.",
      });
    }
  }

  // Enhanced function to check and create missing transactions with duplicate prevention
  const checkAndCreateMissingTransactions = (appointmentsList: any[]) => {
    console.log("=== CHECKING FOR MISSING TRANSACTIONS (Enhanced) ===");

    const completedAppointments = appointmentsList.filter(apt => apt.status === 'completed');
    console.log("Found completed appointments:", completedAppointments.length);

    completedAppointments.forEach(appointment => {
      const totalAmount = calculateAppointmentTotal(appointment);
      console.log(`Checking appointment ${appointment.id} (${appointment.clientName}) - Total: ${totalAmount}`);

      if (totalAmount > 0) {
        // Use the deduplication utility to validate transaction creation
        const appointmentRef = {
          id: appointment.id,
          bookingReference: appointment.bookingReference,
          clientId: appointment.clientId,
          date: appointment.date,
          amount: totalAmount,
          _transactionCreationInProgress: appointment._transactionCreationInProgress
        };

        const validation = validateTransactionCreation(transactions, appointmentRef);

        if (validation.canCreate) {
          console.log(`Creating missing transaction for appointment ${appointment.id}`);

          // Mark transaction creation in progress
          markTransactionCreationInProgress(appointment);
          recordAppointmentTransaction(appointment, PaymentMethod.CASH, 0, 0);
        } else {
          console.log(`Skipping transaction creation for appointment ${appointment.id}: ${validation.reason}`);

          // Log existing transactions for debugging
          const existingTransactions = findExistingTransactionsForAppointment(transactions, appointmentRef);
          if (existingTransactions.length > 0) {
            console.log(`Transaction(s) already exist for appointment ${appointment.id}:`, existingTransactions.length);
            existingTransactions.forEach((tx, index) => {
              console.log(`  Transaction ${index + 1}: ${tx.id} - ${tx.amount} - ${tx.source}`);
            });
          }
        }
      }
    });
  };

  // Load appointments using the appointment service
  useEffect(() => {
    // Force a synchronization of all appointment data sources
    const forceSyncAppointments = () => {
      console.log("AppointmentsPage: Forcing synchronization of all appointment data sources");

      // Initialize the appointment service to ensure all storage is in sync
      initializeAppointmentService();

      // Get all appointments from all sources (localStorage, mockAppointments, appointments array)
      const allAppointments = getAllAppointments();
      console.log("AppointmentsPage: Loaded appointments via service", allAppointments.length);

      // Set the appointments state
      setAppointments(allAppointments);

      // Check for missing transactions after appointments are loaded
      setTimeout(() => {
        checkAndCreateMissingTransactions(allAppointments);
      }, 2000);

      // Also directly check localStorage to ensure we have the latest data
      try {
        const storedAppointments = localStorage.getItem("vanity_appointments");
        if (storedAppointments) {
          const parsedAppointments = JSON.parse(storedAppointments);
          console.log("AppointmentsPage: Direct localStorage check found", parsedAppointments.length, "appointments");

          // If localStorage has more appointments than our current state, use those instead
          if (parsedAppointments.length > allAppointments.length) {
            console.log("AppointmentsPage: Using localStorage appointments as they contain more data");
            setAppointments(parsedAppointments);

            // Also update the appointment service with this data
            saveAppointments(parsedAppointments);

            // Check for missing transactions for the localStorage appointments too
            setTimeout(() => {
              checkAndCreateMissingTransactions(parsedAppointments);
            }, 2000);
          }
        }
      } catch (error) {
        console.error("AppointmentsPage: Error checking localStorage directly", error);
      }
    };

    // Initial load
    forceSyncAppointments();

    // Set up an interval to refresh appointments every 5 seconds (more frequent than before)
    const refreshInterval = setInterval(() => {
      console.log("AppointmentsPage: Refreshing appointments...");
      forceSyncAppointments();
    }, 5000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, []);

  const handleAppointmentClick = (appointment: any) => {
    // If this is a reflected appointment, find and show the original appointment instead
    if (appointment.isReflected && appointment.originalAppointmentId) {
      const originalAppointment = appointments.find(apt => apt.id === appointment.originalAppointmentId);
      if (originalAppointment) {
        const service = services.find(s => s.name === originalAppointment.service);
        if (service) {
          originalAppointment.price = service.price;
        }
        setSelectedAppointment(originalAppointment)
        setIsAppointmentDetailsDialogOpen(true)
        return;
      }
    }

    // Find the full appointment data
    const fullAppointment = appointments.find((a) => a.id === appointment.id)
    if (fullAppointment) {
      // Always ensure price is properly set from the service
      // This fixes cases where price might be 0, undefined, or null
      const service = services.find(s => s.name === fullAppointment.service);
      if (service) {
        fullAppointment.price = service.price;
      }
      setSelectedAppointment(fullAppointment)
      setIsAppointmentDetailsDialogOpen(true)
    } else {
      // Fallback to using the appointment as is if not found in appointments data
      // Also try to set the price from services if possible
      if (appointment.service) {
        const service = services.find(s => s.name === appointment.service);
        if (service) {
          appointment.price = service.price;
        }
      }
      setSelectedAppointment(appointment)
      setIsAppointmentDetailsDialogOpen(true)
    }
  }

  // Save appointments using the appointment service whenever they change
  useEffect(() => {
    if (appointments.length > 0) {
      // We don't need to explicitly save here since the appointment service
      // handles saving when appointments are added or updated
      console.log("AppointmentsPage: Appointments state updated", appointments.length);
    }
  }, [appointments]);

  const handleStatusChange = (appointmentId: string, newStatus: string, timestamp?: string) => {
    // Update the appointment status and add to status history
    const updatedAppointments = appointments.map((appointment) => {
      if (appointment.id === appointmentId) {
        const newTimestamp = timestamp || new Date().toISOString();

        // Check if we're trying to revert to a previous status
        const statusProgression = ['pending', 'confirmed', 'arrived', 'service-started', 'completed'];
        const terminalStatuses = ['completed', 'cancelled', 'no-show'];

        // If current status is a terminal status, no changes allowed
        if (terminalStatuses.includes(appointment.status)) {
          toast({
            variant: "destructive",
            title: "Cannot Update Status",
            description: `This appointment is already marked as ${appointment.status}. Status cannot be changed.`,
          });
          return appointment;
        }

        // For normal progression, only allow moving forward in the workflow
        if (!terminalStatuses.includes(newStatus)) {
          const currentIndex = statusProgression.indexOf(appointment.status);
          const newIndex = statusProgression.indexOf(newStatus as AppointmentStatus);

          // Only allow moving to the next status in the progression
          if (newIndex !== currentIndex + 1) {
            toast({
              variant: "destructive",
              title: "Invalid Status Update",
              description: "Status updates must follow the proper workflow and cannot be reversed.",
            });
            return appointment;
          }
        }

        // If we get here, the status update is valid
        const updatedAppointment = {
          ...appointment,
          status: newStatus as AppointmentStatus,
          statusHistory: [
            ...(appointment.statusHistory || []),
            {
              status: newStatus as AppointmentStatus,
              timestamp: newTimestamp,
              updatedBy: "Staff"
            }
          ],
          // Add a flag to trigger animation in the UI
          justUpdated: true
        };

        // Ensure price is set from service data before recording transaction
        if (updatedAppointment.service && !updatedAppointment.price) {
          const service = services.find(s => s.name === updatedAppointment.service);
          if (service) {
            updatedAppointment.price = service.price;
            console.log(`Set price for appointment before transaction: ${updatedAppointment.service} = ${service.price}`);
          }
        }

        toast({
          description: `Appointment status updated to ${newStatus.replace('-', ' ')}.`,
        });

        // Record transaction when appointment is completed with duplicate prevention
        // NOTE: Skip automatic transaction recording if payment information is present
        // This indicates the appointment was completed through the enhanced dialog with proper discount handling
        if (newStatus === 'completed') {
          console.log("=== APPOINTMENT COMPLETION DETECTED ===");
          console.log("Appointment completed, recording transaction for:", updatedAppointment);
          console.log("Appointment service:", updatedAppointment.service);
          console.log("Appointment price:", updatedAppointment.price);
          console.log("Appointment client:", updatedAppointment.clientName);

          // Check if this appointment has payment information or transaction already recorded
          const hasPaymentInfo = updatedAppointment.paymentMethod || updatedAppointment.paymentStatus === 'paid';
          const transactionAlreadyRecorded = updatedAppointment.transactionRecorded;
          console.log("Payment info present:", hasPaymentInfo, {
            paymentMethod: updatedAppointment.paymentMethod,
            paymentStatus: updatedAppointment.paymentStatus,
            paymentDate: updatedAppointment.paymentDate,
            transactionRecorded: transactionAlreadyRecorded
          });

          if (hasPaymentInfo || transactionAlreadyRecorded) {
            console.log("=== SKIPPING automatic transaction recording ===");
            console.log("Reason: Appointment completed through enhanced dialog with payment processing or transaction already recorded");
            toast({
              title: "Appointment Completed",
              description: "Appointment marked as completed with payment processed.",
            });
            return; // Exit early to prevent duplicate transaction creation
          }

          // Check if this appointment has a total amount
          const totalAmount = calculateAppointmentTotal(updatedAppointment);
          console.log("Calculated total amount:", totalAmount);

          if (totalAmount > 0) {
            // Use the deduplication utility to validate transaction creation
            const appointmentRef = {
              id: updatedAppointment.id,
              bookingReference: updatedAppointment.bookingReference,
              clientId: updatedAppointment.clientId,
              date: updatedAppointment.date,
              amount: totalAmount,
              _transactionCreationInProgress: updatedAppointment._transactionCreationInProgress
            };

            const validation = validateTransactionCreation(transactions, appointmentRef);

            if (validation.canCreate) {
              console.log("=== CALLING recordAppointmentTransaction (with amount, no duplicates found) ===");

              // Mark transaction creation in progress
              markTransactionCreationInProgress(updatedAppointment);
              recordAppointmentTransaction(updatedAppointment);
            } else {
              console.log("=== SKIPPING transaction recording ===");
              console.log("Reason:", validation.reason);

              toast({
                title: "Appointment Completed",
                description: "Appointment marked as completed.",
              });
            }
          } else {
            console.log("=== SKIPPING transaction recording (no amount) ===");
            toast({
              title: "Appointment Completed",
              description: "Appointment marked as completed (no charges).",
            });
          }
        }

        return updatedAppointment;
      }
      return appointment;
    });

    // Update state with the new appointments
    setAppointments(updatedAppointments);

    // Update the selected appointment if it's the one being updated
    const updatedAppointment = updatedAppointments.find(a => a.id === appointmentId);
    if (updatedAppointment && selectedAppointment && selectedAppointment.id === appointmentId) {
      setSelectedAppointment(updatedAppointment);
    }

    // Use the appointment service to update the appointment
    const appointmentToUpdate = updatedAppointments.find(a => a.id === appointmentId);
    if (appointmentToUpdate) {
      updateAppointment(appointmentId, appointmentToUpdate).catch(error => {
        console.error("Error updating appointment:", error);
      });
      console.log("AppointmentsPage: Updated appointment status via service", appointmentId, newStatus);
    }

    // Clear the justUpdated flag after animation completes
    setTimeout(() => {
      const animationClearedAppointments = updatedAppointments.map((appointment) => {
        if (appointment.id === appointmentId) {
          const clearedAppointment = { ...appointment, justUpdated: false };
          // Update in the appointment service
          updateAppointment(appointmentId, clearedAppointment);
          return clearedAppointment;
        }
        return appointment;
      });

      setAppointments(animationClearedAppointments);

      // Update the selected appointment if it's the one being updated
      const clearedAppointment = animationClearedAppointments.find(a => a.id === appointmentId);
      if (clearedAppointment && selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment(clearedAppointment);
      }
    }, 2000);
  }

  const handleAppointmentCreated = async (newAppointment: any) => {
    console.log("AppointmentsPage handleAppointmentCreated called with:", newAppointment);

    // Ensure price is properly set from the service for new appointments
    if (newAppointment.service && !newAppointment.price) {
      const service = services.find(s => s.name === newAppointment.service);
      if (service) {
        newAppointment.price = service.price;
      }
    }

    // Add the new appointment to the list with proper status history
    const appointmentWithHistory = {
      ...newAppointment,
      statusHistory: [
        {
          status: newAppointment.status || "pending",
          timestamp: new Date().toISOString(),
          updatedBy: "Staff"
        }
      ]
    };

    // Use the appointment service to add the appointment with validation
    const result = await addAppointmentWithValidation(appointmentWithHistory);

    if (!result.success) {
      console.error("Failed to create appointment:", result.error);
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: result.error || "Failed to create appointment. Please try again.",
      });
      return;
    }

    console.log("AppointmentsPage: Added new appointment via service", appointmentWithHistory.id);

    // Update the state with the new appointment
    const updatedAppointments = [...appointments, appointmentWithHistory];
    setAppointments(updatedAppointments);

    // Different toast message based on appointment type
    if (newAppointment.type === "blocked") {
      toast({
        title: "Time blocked",
        description: `${newAppointment.title} has been scheduled for ${format(parseISO(newAppointment.date), "MMMM d 'at' h:mm a")}.`,
      });
    } else {
      toast({
        title: "Appointment created",
        description: `Appointment for ${newAppointment.clientName} on ${format(parseISO(newAppointment.date), "MMMM d 'at' h:mm a")} has been created.`,
      });
    }
  }

  const handleAppointmentUpdated = (updatedAppointmentData: any) => {
    // Check if we're receiving a full array of appointments or just a single update
    if (Array.isArray(updatedAppointmentData)) {
      console.log("AppointmentsPage: Received full appointments array update", updatedAppointmentData.length);

      // Compare with current appointments to avoid unnecessary updates
      const currentAppointmentsJSON = JSON.stringify(appointments);
      const updatedAppointmentsJSON = JSON.stringify(updatedAppointmentData);

      if (currentAppointmentsJSON !== updatedAppointmentsJSON) {
        // Update state with the new array
        setAppointments(updatedAppointmentData);

        // Update the appointment service with all appointments
        saveAppointments(updatedAppointmentData);

        toast({
          title: "Appointments refreshed",
          description: `Updated ${updatedAppointmentData.length} appointments.`,
        });
      }
      return; // Exit early to prevent the rest of the function from executing
    }

    // Handle single appointment update
    const updatedAppointment = updatedAppointmentData;

    console.log("📥 AppointmentsPage: Received single appointment update", {
      appointmentId: updatedAppointment.id,
      clientName: updatedAppointment.clientName,
      paymentStatus: updatedAppointment.paymentStatus,
      paymentMethod: updatedAppointment.paymentMethod,
      status: updatedAppointment.status
    });

    // Update the appointment in the list, carefully preserving any additional services or products
    const updatedAppointments = appointments.map((appointment) => {
      if (appointment.id === updatedAppointment.id) {
        // Create a merged appointment that preserves all properties
        const mergedAppointment = {
          ...appointment,
          ...updatedAppointment,
          // Ensure additionalServices and products are properly preserved
          additionalServices: updatedAppointment.additionalServices || appointment.additionalServices || [],
          products: updatedAppointment.products || appointment.products || []
        };

        // Ensure price is properly set from the service
        if (mergedAppointment.service) {
          const service = services.find(s => s.name === mergedAppointment.service);
          if (service) {
            mergedAppointment.price = service.price;
          }
        }

        return mergedAppointment;
      }
      return appointment;
    });

    // Update the appointment in the appointment service
    if (updatedAppointment.id) {
      updateAppointment(updatedAppointment.id, updatedAppointment);
      console.log("AppointmentsPage: Updated appointment via service", updatedAppointment.id);
    }

    // Update state
    setAppointments(updatedAppointments);

    // Only show a toast if it's not a service or product addition (those have their own toasts)
    if (!updatedAppointment.additionalServices && !updatedAppointment.products) {
      toast({
        title: "Appointment updated",
        description: `Appointment for ${updatedAppointment.clientName} has been updated.`,
      });
    }
  }





  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Appointments</h1>
      </div>

      {/* EnhancedSalonCalendar with both Calendar View and Booking Summary tabs */}
      <EnhancedSalonCalendar
        onDateSelect={setDate}
        onAppointmentClick={handleAppointmentClick}
        selectedDate={date}
        appointments={appointments}
        onAppointmentCreated={handleAppointmentCreated}
        onAppointmentUpdated={handleAppointmentUpdated}
      />

      {selectedAppointment && (
        <EnhancedAppointmentDetailsDialog
  open={isAppointmentDetailsDialogOpen}
  onOpenChange={setIsAppointmentDetailsDialogOpen}
  appointment={selectedAppointment}
  onStatusChange={handleStatusChange}
  onAppointmentUpdated={(updatedAppointment) => {
    // If payment info is present, record transaction with correct values
    if (updatedAppointment && updatedAppointment.paymentStatus === 'paid') {
      recordAppointmentTransaction(
        updatedAppointment,
        updatedAppointment.paymentMethod || PaymentMethod.CASH,
        updatedAppointment.discountPercentage || 0,
        updatedAppointment.discountAmount || 0
      );
    }
    handleAppointmentUpdated(updatedAppointment);
  }}
  existingAppointments={appointments}
/>
      )}
    </div>
  )
}


