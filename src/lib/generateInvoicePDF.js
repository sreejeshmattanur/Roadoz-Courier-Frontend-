import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const drawInvoice = (doc, order, isSuperAdmin = false) => {
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
    doc.text("Roadoz Courier & Cargo", PAGE_LEFT, 20);

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
    
    if (order.amount) {
      metaRows.push(["Invoice Amount", `Rs. ${order.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`]);
    }

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
    // PRODUCT DETAILS TABLE
    // -----------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Product Details", PAGE_LEFT, 103);

    autoTable(doc, {
      startY: 107,
      head: [
        ["Product Name", "SKU", "Price", "Qty", "Package Index", "Total"],
      ],
      body: order.items && order.items.length > 0 
        ? order.items.map((item, index) => [
            item.product_name || "-",
            item.sku || "-",
            item.unit_price !== undefined ? `Rs. ${item.unit_price}` : "-",
            item.qty || "-",
            `Package ${index + 1}`,
            item.total !== undefined ? `Rs. ${item.total}` : "-",
          ])
        : [
            [
              order.product?.name || "-",
              order.product?.sku || "-",
              order.product?.unit_price !== undefined ? `Rs. ${order.product.unit_price}` : "-",
              order.product?.qty || "-",
              "Package 1",
              order.product?.value !== undefined ? `Rs. ${order.product.value}` : "-",
            ],
          ],
      styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: {
        fillColor: black,
        textColor: white,
        fontStyle: "bold",
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 30, halign: "left" },
        2: { cellWidth: 25, halign: "left" },
        3: { cellWidth: 15, halign: "left" },
        4: { cellWidth: 30, halign: "left" },
        5: { cellWidth: 35, halign: "left" },
      },
      theme: "grid",
      margin: { left: PAGE_LEFT, right: 0 },
      tableWidth: PAGE_RIGHT - PAGE_LEFT,
    });

    // -----------------------------
    // PACKAGE DETAILS TABLE
    // -----------------------------
    const pkgY = doc.lastAutoTable.finalY + 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Package Details", PAGE_LEFT, pkgY);

    autoTable(doc, {
      startY: pkgY + 4,
      head: [
        ["Package", "Count", "L (cm)*", "B (cm)*", "H (cm)*", "Vol (kg)", "Manual Weight"],
      ],
      body: order.packages && order.packages.length > 0
        ? order.packages.map((pkg, index) => [
            `Pkg ${index + 1}`,
            pkg.count || "-",
            pkg.length_cm || "-",
            pkg.breadth_cm || "-",
            pkg.height_cm || "-",
            pkg.vol_weight_kg || pkg.volumetric_weight || "-",
            pkg.physical_weight_kg || pkg.actual_weight || "-",
          ])
        : [
            ["Pkg 1", "-", "-", "-", "-", "-", "-"],
          ],
      styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: {
        fillColor: black,
        textColor: white,
        fontStyle: "bold",
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 20, halign: "left" },
        2: { cellWidth: 20, halign: "left" },
        3: { cellWidth: 20, halign: "left" },
        4: { cellWidth: 20, halign: "left" },
        5: { cellWidth: 25, halign: "left" },
        6: { cellWidth: 25, halign: "left" },
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
    doc.text(order.is_gst_exempt ? "Charges Summary" : "Charges Breakdown", PAGE_LEFT, chargeY);

    const chargesBody = [];

    let totalValue = 0;

    let totalDeclaredValue = 0;
    if (order.items && order.items.length > 0) {
      totalDeclaredValue = order.items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
    } else {
      totalDeclaredValue = Number(order.product?.value?.toString().replace(/[^0-9.-]+/g,"") || 0);
    }

    const paymentMethodStr = (order.payment?.method || "").toLowerCase();
    const isCOD = paymentMethodStr === "cod" || paymentMethodStr === "cash on delivery";

    if (isCOD) {
      chargesBody.push(["Product Total", `Rs. ${totalDeclaredValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);
      totalValue += totalDeclaredValue;
    }

    if (!order.is_gst_exempt) {
      chargesBody.push(
        ["Freight Charges", order.charges?.freight ? `Rs. ${order.charges.freight}` : "-"],
        ["Freight GST", order.charges?.freight_gst ? `Rs. ${order.charges.freight_gst}` : "-"]
      );
      totalValue += Number(order.charges?.total_freight) || 0;
    }

    if (order.charges?.insurance && Number(order.charges.insurance) > 0) {
      chargesBody.push(["Insurance", `Rs. ${order.charges.insurance}`]);
      totalValue += Number(order.charges.insurance);
    }

    if (order.charges?.regional_area && Number(order.charges.regional_area) > 0) {
      chargesBody.push(["Regional Area", `Rs. ${order.charges.regional_area}`]);
      totalValue += Number(order.charges.regional_area);
    }

    if (order.charges?.cod_amount && Number(order.charges.cod_amount) > 0) {
      chargesBody.push(["COD Amount", `Rs. ${order.charges.cod_amount}`]);
      totalValue += Number(order.charges.cod_amount);
    }
    
    if (order.charges?.to_pay_amount && Number(order.charges.to_pay_amount) > 0) {
      chargesBody.push(["To Pay Amount", `Rs. ${order.charges.to_pay_amount}`]);
      totalValue += Number(order.charges.to_pay_amount);
    }
    
    if (order.charges?.credit_amount && Number(order.charges.credit_amount) > 0) {
      chargesBody.push(["Credit Amount", `Rs. ${order.charges.credit_amount}`]);
      totalValue += Number(order.charges.credit_amount);
    }

    if (order.charges?.prepaid_amount && Number(order.charges.prepaid_amount) > 0) {
      chargesBody.push(["Prepaid Amount", `Rs. ${order.charges.prepaid_amount}`]);
      totalValue += Number(order.charges.prepaid_amount);
    }

    chargesBody.push(["Grand Total", `Rs. ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]);

    autoTable(doc, {
      startY: chargeY + 4,
      head: [["Description", "Amount"]],
      body: chargesBody,
      styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.5 },
      headStyles: {
        fillColor: black,
        textColor: white,
        fontStyle: "bold",
        lineColor: [200, 200, 200],
        lineWidth: 0.5,
        halign: "left",
      },
      columnStyles: {
        0: { cellWidth: "auto", halign: "left" },
        1: { cellWidth: 60, halign: "left" },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          const desc = data.row.raw[0];
          if (desc === "Grand Total") {
            data.cell.styles.fontStyle = "bold";
          }
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

    // Left Column
    doc.setFont("helvetica", "bold");
    doc.text("Payment Method:", PAGE_LEFT + 3, barTextY);
    doc.setFont("helvetica", "normal");
    doc.text(order.payment?.method || "N/A", PAGE_LEFT + 33, barTextY);

    // Center Column
    doc.setFont("helvetica", "bold");
    doc.text("Service Type:", 95, barTextY);
    doc.setFont("helvetica", "normal");
    doc.text(order.serviceType || "N/A", 118, barTextY);

    // Right Column
    const shipmentTypeStr = order.shipmentType || "N/A";
    doc.setFont("helvetica", "normal");
    const valWidth = doc.getTextWidth(shipmentTypeStr);
    
    doc.text(shipmentTypeStr, PAGE_RIGHT - 3, barTextY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text("Shipment Type:", PAGE_RIGHT - 3 - valWidth - 2, barTextY, { align: "right" });

    // ─────────────────────────────────────────────────────────
    // TERMS & CONDITIONS — with dynamic page breaks
    // ─────────────────────────────────────────────────────────
    const terms = [
      "All shipments are subject to Roadoz Courier & Cargo standard terms of carriage.",
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
    
    let termsY = extraY + INFO_BAR_H + 7; // at least 7mm below the shaded info bar
    
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
    
    const isInsured = order.charges?.insurance && Number(order.charges.insurance) > 0;
    const termsTextWidth = isInsured ? (PAGE_RIGHT - PAGE_LEFT - 40) : (PAGE_RIGHT - PAGE_LEFT - 4);
    
    terms.forEach((line, i) => {
      const termText = `${i + 1}. ${line}`;
      const splitText = doc.splitTextToSize(termText, termsTextWidth);
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
    // SIGNATURES & STAMP  — pinned to bottom of current page or right below terms
    // -----------------------------
    const sigSpaceNeeded = isInsured ? 70 : 15;
    let finalSigY = currentY + sigSpaceNeeded;

    if (finalSigY > SAFE_BOTTOM) {
      doc.addPage();
      finalSigY = SAFE_BOTTOM - 8; // Pin to bottom on new page
    } else if (finalSigY < SAFE_BOTTOM - 8) {
      // If there's plenty of space, still pin to bottom
      finalSigY = SAFE_BOTTOM - 8;
    }

    if (isInsured) {
      // Circular INSURED stamp placed above Authorized Signatory
      const radius = 12;
      const centerX = PAGE_RIGHT - 10; // Shifted further to the right edge
      const centerY = finalSigY - radius - 32; // Moved even further up for signature space
      
      // Background and Outer circle
      doc.setFillColor(238, 252, 240); // Soft mint green
      doc.setDrawColor(22, 163, 74); // Tailwind green-600
      doc.setLineWidth(0.8);
      doc.circle(centerX, centerY, radius, "FD");
      
      // Inner decorative circle
      doc.setLineWidth(0.3);
      doc.circle(centerX, centerY, radius - 1.5, "S");
      
      // Text
      doc.setTextColor(21, 128, 61); // Tailwind green-700
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("INSURED", centerX, centerY, { align: "center", baseline: "middle" });
      
      // Reset colors
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
    }

    doc.setDrawColor(100);
    doc.line(PAGE_LEFT, finalSigY, 80, finalSigY); // customer line
    doc.line(130, finalSigY, PAGE_RIGHT, finalSigY); // authorized line

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Customer Signature", PAGE_LEFT, finalSigY + 5);
    doc.text("Authorized Signatory", 130, finalSigY + 5);
};

export const generateInvoicePDF = (order, isSuperAdmin = false) => {
  try {
    const doc = new jsPDF();
    drawInvoice(doc, order, isSuperAdmin);
    doc.save(`Invoice_${order.id || "invoice"}.pdf`);
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