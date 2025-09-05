import { Transaction } from "@/lib/transaction-types"
import { format } from "date-fns"

// Enhanced export types
export interface ReportData {
  title: string
  dateRange?: { from: Date; to: Date }
  location?: string
  data: any[]
  summary?: Record<string, any>
  metadata?: Record<string, any>
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  includeCharts?: boolean
  includeSummary?: boolean
  customFileName?: string
  pageOrientation?: 'portrait' | 'landscape'
}

// PDF export utility using jsPDF (will be installed as dependency)
export async function exportTransactionToPDF(transaction: Transaction) {
  try {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import('jspdf')
    
    const doc = new jsPDF()
    
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

    // Set up the document
    let yPosition = 20
    const pageWidth = doc.internal.pageSize.width
    const margin = 20

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(location.name, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(location.address, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 6
    doc.text(`Tel: ${location.phone} | Email: ${location.email}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Transaction Receipt Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('TRANSACTION RECEIPT', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Transaction Details
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const leftCol = margin
    const rightCol = pageWidth - margin
    
    // Transaction ID
    doc.text('Transaction ID:', leftCol, yPosition)
    doc.text(transaction.id, rightCol, yPosition, { align: 'right' })
    yPosition += 6

    // Date
    doc.text('Date:', leftCol, yPosition)
    const dateStr = typeof transaction.date === 'string'
      ? transaction.date
      : format(transaction.date, 'dd-MM-yyyy HH:mm')
    doc.text(dateStr, rightCol, yPosition, { align: 'right' })
    yPosition += 6

    // Client
    if (transaction.clientName) {
      doc.text('Client:', leftCol, yPosition)
      doc.text(transaction.clientName, rightCol, yPosition, { align: 'right' })
      yPosition += 6
    }

    // Staff
    if (transaction.staffName) {
      doc.text('Staff:', leftCol, yPosition)
      doc.text(transaction.staffName, rightCol, yPosition, { align: 'right' })
      yPosition += 6
    }

    // Payment Method
    doc.text('Payment Method:', leftCol, yPosition)
    doc.text(formatPaymentMethod(transaction.paymentMethod), rightCol, yPosition, { align: 'right' })
    yPosition += 6

    // Status
    doc.text('Status:', leftCol, yPosition)
    doc.text(transaction.status.toUpperCase(), rightCol, yPosition, { align: 'right' })
    yPosition += 15

    // Items Section
    doc.setFont('helvetica', 'bold')
    doc.text('ITEMS:', leftCol, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    
    if (transaction.items && transaction.items.length > 0) {
      // Table headers
      doc.setFont('helvetica', 'bold')
      doc.text('Item', leftCol, yPosition)
      doc.text('Qty', leftCol + 80, yPosition)
      doc.text('Unit Price', leftCol + 110, yPosition)
      doc.text('Total', rightCol, yPosition, { align: 'right' })
      yPosition += 6

      // Draw line under headers
      doc.line(leftCol, yPosition, rightCol, yPosition)
      yPosition += 6

      doc.setFont('helvetica', 'normal')
      
      // Items
      transaction.items.forEach((item) => {
        doc.text(item.name, leftCol, yPosition)
        doc.text(item.quantity.toString(), leftCol + 80, yPosition)
        doc.text(`QAR ${item.unitPrice.toFixed(2)}`, leftCol + 110, yPosition)
        doc.text(`QAR ${item.totalPrice.toFixed(2)}`, rightCol, yPosition, { align: 'right' })
        yPosition += 6
      })
    } else {
      doc.text(transaction.description, leftCol, yPosition)
      yPosition += 6
    }

    yPosition += 10

    // Totals
    doc.line(leftCol, yPosition, rightCol, yPosition)
    yPosition += 8

    doc.text('Subtotal:', leftCol + 100, yPosition)
    doc.text(`QAR ${transaction.amount.toFixed(2)}`, rightCol, yPosition, { align: 'right' })
    yPosition += 6

    doc.text('Tax:', leftCol + 100, yPosition)
    doc.text('QAR 0.00', rightCol, yPosition, { align: 'right' })
    yPosition += 6

    // Total line
    doc.line(leftCol + 100, yPosition, rightCol, yPosition)
    yPosition += 6

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTAL:', leftCol + 100, yPosition)
    doc.text(`QAR ${transaction.amount.toFixed(2)}`, rightCol, yPosition, { align: 'right' })
    yPosition += 15

    // Additional Information
    if (transaction.metadata) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('ADDITIONAL INFORMATION:', leftCol, yPosition)
      yPosition += 8

      doc.setFont('helvetica', 'normal')
      
      if (transaction.metadata.appointmentId) {
        doc.text('Appointment ID:', leftCol, yPosition)
        doc.text(transaction.metadata.appointmentId, rightCol, yPosition, { align: 'right' })
        yPosition += 6
      }

      if (transaction.metadata.bookingReference) {
        doc.text('Booking Reference:', leftCol, yPosition)
        doc.text(transaction.metadata.bookingReference, rightCol, yPosition, { align: 'right' })
        yPosition += 6
      }

      if (transaction.metadata.completedAt) {
        doc.text('Completed At:', leftCol, yPosition)
        doc.text(format(new Date(transaction.metadata.completedAt), 'dd/MM/yyyy HH:mm'), rightCol, yPosition, { align: 'right' })
        yPosition += 6
      }
    }

    // Footer
    yPosition = doc.internal.pageSize.height - 40
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Thank you for choosing Vanity Hair & Beauty!', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 4
    doc.text('Follow us @VanityQatar | www.vanitysalon.qa', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 8
    doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, yPosition, { align: 'center' })

    // Save the PDF
    const fileName = `transaction-${transaction.id}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}

// Alternative HTML-to-PDF export using browser's print functionality
export function exportTransactionToHTMLPDF(transaction: Transaction) {
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

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to export PDF')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transaction ${transaction.id}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          font-size: 12px;
          line-height: 1.4;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .company-info { font-size: 10px; color: #666; }
        .title { font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .section { margin: 20px 0; }
        .section-title { font-weight: bold; margin-bottom: 10px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .items-table th, .items-table td { 
          padding: 8px; 
          text-align: left; 
          border-bottom: 1px solid #ddd; 
        }
        .items-table th { font-weight: bold; background-color: #f5f5f5; }
        .total-section { margin-top: 20px; }
        .total-line { border-top: 2px solid #000; padding-top: 5px; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #666; }
        @media print {
          body { margin: 0; padding: 15px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${location.name}</div>
        <div class="company-info">${location.address}</div>
        <div class="company-info">Tel: ${location.phone} | Email: ${location.email}</div>
      </div>

      <div class="title">TRANSACTION RECEIPT</div>

      <div class="section">
        <div class="info-row">
          <span>Transaction ID:</span>
          <span>${transaction.id}</span>
        </div>
        <div class="info-row">
          <span>Date:</span>
          <span>${typeof transaction.date === 'string' ? transaction.date : format(transaction.date, 'dd/MM/yyyy HH:mm')}</span>
        </div>
        ${transaction.clientName ? `
        <div class="info-row">
          <span>Client:</span>
          <span>${transaction.clientName}</span>
        </div>` : ''}
        ${transaction.staffName ? `
        <div class="info-row">
          <span>Staff:</span>
          <span>${transaction.staffName}</span>
        </div>` : ''}
        <div class="info-row">
          <span>Payment Method:</span>
          <span>${formatPaymentMethod(transaction.paymentMethod)}</span>
        </div>
        <div class="info-row">
          <span>Status:</span>
          <span>${transaction.status.toUpperCase()}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">ITEMS</div>
        ${transaction.items && transaction.items.length > 0 ? `
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${transaction.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>QAR ${item.unitPrice.toFixed(2)}</td>
              <td>QAR ${item.totalPrice.toFixed(2)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : `
        <div>${transaction.description}</div>
        `}
      </div>

      <div class="total-section">
        <div class="info-row">
          <span>Subtotal:</span>
          <span>QAR ${transaction.amount.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span>Tax:</span>
          <span>QAR 0.00</span>
        </div>
        <div class="info-row total-line">
          <span>TOTAL:</span>
          <span>QAR ${transaction.amount.toFixed(2)}</span>
        </div>
      </div>

      ${transaction.metadata ? `
      <div class="section">
        <div class="section-title">ADDITIONAL INFORMATION</div>
        ${transaction.metadata.appointmentId ? `
        <div class="info-row">
          <span>Appointment ID:</span>
          <span>${transaction.metadata.appointmentId}</span>
        </div>` : ''}
        ${transaction.metadata.bookingReference ? `
        <div class="info-row">
          <span>Booking Reference:</span>
          <span>${transaction.metadata.bookingReference}</span>
        </div>` : ''}
        ${transaction.metadata.completedAt ? `
        <div class="info-row">
          <span>Completed At:</span>
          <span>${format(new Date(transaction.metadata.completedAt), 'dd/MM/yyyy HH:mm')}</span>
        </div>` : ''}
      </div>` : ''}

      <div class="footer">
        <div>Thank you for choosing Vanity Hair & Beauty!</div>
        <div>Follow us @VanityQatar | www.vanitysalon.qa</div>
        <div style="margin-top: 10px;">Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

// Enhanced report export functions
export async function exportReportToPDF(reportData: ReportData, options: ExportOptions = { format: 'pdf' }) {
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({
      orientation: options.pageOrientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(reportData.title, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Date range and location
    if (reportData.dateRange) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const dateStr = `${format(reportData.dateRange.from, 'dd/MM/yyyy')} - ${format(reportData.dateRange.to, 'dd/MM/yyyy')}`
      doc.text(`Date Range: ${dateStr}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 8
    }

    if (reportData.location) {
      doc.text(`Location: ${reportData.location}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15
    }

    // Summary section
    if (options.includeSummary && reportData.summary) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      Object.entries(reportData.summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, margin, yPosition)
        yPosition += 6
      })
      yPosition += 10
    }

    // Data table
    if (reportData.data && reportData.data.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Data', margin, yPosition)
      yPosition += 10

      // Table headers
      const headers = Object.keys(reportData.data[0])
      const colWidth = (pageWidth - 2 * margin) / headers.length

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      headers.forEach((header, index) => {
        doc.text(header, margin + index * colWidth, yPosition)
      })
      yPosition += 8

      // Table data
      doc.setFont('helvetica', 'normal')
      reportData.data.forEach((row) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }

        headers.forEach((header, index) => {
          const value = row[header]?.toString() || ''
          doc.text(value.substring(0, 20), margin + index * colWidth, yPosition)
        })
        yPosition += 6
      })
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
    }

    // Save the PDF
    const fileName = options.customFileName || `${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`
    doc.save(fileName)

    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}

export function exportReportToCSV(reportData: ReportData, options: ExportOptions = { format: 'csv' }) {
  try {
    if (!reportData.data || reportData.data.length === 0) {
      throw new Error('No data to export')
    }

    const headers = Object.keys(reportData.data[0])
    const csvContent = [
      // Add metadata as comments
      `# ${reportData.title}`,
      reportData.dateRange ? `# Date Range: ${format(reportData.dateRange.from, 'dd/MM/yyyy')} - ${format(reportData.dateRange.to, 'dd/MM/yyyy')}` : '',
      reportData.location ? `# Location: ${reportData.location}` : '',
      `# Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      '',
      // Headers
      headers.join(','),
      // Data rows
      ...reportData.data.map(row =>
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value?.toString() || ''
        }).join(',')
      )
    ].filter(line => line !== '').join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = options.customFileName || `${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('Error generating CSV:', error)
    throw new Error('Failed to generate CSV')
  }
}

export async function exportReportToExcel(reportData: ReportData, options: ExportOptions = { format: 'excel' }) {
  try {
    // Dynamic import to avoid SSR issues
    const XLSX = await import('xlsx')

    if (!reportData.data || reportData.data.length === 0) {
      throw new Error('No data to export')
    }

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create main data worksheet
    const worksheet = XLSX.utils.json_to_sheet(reportData.data)

    // Add metadata at the top
    const metadataRows = [
      [reportData.title],
      reportData.dateRange ? [`Date Range: ${format(reportData.dateRange.from, 'dd/MM/yyyy')} - ${format(reportData.dateRange.to, 'dd/MM/yyyy')}`] : [],
      reportData.location ? [`Location: ${reportData.location}`] : [],
      [`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`],
      [] // Empty row
    ].filter(row => row.length > 0)

    // Insert metadata at the beginning
    XLSX.utils.sheet_add_aoa(worksheet, metadataRows, { origin: 'A1' })

    // Adjust data range to account for metadata
    const dataStartRow = metadataRows.length + 1
    const dataSheet = XLSX.utils.json_to_sheet(reportData.data)
    const dataRange = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1')

    // Copy data with offset
    Object.keys(dataSheet).forEach(cell => {
      if (cell !== '!ref' && cell !== '!margins') {
        const cellRef = XLSX.utils.decode_cell(cell)
        const newCellRef = XLSX.utils.encode_cell({
          r: cellRef.r + dataStartRow,
          c: cellRef.c
        })
        worksheet[newCellRef] = dataSheet[cell]
      }
    })

    // Update worksheet range
    const newRange = {
      s: { r: 0, c: 0 },
      e: { r: dataRange.e.r + dataStartRow, c: dataRange.e.c }
    }
    worksheet['!ref'] = XLSX.utils.encode_range(newRange)

    // Add summary sheet if requested
    if (options.includeSummary && reportData.summary) {
      const summaryData = Object.entries(reportData.summary).map(([key, value]) => ({
        Metric: key,
        Value: value
      }))
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }

    // Add main data sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

    // Generate and download file
    const fileName = options.customFileName || `${reportData.title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd-HHmm')}.xlsx`
    XLSX.writeFile(workbook, fileName)

    return true
  } catch (error) {
    console.error('Error generating Excel:', error)
    throw new Error('Failed to generate Excel file')
  }
}

// Utility function to prepare chart data for export
export function prepareChartDataForExport(chartData: any[], chartTitle: string): ReportData {
  return {
    title: chartTitle,
    data: chartData,
    metadata: {
      chartType: 'chart',
      exportedAt: new Date().toISOString()
    }
  }
}

// Utility function to prepare table data for export
export function prepareTableDataForExport(tableData: any[], tableTitle: string, summary?: Record<string, any>): ReportData {
  return {
    title: tableTitle,
    data: tableData,
    summary,
    metadata: {
      dataType: 'table',
      exportedAt: new Date().toISOString()
    }
  }
}
