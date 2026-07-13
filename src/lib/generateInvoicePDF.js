import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import roadozLogo from "../assets/images/RO-2.png";

const drawInvoice = (doc, order) => {
    const PAGE_W = 210; // A4 Width
    const HALF_H = 148.5; // Half of A4 Height
    const LEFT = 10;
    const RIGHT = 200;
    const WIDTH = RIGHT - LEFT;
    let currY = 10;

    // Helper to draw the grid lines
    const drawGrid = (x, y, w, h) => doc.rect(x, y, w, h);

    // ---------------------------------------------------------
    // 1. HEADER (Black & White)
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 22);
    
    // Logo Text (Black)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.addImage(roadozLogo, "PNG", LEFT + 4, currY + 3, 40, 16);
   doc.addImage(
  roadozLogo, // Image
  "PNG",      // Image type
  LEFT + 4,   // X
  currY + 3,  // Y
  40,         // Width
  16          // Height
);

    // Company Info (Center-Right)
    doc.setFontSize(14);
    doc.text("ROADOZ PVT. LTD.", LEFT + 60, currY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Courier And Cargo", LEFT + 60, currY + 11);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Room No: 122, DD Vyapar Bhavan, Kadavanthra, Kochi-682020", LEFT + 60, currY + 14);
    doc.text("Phone: +91 9496630687 | Email: info@roadoz.com | Web: www.roadoz.com", LEFT + 60, currY + 17);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: 32AAPCR1988L1ZP | PAN: AAICR1988L`, LEFT + 60, currY + 20);

    currY += 22;

    // ---------------------------------------------------------
    // 2. META BAR (Date, Payment, Pieces, Barcode)
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 18);
    doc.line(LEFT + 55, currY, LEFT + 55, currY + 18); // Line 1
    doc.line(LEFT + 85, currY, LEFT + 85, currY + 18); // Line 2
    doc.line(LEFT + 110, currY, LEFT + 110, currY + 18); // Line 3

    // Date
    doc.setFontSize(8);
    doc.text("DATE & TIME", LEFT + 2, currY + 5);
    doc.setFontSize(9);
    doc.text(order.created || "03-02-2026 14:19", LEFT + 2, currY + 11);

    // Payment Type
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text((order.payment?.method || "TO PAY").toUpperCase(), LEFT + 70, currY + 10, { align: "center" });

    // Pieces
    doc.setFontSize(7);
    doc.text("TOTAL PIECES", LEFT + 87, currY + 5);
    doc.setFontSize(14);
    doc.text(String(order.packages?.length || "1"), LEFT + 97, currY + 13, { align: "center" });

    // Barcode Generation
    const barcodeId = order.id || "ORD-00205";
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeId, { format: "CODE128", displayValue: true, fontSize: 18, height: 40 });
    const barcodeImg = canvas.toDataURL("image/png");
    doc.addImage(barcodeImg, 'PNG', LEFT + 120, currY + 2, 60, 14);

    currY += 18;

    // ---------------------------------------------------------
    // 3. ROUTE BAR (FROM / DESTINATION)
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 7);
    doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + 7);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`FROM : ${order.pickup?.city || "CALICUT"}`, LEFT + 2, currY + 5);
    doc.text(`Destination : ${order.customer?.city || "BANGALORE"}`, LEFT + (WIDTH / 2) + 2, currY + 5);

    currY += 7;

    // ---------------------------------------------------------
    // 4. ADDRESS GRID
    // ---------------------------------------------------------
    const gridH = 32;
    drawGrid(LEFT, currY, WIDTH, gridH);
    doc.line(LEFT + 45, currY, LEFT + 45, currY + gridH); // Splitter 1
    doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + gridH); // Center Split
    doc.line(LEFT + 140, currY, LEFT + 140, currY + gridH); // Splitter 3

    const rowH = 6.4;
    for (let i = 1; i < 5; i++) {
        doc.line(LEFT, currY + (i * rowH), LEFT + (WIDTH / 2), currY + (i * rowH));
        doc.line(LEFT + (WIDTH / 2), currY + (i * rowH), RIGHT, currY + (i * rowH));
    }

    // Left Side (Consignor)
    doc.setFontSize(7);
    doc.text("CONSIGNOR", LEFT + 2, currY + 4.5);
    doc.text(order.pickup?.name || "N/A", LEFT + 47, currY + 4.5);
    
    doc.text("CONTACT NO", LEFT + 2, currY + 11);
    doc.text(order.pickup?.phone || "0000000000", LEFT + 47, currY + 11);
    
    doc.text("REFERENCE NO", LEFT + 2, currY + 17.5);
    doc.text("DLY Type: Door Delivery", LEFT + 47, currY + 17.5);

    doc.setFont("helvetica", "bold");
    doc.text(`Invoice No: ${order.invoiceNo || "1404"}`, LEFT + 2, currY + 24);
    doc.text(`Charge Weight: ${order.weight || "0"} kg`, LEFT + 47, currY + 24);
    doc.setFont("helvetica", "normal");

    // Right Side (Consignee)
    doc.text("CONSIGNEE", LEFT + 102, currY + 4.5);
    doc.text(order.customer?.name || "N/A", LEFT + 142, currY + 4.5);
    
    doc.text("CONTACT NO", LEFT + 102, currY + 11);
    doc.text(order.customer?.phone || "N/A", LEFT + 142, currY + 11);
    
    doc.text("DISTRICT", LEFT + 102, currY + 17.5);
    doc.text(order.customer?.city || "N/A", LEFT + 142, currY + 17.5);
    
    doc.text("STATE", LEFT + 102, currY + 24);
    doc.text(order.customer?.state || "KERALA", LEFT + 142, currY + 24);

    doc.text("DELIVERY BY", LEFT + 102, currY + 30.5);
    doc.text("ROADOZ ERNAKULAM", LEFT + 142, currY + 30.5);

    currY += gridH;

    // ---------------------------------------------------------
    // 5. DESCRIPTION & CHARGES
    // ---------------------------------------------------------
    const descH = 30;
    drawGrid(LEFT, currY, WIDTH, descH);
    doc.line(LEFT + 150, currY, LEFT + 150, currY + descH); // Vertical for charges label
    doc.line(LEFT + 170, currY, LEFT + 170, currY + descH); // Vertical for amount divider
    doc.line(LEFT, currY + 6, RIGHT, currY + 6); // Heading line

    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTIONS / ITEM NAME", LEFT + 2, currY + 4);
    doc.text("Charges", LEFT + 152, currY + 4);
    doc.text("Amount", RIGHT - 2, currY + 4, { align: "right" });

    doc.setFont("helvetica", "normal");
    const itemName = order.items?.[0]?.product_name || "General Goods";
    doc.text(`Item: ${itemName} (Qty: ${order.packages?.length || 1})`, LEFT + 2, currY + 12);
    
    // Bank Details (Integrated inside the description box)
    doc.setFont("helvetica", "bold");
    doc.text("BANK DETAILS:", LEFT + 2, currY + 20);
    doc.setFont("helvetica", "normal");
    doc.text("HDFC BANK | A/C: 50200116941777 | IFSC: HDFC0002321", LEFT + 2, currY + 24);

    // Charges Rows
    const chargeList = [
        ["Freight", order.charges?.freight || "0.00"],
        ["LR Charge", "20.00"],
        ["GST/Tax", order.charges?.freight_gst || "0.00"],
        ["Other", "0.00"]
    ];

    chargeList.forEach((c, i) => {
        const rowY = currY + 11 + (i * 4.5);
        doc.text(c[0], LEFT + 152, rowY);
        doc.text(parseFloat(c[1]).toFixed(2), RIGHT - 2, rowY, { align: "right" });
        doc.line(LEFT + 150, rowY + 1, RIGHT, rowY + 1);
    });

    // Total Row
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", LEFT + 152, currY + 29);
    const total = order.charges?.grand_total || "0.00";
    doc.text(`${parseFloat(total).toFixed(2)}`, RIGHT - 2, currY + 29, { align: "right" });

    currY += descH;

    // ---------------------------------------------------------
    // 6. TERMS & FOOTER
    // ---------------------------------------------------------
    doc.setFontSize(5.5);
    const terms = "Terms & conditions: (1) All shipments are subject to standard carriage terms. (2) ROADOZ is not responsible for illegal items. (3) Max liability is Rs 100/- unless insured. (4) No claims accepted after 15 days of booking.";
    doc.text(doc.splitTextToSize(terms, WIDTH), LEFT, currY + 4);

    const footerY = HALF_H - 10;
    doc.line(LEFT, footerY, LEFT + 40, footerY);
    doc.line(RIGHT - 40, footerY, RIGHT, footerY);
    doc.setFontSize(7);
    doc.text("Receiver Signature", LEFT + 20, footerY + 4, { align: "center" });
    doc.text("Authorized Signatory", RIGHT - 20, footerY + 4, { align: "center" });
};

export const generateInvoicePDF = (order) => {
    try {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        drawInvoice(doc, order);
        
        // Note: This only draws on the top half of the A4. 
        // If you want to print 2 copies on one page, call drawInvoice again with offset.
        
        doc.save(`Invoice_${order.id || "order"}.pdf`);
    } catch (error) {
        console.error("PDF Generation Error:", error);
    }
};


export const generateInvoiceDataUri = (order, pdfTitle, isSuperAdmin = false) => {
  try {
    const doc = new jsPDF();
    drawInvoice(doc, order, isSuperAdmin);
    return doc.output('bloburl');
  } catch (error) {
    console.error("PDF URI Generation Error:", error);
    return null;
  }
};

export const generateBulkInvoicesPDF = (orders, isSuperAdmin = false) => {
  try {
    if (!orders || orders.length === 0) return;
    const doc = new jsPDF();
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      drawInvoice(doc, order, isSuperAdmin);
    });
    doc.save(`Bulk_Invoices_${orders.length}_Orders.pdf`);
  } catch (error) {
    console.error("Bulk PDF Generation Error:", error);
  }
};

export const generateBulkInvoicesDataUri = (orders, isSuperAdmin = false) => {
  try {
    if (!orders || orders.length === 0) return null;
    const doc = new jsPDF();
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      drawInvoice(doc, order, isSuperAdmin);
    });
    return doc.output('bloburl');
  } catch (error) {
    console.error("Bulk PDF URI Generation Error:", error);
    return null;
  }
};