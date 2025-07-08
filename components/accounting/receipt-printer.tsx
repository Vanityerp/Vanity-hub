"use client"

import { Transaction } from "@/lib/transaction-types"
import { format } from "date-fns"
import { CurrencyDisplay } from "@/components/ui/currency-display"

interface ReceiptPrinterProps {
  transaction: Transaction
}

export function ReceiptPrinter({ transaction }: ReceiptPrinterProps) {
  // Helper function to get location details
  const getLocationDetails = (locationId: string) => {
    switch (locationId) {
      case "loc1":
        return {
          name: "Vanity Hair & Beauty - D-Ring Road",
          address: "D-Ring Road, Doha, Qatar",
          phone: "+974 4444 5555",
          email: "dring@vanitysalon.qa"
        }
      case "loc2":
        return {
          name: "Vanity Hair & Beauty - Muaither",
          address: "Muaither, Doha, Qatar", 
          phone: "+974 4444 6666",
          email: "muaither@vanitysalon.qa"
        }
      case "loc3":
        return {
          name: "Vanity Hair & Beauty - Medinat Khalifa",
          address: "Medinat Khalifa, Doha, Qatar",
          phone: "+974 4444 7777", 
          email: "medinat@vanitysalon.qa"
        }
      default:
        return {
          name: "Vanity Hair & Beauty",
          address: "Doha, Qatar",
          phone: "+974 4444 5555",
          email: "info@vanitysalon.qa"
        }
    }
  }

  const location = getLocationDetails(transaction.location)

  // Helper function to format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Credit Card"
      case "mobile_payment":
        return "Mobile Payment"
      case "bank_transfer":
        return "Bank Transfer"
      case "cash":
        return "Cash"
      default:
        return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  return (
    <div className="receipt-container" style={{ 
      fontFamily: 'monospace', 
      fontSize: '12px', 
      lineHeight: '1.4',
      maxWidth: '300px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: 'white',
      color: 'black'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          {location.name}
        </div>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>
          {location.address}
        </div>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>
          Tel: {location.phone}
        </div>
        <div style={{ fontSize: '10px', marginBottom: '10px' }}>
          Email: {location.email}
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
      </div>

      {/* Transaction Info */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Receipt #:</span>
          <span>{transaction.id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Date:</span>
          <span>
            {typeof transaction.date === 'string' 
              ? transaction.date 
              : format(transaction.date, 'dd/MM/yyyy HH:mm')}
          </span>
        </div>
        {transaction.clientName && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Client:</span>
            <span>{transaction.clientName}</span>
          </div>
        )}
        {transaction.staffName && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Staff:</span>
            <span>{transaction.staffName}</span>
          </div>
        )}
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>ITEMS:</div>
        {transaction.items && transaction.items.length > 0 ? (
          transaction.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>{item.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span>{item.quantity} x QAR {item.unitPrice.toFixed(2)}</span>
                <span>QAR {item.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: '10px', fontStyle: 'italic' }}>
            {transaction.description}
          </div>
        )}
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
      </div>

      {/* Totals */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Subtotal:</span>
          <span>QAR {transaction.amount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Tax:</span>
          <span>QAR 0.00</span>
        </div>
        <div style={{ borderTop: '1px solid #000', margin: '5px 0' }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
          <span>TOTAL:</span>
          <span>QAR {transaction.amount.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
      </div>

      {/* Payment Info */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Payment Method:</span>
          <span>{formatPaymentMethod(transaction.paymentMethod)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Status:</span>
          <span>{transaction.status.toUpperCase()}</span>
        </div>
        {transaction.metadata?.bookingReference && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Booking Ref:</span>
            <span>{transaction.metadata.bookingReference}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '20px' }}>
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
        <div style={{ marginBottom: '5px' }}>Thank you for choosing Vanity!</div>
        <div style={{ marginBottom: '5px' }}>Follow us @VanityQatar</div>
        <div style={{ marginBottom: '5px' }}>www.vanitysalon.qa</div>
        <div style={{ fontSize: '8px', marginTop: '10px' }}>
          This receipt was generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    </div>
  )
}

// Function to print the receipt
export function printReceipt(transaction: Transaction) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print receipts')
    return
  }

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${transaction.id}</title>
      <style>
        body { 
          margin: 0; 
          padding: 20px; 
          font-family: 'Courier New', monospace; 
          font-size: 12px;
          line-height: 1.4;
        }
        .receipt-container {
          max-width: 300px;
          margin: 0 auto;
          background: white;
          color: black;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .small { font-size: 10px; }
        .large { font-size: 14px; }
        .dashed-line { border-top: 1px dashed #000; margin: 10px 0; }
        .solid-line { border-top: 1px solid #000; margin: 5px 0; }
        .flex { display: flex; justify-content: space-between; margin-bottom: 3px; }
        @media print {
          body { margin: 0; padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        ${generateReceiptHTML(transaction)}
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          }
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(receiptHTML)
  printWindow.document.close()
}

function generateReceiptHTML(transaction: Transaction): string {
  const getLocationDetails = (locationId: string) => {
    switch (locationId) {
      case "loc1":
        return {
          name: "Vanity Hair & Beauty - D-Ring Road",
          address: "D-Ring Road, Doha, Qatar",
          phone: "+974 4444 5555",
          email: "dring@vanitysalon.qa"
        }
      case "loc2":
        return {
          name: "Vanity Hair & Beauty - Muaither",
          address: "Muaither, Doha, Qatar", 
          phone: "+974 4444 6666",
          email: "muaither@vanitysalon.qa"
        }
      case "loc3":
        return {
          name: "Vanity Hair & Beauty - Medinat Khalifa",
          address: "Medinat Khalifa, Doha, Qatar",
          phone: "+974 4444 7777", 
          email: "medinat@vanitysalon.qa"
        }
      default:
        return {
          name: "Vanity Hair & Beauty",
          address: "Doha, Qatar",
          phone: "+974 4444 5555",
          email: "info@vanitysalon.qa"
        }
    }
  }

  const location = getLocationDetails(transaction.location)
  
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Credit Card"
      case "mobile_payment":
        return "Mobile Payment"
      case "bank_transfer":
        return "Bank Transfer"
      case "cash":
        return "Cash"
      default:
        return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  return `
    <div class="center">
      <div class="bold large">${location.name}</div>
      <div class="small">${location.address}</div>
      <div class="small">Tel: ${location.phone}</div>
      <div class="small">Email: ${location.email}</div>
      <div class="dashed-line"></div>
    </div>

    <div class="flex"><span>Receipt #:</span><span>${transaction.id}</span></div>
    <div class="flex"><span>Date:</span><span>${typeof transaction.date === 'string' ? transaction.date : format(transaction.date, 'dd/MM/yyyy HH:mm')}</span></div>
    ${transaction.clientName ? `<div class="flex"><span>Client:</span><span>${transaction.clientName}</span></div>` : ''}
    ${transaction.staffName ? `<div class="flex"><span>Staff:</span><span>${transaction.staffName}</span></div>` : ''}
    <div class="dashed-line"></div>

    <div class="bold">ITEMS:</div>
    ${transaction.items && transaction.items.length > 0 
      ? transaction.items.map(item => `
          <div style="margin-bottom: 8px;">
            <div class="bold">${item.name}</div>
            <div class="flex small">
              <span>${item.quantity} x QAR ${item.unitPrice.toFixed(2)}</span>
              <span>QAR ${item.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        `).join('')
      : `<div class="small" style="font-style: italic;">${transaction.description}</div>`
    }
    <div class="dashed-line"></div>

    <div class="flex"><span>Subtotal:</span><span>QAR ${transaction.amount.toFixed(2)}</span></div>
    <div class="flex"><span>Tax:</span><span>QAR 0.00</span></div>
    <div class="solid-line"></div>
    <div class="flex bold large"><span>TOTAL:</span><span>QAR ${transaction.amount.toFixed(2)}</span></div>
    <div class="dashed-line"></div>

    <div class="flex"><span>Payment Method:</span><span>${formatPaymentMethod(transaction.paymentMethod)}</span></div>
    <div class="flex"><span>Status:</span><span>${transaction.status.toUpperCase()}</span></div>
    ${transaction.metadata?.bookingReference ? `<div class="flex"><span>Booking Ref:</span><span>${transaction.metadata.bookingReference}</span></div>` : ''}

    <div class="center small" style="margin-top: 20px;">
      <div class="dashed-line"></div>
      <div>Thank you for choosing Vanity!</div>
      <div>Follow us @VanityQatar</div>
      <div>www.vanitysalon.qa</div>
      <div style="font-size: 8px; margin-top: 10px;">
        This receipt was generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}
      </div>
    </div>
  `
}
