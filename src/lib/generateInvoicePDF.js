import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const drawInvoice = (doc, order) => {
    // -----------------------------
    // COLORS & CONSTANTS
    // -----------------------------
    const primary = [0, 0, 0];
    const lightGray = [240, 240, 240];
    const black = [0, 0, 0];
    const white = [255, 255, 255];
    const PAGE_LEFT = 14;
    const PAGE_RIGHT = 196; // 210mm - 14mm margin

    // ─────────────────────────────────────────────────────────
    // HEADER  (invoice meta RIGHT only)
    // ─────────────────────────────────────────────────────────

    // --- Header Section ---
    // Company name on left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Roadoz Logistics Pvt Ltd", PAGE_LEFT, 20);

    // --- TAX INVOICE label — right-aligned ---
    doc.setFontSize(18);
    doc.text("TAX INVOICE", PAGE_RIGHT, 20, { align: "right" });

    // --- Invoice meta (right column) ---
    // Render label left-of-center and value right-aligned for clean layout
    const META_LABEL_X = 125;
    const metaRows = [
      ["Invoice No", order.invoiceNo || "N/A"],
      ["Invoice Date", order.created || "N/A"],
      ["Order Number", order.id || "N/A"],
    ];
    metaRows.forEach(([label, value], i) => {
      const y = 27 + i * 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${label}:`, META_LABEL_X, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, PAGE_RIGHT, y, { align: "right" });
    });

    // -----------------------------
    // DIVIDER
    // -----------------------------
    doc.setDrawColor(180);
    doc.line(PAGE_LEFT, 47, PAGE_RIGHT, 47);

    // ─────────────────────────────────────────────────────────
    // PICKUP  &  DELIVERY  ADDRESSES
    // Split at midpoint (x = 105); right column starts at 108
    // ─────────────────────────────────────────────────────────
    const ADDR_Y_TITLE = 56;
    const ADDR_Y_START = 62;
    const ADDR_LEFT_X = PAGE_LEFT;
    const ADDR_RIGHT_X = 108;

    // Section titles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Pickup Address", ADDR_LEFT_X, ADDR_Y_TITLE);
    doc.text("Delivery Address", ADDR_RIGHT_X, ADDR_Y_TITLE);

    // Vertical separator between the two address blocks
    doc.setDrawColor(200);
    doc.line(105, 50, 105, 97);

    // Address content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const pickupLines = [
      order.pickup?.name || "",
      order.pickup?.address1 || "",
      order.pickup?.address2 || "",
      order.pickup?.city || "",
      `Phone: ${order.pickup?.phone || ""}`,
    ];
    const deliveryLines = [
      order.customer?.name || "",
      order.customer?.address1 || "",
      order.customer?.address2 || "",
      order.customer?.city || "",
      `Phone: ${order.customer?.phone || ""}`,
    ];

    pickupLines.forEach((line, i) =>
      doc.text(line, ADDR_LEFT_X, ADDR_Y_START + i * 5),
    );
    deliveryLines.forEach((line, i) =>
      doc.text(line, ADDR_RIGHT_X, ADDR_Y_START + i * 5),
    );

    // -----------------------------
    // SHIPMENT DETAILS TABLE
    // -----------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Shipment Details", PAGE_LEFT, 103);

    autoTable(doc, {
      startY: 107,
      head: [
        ["Product", "SKU", "Qty", "Weight", "Dimensions", "Declared Value"],
      ],
      body: order.items && order.items.length > 0 
        ? order.items.map((item, index) => [
            item.product_name || "-",
            item.sku || "-",
            item.qty || "-",
            index === 0 && order.weight ? order.weight : "-",
            index === 0 && order.dims ? order.dims : "-",
            item.total ? `Rs. ${item.total}` : "-",
          ])
        : [
            [
              order.product?.name || "-",
              order.product?.sku || "-",
              order.product?.qty || "-",
              order.weight ? order.weight : "-",
              order.dims || "-",
              order.product?.value ? `Rs. ${order.product.value}` : "-",
            ],
          ],
      styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: {
        fillColor: black,
        textColor: white,
        fontStyle: "bold",
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 40, halign: "center" },
        5: { cellWidth: 35, halign: "right" },
      },
      theme: "grid",
      margin: { left: PAGE_LEFT, right: 0 },
      tableWidth: PAGE_RIGHT - PAGE_LEFT,
    });

    // -----------------------------
    // CHARGES BREAKDOWN TABLE
    // -----------------------------
    const chargeY = doc.lastAutoTable.finalY + 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Charges Breakdown", PAGE_LEFT, chargeY);

    autoTable(doc, {
      startY: chargeY + 4,
      head: [["Description", "Amount"]],
      body: [
        ["Freight Charges", order.charges?.freight ? `Rs. ${order.charges.freight}` : "-"],
        ["Fuel Surcharge", order.charges?.fuel ? `Rs. ${order.charges.fuel}` : "-"],
        ["Subtotal", order.charges?.subtotal ? `Rs. ${order.charges.subtotal}` : "-"],
        ["GST @ 18%", order.charges?.gst ? `Rs. ${order.charges.gst}` : "-"],
        ["Grand Total", order.payment?.total ? `Rs. ${order.payment.total}` : "-"],
      ],
      styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: {
        fillColor: black,
        textColor: white,
        fontStyle: "bold",
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 60, halign: "right" },
      },
      // Bold the summary rows
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index >= 2) {
          data.cell.styles.fontStyle = "bold";
        }
      },
      theme: "grid",
      margin: { left: PAGE_LEFT, right: 0 },
      tableWidth: PAGE_RIGHT - PAGE_LEFT,
    });

    // ─────────────────────────────────────────────────────────
    // EXTRA DETAILS  — light shaded info bar
    // ─────────────────────────────────────────────────────────
    const PAGE_H = 297; // A4 height in mm
    const SIG_H = 16; // space needed for sig line + label
    const BOTTOM_MARGIN = 10;
    const SAFE_BOTTOM = PAGE_H - BOTTOM_MARGIN; // 287mm — last safe y

    const extraY = doc.lastAutoTable.finalY + 6;
    const INFO_BAR_H = 10; // compact bar height

    // Shaded background
    doc.setFillColor(245, 245, 245);
    doc.rect(PAGE_LEFT, extraY, PAGE_RIGHT - PAGE_LEFT, INFO_BAR_H, "F");
    doc.setDrawColor(200);
    doc.rect(PAGE_LEFT, extraY, PAGE_RIGHT - PAGE_LEFT, INFO_BAR_H, "S");

    // Three columns inside the bar
    const barTextY = extraY + 6.5;
    doc.setFontSize(9);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Method:", PAGE_LEFT + 3, barTextY);
    doc.setFont("helvetica", "normal");
    doc.text(order.payment?.method || "N/A", PAGE_LEFT + 33, barTextY);

    doc.setFont("helvetica", "bold");
    doc.text("Shipment Type:", 82, barTextY);
    doc.setFont("helvetica", "normal");
    doc.text(order.shipmentType || "N/A", 110, barTextY);

    doc.setFont("helvetica", "bold");
    doc.text("Risk Type:", 148, barTextY);
    doc.setFont("helvetica", "normal");
    doc.text(order.riskType || "N/A", 168, barTextY);

    // Total Boxes row
    const boxesY = extraY + INFO_BAR_H + 7;
    doc.setFont("helvetica", "bold");
    doc.text("Total Boxes:", PAGE_LEFT, boxesY);
    doc.setFont("helvetica", "normal");
    doc.text(String(order.totalBoxes || 1), PAGE_LEFT + 24, boxesY);

    // ─────────────────────────────────────────────────────────
    // TERMS & CONDITIONS — with dynamic page breaks
    // ─────────────────────────────────────────────────────────
    const terms = [
      "All shipments are subject to Roadoz Logistics standard terms of carriage.",
      "Misdeclaration of goods may result in penalties or shipment rejection.",
      "Prohibited items, hazardous materials, and contraband are not accepted for transport.",
      "Damaged or lost shipment claims must be reported within 48 hours of delivery.",
      "Undelivered shipments will be held for 30 days before disposal.",
      "Freight charges are non-refundable once shipment is dispatched.",
      "GST is applicable as per Indian taxation laws and will be charged extra.",
    ];
    
    const LINE_H = 4.5;
    const TERMS_TITLE_H = 6;
    const MIN_SPACE_FOR_TERMS = 40; // minimum space needed for terms section
    
    let termsY = boxesY + 6; // at least 6mm below "Total Boxes"
    
    // Check if we need a new page for terms
    if (termsY + TERMS_TITLE_H + (terms.length * LINE_H) > SAFE_BOTTOM - 15) {
      doc.addPage();
      termsY = 20; // start near top of new page
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Terms & Conditions:", PAGE_LEFT, termsY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let currentY = termsY + TERMS_TITLE_H;
    
    terms.forEach((line, i) => {
      const termText = `${i + 1}. ${line}`;
      const splitText = doc.splitTextToSize(termText, PAGE_RIGHT - PAGE_LEFT - 4);
      const lineCount = splitText.length;
      const lineHeight = lineCount * 3.5;
      
      // Check if we need a new page for this term
      if (currentY + lineHeight > SAFE_BOTTOM - 25) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.text(splitText, PAGE_LEFT + 2, currentY);
      currentY += lineHeight + 1;
    });

    // -----------------------------
    // SIGNATURES  — pinned to bottom of current page or right below terms
    // -----------------------------
    let finalSigY = currentY + 15;
    if (finalSigY > SAFE_BOTTOM) {
      doc.addPage();
      finalSigY = 20;
    } else if (finalSigY < SAFE_BOTTOM - 8) {
      // If there's plenty of space, still pin to bottom
      finalSigY = SAFE_BOTTOM - 8;
    }

    doc.setDrawColor(100);
    doc.line(PAGE_LEFT, finalSigY, 80, finalSigY); // customer line
    doc.line(130, finalSigY, PAGE_RIGHT, finalSigY); // authorized line

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Customer Signature", PAGE_LEFT, finalSigY + 5);
    doc.text("Authorized Signatory", 130, finalSigY + 5);
};

export const generateInvoicePDF = (order) => {
  try {
    const doc = new jsPDF();
    drawInvoice(doc, order);
    doc.save(`Invoice_${order.id || "invoice"}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
  }
};

export const generateInvoiceDataUri = (order, pdfTitle) => {
  try {
    const doc = new jsPDF();
    drawInvoice(doc, order);
    return doc.output('bloburl');
  } catch (error) {
    console.error("PDF URI Generation Error:", error);
    return null;
  }
};

export const generateBulkInvoicesPDF = (orders) => {
  try {
    if (!orders || orders.length === 0) return;
    const doc = new jsPDF();
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      drawInvoice(doc, order);
    });
    doc.save(`Bulk_Invoices_${orders.length}_Orders.pdf`);
  } catch (error) {
    console.error("Bulk PDF Generation Error:", error);
  }
};

export const generateBulkInvoicesDataUri = (orders) => {
  try {
    if (!orders || orders.length === 0) return null;
    const doc = new jsPDF();
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      drawInvoice(doc, order);
    });
    return doc.output('bloburl');
  } catch (error) {
    console.error("Bulk PDF URI Generation Error:", error);
    return null;
  }
};
