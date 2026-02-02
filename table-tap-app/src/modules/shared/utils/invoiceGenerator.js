/**
 * Professional Invoice Generator for TableTap
 * Generates professional PDF invoices similar to Stripe/Cursor style
 */

// Company Details - Can be fetched from system_settings in production
const COMPANY_DETAILS = {
    name: 'TableTap Technologies Pvt. Ltd.',
    address: '123 Tech Park, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    country: 'India',
    phone: '+91 98765 43210',
    email: 'billing@tabletap.in',
    website: 'www.tabletap.in',
    gstin: '09AABCT1234F1ZG', // Example GSTIN
    pan: 'AABCT1234F',
    cin: 'U72200UP2024PTC123456'
};

/**
 * Generate a unique invoice number
 * Format: TT-YYYYMM-XXXXX (e.g., TT-202602-00042)
 */
export const generateInvoiceNumber = (sequenceNumber = 1) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = String(sequenceNumber).padStart(5, '0');
    return `TT-${year}${month}-${sequence}`;
};

/**
 * Format date for invoice display
 */
export const formatInvoiceDate = (date, format = 'long') => {
    const d = new Date(date);
    if (format === 'long') {
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Format currency for invoice
 */
export const formatInvoiceCurrency = (amount, showSymbol = true) => {
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Calculate GST breakdown
 * GST Rate: 18% (9% CGST + 9% SGST for intra-state, or 18% IGST for inter-state)
 */
export const calculateGST = (totalWithGst, gstRate = 18) => {
    const baseAmount = totalWithGst / (1 + gstRate / 100);
    const gstAmount = totalWithGst - baseAmount;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    
    return {
        baseAmount: Math.round(baseAmount * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(gstAmount * 100) / 100, // For inter-state
        gstRate
    };
};

/**
 * Generate the professional invoice HTML
 */
export const generateProfessionalInvoiceHTML = ({
    invoiceNumber,
    invoiceDate,
    dueDate,
    customer,
    items,
    payment,
    companyDetails = COMPANY_DETAILS,
    showPayButton = false,
    isPaid = true
}) => {
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.quantity * item.unitPrice;
    });
    
    const gstBreakdown = calculateGST(payment?.totalAmount || subtotal * 1.18);
    const totalAmount = payment?.totalAmount || subtotal + gstBreakdown.gstAmount;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #1a1a1a;
            line-height: 1.5;
            font-size: 14px;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
        }
        
        .invoice-header {
            padding: 40px 50px 30px;
            border-bottom: 1px solid #e5e5e5;
        }
        
        .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            letter-spacing: -0.5px;
        }
        
        .invoice-meta {
            text-align: right;
        }
        
        .invoice-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
        }
        
        .invoice-number span {
            font-weight: 600;
            color: #1a1a1a;
        }
        
        .company-details {
            display: flex;
            justify-content: space-between;
            gap: 40px;
        }
        
        .company-from, .company-to {
            flex: 1;
        }
        
        .section-label {
            font-size: 11px;
            font-weight: 600;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        
        .company-name {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 6px;
        }
        
        .company-address {
            color: #666;
            font-size: 13px;
            line-height: 1.6;
        }
        
        .company-contact {
            margin-top: 8px;
            font-size: 13px;
            color: #666;
        }
        
        .amount-due-box {
            background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
            color: white;
            padding: 24px 50px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .amount-due-label {
            font-size: 14px;
            font-weight: 500;
            opacity: 0.9;
        }
        
        .amount-due-value {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .amount-due-date {
            font-size: 13px;
            opacity: 0.8;
            margin-top: 4px;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .status-paid {
            background: rgba(255,255,255,0.2);
            color: white;
        }
        
        .status-pending {
            background: #FEF3C7;
            color: #92400E;
        }
        
        .pay-button {
            background: white;
            color: #7C3AED;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        
        .invoice-body {
            padding: 40px 50px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .items-table th {
            text-align: left;
            padding: 12px 0;
            font-size: 11px;
            font-weight: 600;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e5e5;
        }
        
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 16px 0;
            border-bottom: 1px solid #f0f0f0;
            vertical-align: top;
        }
        
        .item-name {
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
        }
        
        .item-description {
            font-size: 13px;
            color: #666;
        }
        
        .item-period {
            font-size: 12px;
            color: #888;
            margin-top: 2px;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        
        .totals-row.subtotal {
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 12px;
            margin-bottom: 12px;
        }
        
        .totals-row .label {
            color: #666;
        }
        
        .totals-row .value {
            font-weight: 500;
            color: #1a1a1a;
        }
        
        .totals-row.gst {
            font-size: 13px;
        }
        
        .totals-row.gst .label {
            padding-left: 12px;
        }
        
        .totals-row.total {
            border-top: 2px solid #1a1a1a;
            padding-top: 12px;
            margin-top: 12px;
            font-size: 16px;
            font-weight: 700;
        }
        
        .totals-row.total .label,
        .totals-row.total .value {
            color: #1a1a1a;
        }
        
        .invoice-footer {
            padding: 30px 50px;
            background: #fafafa;
            border-top: 1px solid #e5e5e5;
        }
        
        .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        
        .footer-section h4 {
            font-size: 11px;
            font-weight: 600;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        
        .footer-section p {
            font-size: 13px;
            color: #666;
            line-height: 1.6;
        }
        
        .legal-info {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            font-size: 12px;
            color: #888;
        }
        
        .legal-info p {
            margin-bottom: 4px;
        }
        
        .thank-you {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
        
        @media print {
            body {
                background: white;
            }
            .invoice-container {
                box-shadow: none;
            }
            .pay-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="header-top">
                <h1 class="invoice-title">Invoice</h1>
                <div class="invoice-meta">
                    <div class="invoice-number">Invoice number <span>${invoiceNumber}</span></div>
                    <div class="invoice-number">Date of issue <span>${formatInvoiceDate(invoiceDate)}</span></div>
                    <div class="invoice-number">Date due <span>${formatInvoiceDate(dueDate || invoiceDate)}</span></div>
                </div>
            </div>
            
            <div class="company-details">
                <div class="company-from">
                    <div class="section-label">From</div>
                    <div class="company-name">${companyDetails.name}</div>
                    <div class="company-address">
                        ${companyDetails.address}<br>
                        ${companyDetails.city}, ${companyDetails.state} ${companyDetails.pincode}<br>
                        ${companyDetails.country}
                    </div>
                    <div class="company-contact">
                        ${companyDetails.phone}<br>
                        ${companyDetails.email}
                    </div>
                </div>
                
                <div class="company-to">
                    <div class="section-label">Bill to</div>
                    <div class="company-name">${customer.name}</div>
                    <div class="company-address">
                        ${customer.address || ''}<br>
                        ${customer.city || ''}${customer.state ? `, ${customer.state}` : ''} ${customer.pincode || ''}<br>
                        ${customer.country || 'India'}
                    </div>
                    <div class="company-contact">
                        ${customer.email || ''}<br>
                        ${customer.phone || ''}
                    </div>
                    ${customer.gstin ? `<div class="company-contact" style="margin-top: 4px;">GSTIN: ${customer.gstin}</div>` : ''}
                </div>
            </div>
        </div>
        
        <!-- Amount Due Banner -->
        <div class="amount-due-box">
            <div>
                <div class="amount-due-label">${isPaid ? 'Amount Paid' : 'Amount Due'}</div>
                <div class="amount-due-value">${formatInvoiceCurrency(totalAmount)}</div>
                ${!isPaid ? `<div class="amount-due-date">due ${formatInvoiceDate(dueDate || invoiceDate)}</div>` : ''}
            </div>
            <div>
                ${isPaid 
                    ? `<span class="status-badge status-paid">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        PAID
                       </span>`
                    : showPayButton 
                        ? `<a href="#" class="pay-button">Pay online</a>`
                        : `<span class="status-badge status-pending">PENDING</span>`
                }
            </div>
        </div>
        
        <!-- Invoice Body -->
        <div class="invoice-body">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 50%">Description</th>
                        <th style="width: 10%">Qty</th>
                        <th style="width: 15%">Unit price</th>
                        <th style="width: 10%">Tax</th>
                        <th style="width: 15%">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>
                            <div class="item-name">${item.name}</div>
                            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                            ${item.period ? `<div class="item-period">${item.period}</div>` : ''}
                        </td>
                        <td>${item.quantity}</td>
                        <td>${formatInvoiceCurrency(item.unitPrice)}</td>
                        <td>${item.taxRate || 18}%</td>
                        <td>${formatInvoiceCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totals-section">
                <div class="totals-table">
                    <div class="totals-row subtotal">
                        <span class="label">Subtotal</span>
                        <span class="value">${formatInvoiceCurrency(gstBreakdown.baseAmount)}</span>
                    </div>
                    <div class="totals-row">
                        <span class="label">Total excluding tax</span>
                        <span class="value">${formatInvoiceCurrency(gstBreakdown.baseAmount)}</span>
                    </div>
                    <div class="totals-row gst">
                        <span class="label">CGST @ 9% on ${formatInvoiceCurrency(gstBreakdown.baseAmount)}</span>
                        <span class="value">${formatInvoiceCurrency(gstBreakdown.cgst)}</span>
                    </div>
                    <div class="totals-row gst">
                        <span class="label">SGST @ 9% on ${formatInvoiceCurrency(gstBreakdown.baseAmount)}</span>
                        <span class="value">${formatInvoiceCurrency(gstBreakdown.sgst)}</span>
                    </div>
                    <div class="totals-row total">
                        <span class="label">Total</span>
                        <span class="value">${formatInvoiceCurrency(totalAmount)}</span>
                    </div>
                    <div class="totals-row" style="font-weight: 600; color: #7C3AED;">
                        <span class="label">${isPaid ? 'Amount paid' : 'Amount due'}</span>
                        <span class="value">${formatInvoiceCurrency(totalAmount)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="invoice-footer">
            <div class="footer-grid">
                <div class="footer-section">
                    <h4>Payment Information</h4>
                    <p>
                        ${payment?.paymentId ? `Payment ID: ${payment.paymentId}<br>` : ''}
                        ${payment?.method ? `Payment Method: ${payment.method}<br>` : ''}
                        ${payment?.date ? `Payment Date: ${formatInvoiceDate(payment.date)}<br>` : ''}
                    </p>
                </div>
                <div class="footer-section">
                    <h4>Questions?</h4>
                    <p>
                        Contact us at ${companyDetails.email}<br>
                        or call ${companyDetails.phone}
                    </p>
                </div>
            </div>
            
            <div class="legal-info">
                <p><strong>${companyDetails.name}</strong></p>
                <p>GSTIN: ${companyDetails.gstin} | PAN: ${companyDetails.pan}</p>
                <p>CIN: ${companyDetails.cin}</p>
            </div>
        </div>
        
        <div class="thank-you">
            Thank you for your business!
        </div>
    </div>
</body>
</html>`;
};

/**
 * Generate invoice data object from subscription/payment
 */
export const createInvoiceData = ({
    transaction,
    restaurant,
    subscription,
    invoiceNumber,
    companyDetails = COMPANY_DETAILS
}) => {
    const invoiceDate = transaction?.created_at || new Date().toISOString();
    const amount = transaction?.amount_paid || subscription?.total_amount || 0;
    const gstAmount = transaction?.gst_amount || subscription?.gst_amount || (amount - amount / 1.18);
    const baseAmount = amount - gstAmount;
    
    // Determine billing period
    const startDate = subscription?.start_date || invoiceDate;
    const endDate = subscription?.end_date;
    const periodText = endDate 
        ? `${formatInvoiceDate(startDate, 'short')} – ${formatInvoiceDate(endDate, 'short')}`
        : `From ${formatInvoiceDate(startDate, 'short')}`;
    
    return {
        invoiceNumber: invoiceNumber || generateInvoiceNumber(),
        invoiceDate,
        dueDate: invoiceDate, // Same as invoice date for paid invoices
        customer: {
            name: restaurant?.name || 'Valued Customer',
            address: restaurant?.address || '',
            city: restaurant?.city || '',
            state: restaurant?.state || '',
            pincode: restaurant?.pincode || '',
            country: 'India',
            email: restaurant?.contact_email || '',
            phone: restaurant?.contact_phone || '',
            gstin: restaurant?.gst_number || null
        },
        items: [{
            name: `TableTap ${(transaction?.plan_name || subscription?.plan_name || 'Professional').charAt(0).toUpperCase() + (transaction?.plan_name || subscription?.plan_name || 'Professional').slice(1)}`,
            description: `${(transaction?.billing_cycle || subscription?.billing_cycle || 'Monthly').charAt(0).toUpperCase() + (transaction?.billing_cycle || subscription?.billing_cycle || 'Monthly').slice(1)} Subscription`,
            period: periodText,
            quantity: 1,
            unitPrice: Math.round(baseAmount * 100) / 100,
            taxRate: 18
        }],
        payment: {
            totalAmount: amount,
            paymentId: transaction?.payment_reference || null,
            method: transaction?.payment_method || subscription?.payment_method || 'Online',
            date: invoiceDate
        },
        companyDetails,
        isPaid: true
    };
};

/**
 * Download invoice as HTML file
 */
export const downloadInvoiceHTML = (invoiceData) => {
    const html = generateProfessionalInvoiceHTML(invoiceData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceData.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Print invoice
 */
export const printInvoice = (invoiceData) => {
    const html = generateProfessionalInvoiceHTML(invoiceData);
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };
};

/**
 * Generate PDF using html2pdf.js (requires the library to be loaded)
 * This function will dynamically load html2pdf.js if not already loaded
 */
export const generateInvoicePDF = async (invoiceData) => {
    // Dynamically load html2pdf.js if not available
    if (typeof window.html2pdf === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    const html = generateProfessionalInvoiceHTML(invoiceData);
    
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    const element = container.querySelector('.invoice-container');
    
    const opt = {
        margin: 0,
        filename: `Invoice-${invoiceData.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    try {
        await window.html2pdf().set(opt).from(element).save();
    } finally {
        document.body.removeChild(container);
    }
};

/**
 * Get PDF blob for email attachment
 */
export const getInvoicePDFBlob = async (invoiceData) => {
    // Dynamically load html2pdf.js if not available
    if (typeof window.html2pdf === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    const html = generateProfessionalInvoiceHTML(invoiceData);
    
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    const element = container.querySelector('.invoice-container');
    
    const opt = {
        margin: 0,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    try {
        const blob = await window.html2pdf().set(opt).from(element).outputPdf('blob');
        return blob;
    } finally {
        document.body.removeChild(container);
    }
};

export default {
    generateInvoiceNumber,
    formatInvoiceDate,
    formatInvoiceCurrency,
    calculateGST,
    generateProfessionalInvoiceHTML,
    createInvoiceData,
    downloadInvoiceHTML,
    printInvoice,
    generateInvoicePDF,
    getInvoicePDFBlob,
    COMPANY_DETAILS
};
