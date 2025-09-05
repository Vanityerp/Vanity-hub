import { Order } from "../lib/order-types";

export const printOrderReceipt = (order: Order) => {
  const naEn = 'N/A';
  const naAr = 'غير متوفر';

  // Simple product name translation mapping
  const productNameTranslations: Record<string, string> = {
    'Cleansing Balm': 'بلسم التنظيف',
    'Acne Treatment Spot Gel': 'جل علاج حب الشباب',
    // Add more mappings as needed
  };

  // Helper to convert numbers to Arabic-Indic digits
  function toArabicNumber(num: string | number) {
    return String(num).replace(/[0-9]/g, d =>
      String.fromCharCode(d.charCodeAt(0) + 0x0660 - 0x0030)
    ).replace(/\./g, '٫');
  }

  // Helper to get Arabic product name
  function getArabicProductName(name: string) {
    return productNameTranslations[name] || name;
  }

  let receiptContent = `
    <html>
    <head>
      <title>Order Receipt / فاتورة الطلب</title>
      <style>
        body { font-family: sans-serif; background: #fff; }
        .container {
          max-width: 90mm;
          min-width: 0;
          margin: 0 auto;
          padding: 10mm 5mm;
          border: 1px solid #ccc;
          box-sizing: border-box;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        h1, h2 { text-align: center; margin-bottom: 10px; }
        .info-block {
          margin-bottom: 12px;
        }
        .label-en { font-weight: bold; font-size: 12px; }
        .value-en { font-size: 12px; margin-left: 6px; }
        .label-ar { font-weight: bold; font-size: 12px; direction: rtl; text-align: right; display: block; }
        .value-ar { font-size: 12px; direction: rtl; text-align: right; display: block; margin-bottom: 2px; }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          table-layout: fixed;
        }
        .items-table th, .items-table td {
          border: 1px solid #eee;
          padding: 4px 6px;
          font-size: 11px;
          word-break: break-word;
          overflow-wrap: break-word;
        }
        .items-table th {
          background-color: #f2f2f2;
          font-size: 12px;
        }
        .items-table td {
          background: #fff;
          text-align: center;
        }
        .product-cell {
          padding: 0;
        }
        .product-en { font-size: 11px; text-align: left; padding: 2px 6px 0 6px; }
        .product-ar { font-size: 11px; direction: rtl; text-align: right; padding: 0 6px 2px 6px; font-family: 'Arial', 'Tahoma', sans-serif; }
        .total-row { font-weight: bold; }
        @media print {
          body { background: #fff; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Order Receipt<br><span style="font-weight:normal">فاتورة الطلب</span></h1>
        <div class="info-block">
          <span class="label-en">Order ID:</span> <span class="value-en">${order.id}</span><br>
          <span class="label-ar">رقم الطلب:</span> <span class="value-ar">${toArabicNumber(order.id)}</span>
        </div>
        <div class="info-block">
          <span class="label-en">Customer Name:</span> <span class="value-en">${order.clientName || naEn}</span><br>
          <span class="label-ar">اسم العميل:</span> <span class="value-ar">${order.clientName || naAr}</span>
        </div>
        <h2>Order Items<br><span style="font-weight:normal">تفاصيل الطلب</span></h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>
                <div class="label-en">Product</div>
                <div class="label-ar">المنتج</div>
              </th>
              <th>
                <div class="label-en">Qty</div>
                <div class="label-ar">الكمية</div>
              </th>
              <th>
                <div class="label-en">Price</div>
                <div class="label-ar">السعر</div>
              </th>
              <th>
                <div class="label-en">Total</div>
                <div class="label-ar">الإجمالي</div>
              </th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => {
              const arabicName = getArabicProductName(item.name);
              return `
                <tr>
                  <td class="product-cell">
                    <div class="product-en">${item.name}</div>
                    <div class="product-ar">${arabicName}</div>
                  </td>
                  <td>
                    <div>${item.quantity}</div>
                    <div class="value-ar">${toArabicNumber(item.quantity)}</div>
                  </td>
                  <td>
                    <div>${item.unitPrice.toFixed(2)}</div>
                    <div class="value-ar">${toArabicNumber(item.unitPrice.toFixed(2))}</div>
                  </td>
                  <td>
                    <div>${item.totalPrice.toFixed(2)}</div>
                    <div class="value-ar">${toArabicNumber(item.totalPrice.toFixed(2))}</div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="info-block total-row" style="margin-top: 16px;">
          <span class="label-en">Total:</span> <span class="value-en">${order.total.toFixed(2)}</span><br>
          <span class="label-ar">الإجمالي:</span> <span class="value-ar">${toArabicNumber(order.total.toFixed(2))}</span>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          window.close();
        };
      </script>
    </body>
    </html>
  `;
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  } else {
    alert('Please allow pop-ups for printing.');
  }
};

export const exportOrderToPdf = (order: Order) => {
  // This is a placeholder for PDF export logic.
  // You would typically use a library like jsPDF or html2pdf.js here.
  // For simplicity, this example will just log to console.
  console.log(`Exporting order ${order.id} to PDF.`);
  alert(`Exporting order ${order.id} to PDF. (Functionality to be implemented with a PDF library)`);
};