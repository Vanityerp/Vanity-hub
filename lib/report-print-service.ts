import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

export interface PrintOptions {
  title: string
  dateRange?: DateRange
  location?: string
  includeCharts?: boolean
  includeSummary?: boolean
  orientation?: 'portrait' | 'landscape'
  sections: PrintSection[]
}

export interface PrintSection {
  id: string
  title: string
  content: string | HTMLElement
  type: 'table' | 'chart' | 'summary' | 'text'
  pageBreakBefore?: boolean
}

export class ReportPrintService {
  private static instance: ReportPrintService
  private printWindow: Window | null = null

  static getInstance(): ReportPrintService {
    if (!ReportPrintService.instance) {
      ReportPrintService.instance = new ReportPrintService()
    }
    return ReportPrintService.instance
  }

  async printReport(options: PrintOptions): Promise<void> {
    try {
      const htmlContent = this.generatePrintHTML(options)
      
      this.printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!this.printWindow) {
        throw new Error('Please allow popups to print reports')
      }

      this.printWindow.document.write(htmlContent)
      this.printWindow.document.close()

      // Wait for content to load before printing
      this.printWindow.onload = () => {
        setTimeout(() => {
          if (this.printWindow) {
            this.printWindow.print()
            this.printWindow.onafterprint = () => {
              if (this.printWindow) {
                this.printWindow.close()
              }
            }
          }
        }, 500)
      }
    } catch (error) {
      console.error('Error printing report:', error)
      throw error
    }
  }

  private generatePrintHTML(options: PrintOptions): string {
    const { title, dateRange, location, orientation = 'portrait', sections } = options

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          ${this.getPrintStyles(orientation)}
        </style>
      </head>
      <body>
        <div class="print-container">
          ${this.generateHeader(title, dateRange, location)}
          ${sections.map(section => this.generateSection(section)).join('')}
          ${this.generateFooter()}
        </div>
      </body>
      </html>
    `
  }

  private getPrintStyles(orientation: 'portrait' | 'landscape'): string {
    return `
      @page {
        size: A4 ${orientation};
        margin: 2cm 1.5cm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #333;
        margin: 0;
        padding: 0;
        background: white;
      }

      .print-container {
        max-width: 100%;
        margin: 0 auto;
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e5e5e5;
      }

      .header h1 {
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 10px 0;
        color: #1a1a1a;
      }

      .header .subtitle {
        font-size: 14px;
        color: #666;
        margin: 5px 0;
      }

      .section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }

      .section.page-break {
        page-break-before: always;
      }

      .section-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #1a1a1a;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }

      .table-container {
        overflow: visible;
        margin-bottom: 20px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 11px;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
        vertical-align: top;
      }

      th {
        background-color: #f8f9fa;
        font-weight: bold;
        color: #333;
      }

      tr:nth-child(even) {
        background-color: #f9f9f9;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .summary-item {
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f8f9fa;
      }

      .summary-item .label {
        font-size: 11px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }

      .summary-item .value {
        font-size: 18px;
        font-weight: bold;
        color: #1a1a1a;
      }

      .chart-placeholder {
        width: 100%;
        height: 200px;
        border: 2px dashed #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-style: italic;
        margin-bottom: 20px;
      }

      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e5e5;
        text-align: center;
        font-size: 10px;
        color: #666;
      }

      .footer .company-info {
        margin-bottom: 10px;
      }

      .footer .generation-info {
        font-style: italic;
      }

      .text-content {
        line-height: 1.6;
        margin-bottom: 15px;
      }

      .text-content p {
        margin-bottom: 10px;
      }

      .text-content ul, .text-content ol {
        margin-left: 20px;
        margin-bottom: 10px;
      }

      .text-content li {
        margin-bottom: 5px;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .no-print {
          display: none !important;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .avoid-break {
          page-break-inside: avoid;
        }
      }
    `
  }

  private generateHeader(title: string, dateRange?: DateRange, location?: string): string {
    return `
      <div class="header">
        <h1>${title}</h1>
        ${dateRange ? `
          <div class="subtitle">
            ${format(dateRange.from!, 'dd/MM/yyyy')} - ${format(dateRange.to!, 'dd/MM/yyyy')}
          </div>
        ` : ''}
        ${location && location !== 'all' ? `
          <div class="subtitle">
            Location: ${this.getLocationName(location)}
          </div>
        ` : ''}
        <div class="subtitle">
          Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    `
  }

  private generateSection(section: PrintSection): string {
    const pageBreakClass = section.pageBreakBefore ? 'page-break' : ''
    
    return `
      <div class="section ${pageBreakClass}">
        <h2 class="section-title">${section.title}</h2>
        ${this.generateSectionContent(section)}
      </div>
    `
  }

  private generateSectionContent(section: PrintSection): string {
    switch (section.type) {
      case 'table':
        return `<div class="table-container">${section.content}</div>`
      case 'chart':
        return `<div class="chart-placeholder">Chart: ${section.title}</div>`
      case 'summary':
        return this.generateSummaryContent(section.content as string)
      case 'text':
        return `<div class="text-content">${section.content}</div>`
      default:
        return `<div>${section.content}</div>`
    }
  }

  private generateSummaryContent(content: string): string {
    try {
      const summaryData = JSON.parse(content)
      const items = Object.entries(summaryData).map(([key, value]) => `
        <div class="summary-item">
          <div class="label">${key}</div>
          <div class="value">${value}</div>
        </div>
      `).join('')
      
      return `<div class="summary-grid">${items}</div>`
    } catch {
      return `<div class="text-content">${content}</div>`
    }
  }

  private generateFooter(): string {
    return `
      <div class="footer">
        <div class="company-info">
          Vanity Hair & Beauty | Doha, Qatar
        </div>
        <div class="company-info">
          Follow us @VanityQatar | www.vanitysalon.qa
        </div>
        <div class="generation-info">
          This report was generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    `
  }

  private getLocationName(locationId: string): string {
    switch (locationId) {
      case 'loc1':
        return 'Downtown'
      case 'loc2':
        return 'Westside'
      case 'loc3':
        return 'Northside'
      default:
        return locationId
    }
  }

  // Utility method to convert HTML table to print-friendly format
  static convertTableForPrint(tableElement: HTMLTableElement): string {
    const rows = Array.from(tableElement.rows)
    return rows.map(row => {
      const cells = Array.from(row.cells)
      const cellsHTML = cells.map(cell => {
        const tagName = cell.tagName.toLowerCase()
        return `<${tagName}>${cell.textContent?.trim() || ''}</${tagName}>`
      }).join('')
      return `<tr>${cellsHTML}</tr>`
    }).join('')
  }

  // Utility method to prepare chart data for print
  static prepareChartForPrint(chartTitle: string, chartData: any[]): PrintSection {
    return {
      id: `chart-${Date.now()}`,
      title: chartTitle,
      content: `Chart data with ${chartData.length} data points`,
      type: 'chart'
    }
  }
}
