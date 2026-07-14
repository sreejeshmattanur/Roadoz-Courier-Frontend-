import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import roadozLogo from "../assets/images/RO-2.png";

/**
 * Reusable function to draw one invoice block
 * @param {Object} doc - jsPDF instance
 * @param {Object} order - The order data
 * @param {Number} startY - Vertical offset (10 for top, 158.5 for bottom)
 * @param {String} copyLabel - Label like "CONSIGNEE COPY" or "TRANSIT COPY"
 */
const drawInvoiceBlock = (doc, order, startY, copyLabel) => {
  const LEFT = 10;
  const RIGHT = 200;
  const WIDTH = RIGHT - LEFT;
  let currY = startY;

  // Helper to draw the grid lines
  const drawGrid = (x, y, w, h) => doc.rect(x, y, w, h);

  // --- Header Label ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(copyLabel, RIGHT, currY - 2, { align: "right" });

  // 1. HEADER & INSURANCE SEAL
  drawGrid(LEFT, currY, WIDTH, 22);

  const insuranceAmt = Number(order.charges?.insurance || 0);
  if (insuranceAmt > 0) {
    const sealCenterX = LEFT + 170;
    const sealCenterY = currY + 10.5;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.circle(sealCenterX, sealCenterY, 8, "S");
    doc.setLineWidth(0.2);
    doc.circle(sealCenterX, sealCenterY, 6.5, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("INSURED", sealCenterX, sealCenterY + 2, { align: "center" });
    doc.setLineWidth(0.2);
  }

  // Logo
  try {
    doc.addImage(roadozLogo, "PNG", LEFT + 4, currY + 3, 40, 16);
  } catch (e) {
    console.error("Logo load fail", e);
  }

  // Company Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ROADOZ PVT. LTD.", LEFT + 60, currY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Courier And Cargo", LEFT + 60, currY + 11);
  doc.setFontSize(7);
  doc.text("Room No: 122, DD Vyapar Bhavan, Kadavanthra, Kochi-682020", LEFT + 60, currY + 14);
  doc.text("Phone: +91 9496630687 | Email: info@roadoz.com", LEFT + 60, currY + 17);
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN: 32AAPCR1988L1ZP | AWB NO: ${order.id || "ORD"}`, LEFT + 60, currY + 20);

  currY += 22;

  // 2. META BAR (Date, Payment, Pieces, Barcode)
  drawGrid(LEFT, currY, WIDTH, 18);
  doc.line(LEFT + 55, currY, LEFT + 55, currY + 18);
  doc.line(LEFT + 85, currY, LEFT + 85, currY + 18);
  doc.line(LEFT + 110, currY, LEFT + 110, currY + 18);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("DATE & TIME", LEFT + 2, currY + 5);
  doc.setFontSize(9);
  doc.text(order.created || "N/A", LEFT + 2, currY + 11);
  doc.setFontSize(7);
  doc.text(`Service: ${order.serviceType || "Surface"}`, LEFT + 2, currY + 16);

  // --- Payment Logic for Meta Bar ---
  const payMethod = (order.payment?.method || "").toUpperCase();
  let payLabel = payMethod;
  if (payMethod === "TOPAY") payLabel = "TO PAY";
  if (payMethod === "CREDIT") payLabel = "CREDIT";
  if (payMethod === "COD") payLabel = "C.O.D";
  if (payMethod === "PREPAID") payLabel = "PREPAID";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(payLabel || "TO PAY", LEFT + 70, currY + 11, { align: "center" });
 
  const totalQty = order.items?.reduce((acc, item) => acc + (item.qty || 0), 0) || 1;
  doc.setFontSize(7);
  doc.text("TOTAL QTY", LEFT + 87, currY + 5);
  doc.setFontSize(14);
  doc.text(String(totalQty), LEFT + 97, currY + 13, { align: "center" });

  // Barcode
  try {
    const barcodeId = order.id || "ORD-0000";
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeId, { format: "CODE128", displayValue: false, height: 40 });
    const barcodeImg = canvas.toDataURL("image/png");
    doc.addImage(barcodeImg, 'PNG', LEFT + 115, currY + 2, 75, 14);
  } catch (e) {}

  currY += 18;

  // 3. ROUTE BAR
  drawGrid(LEFT, currY, WIDTH, 7);
  doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + 7);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`FROM : ${order.pickup?.city || "N/A"}`, LEFT + 2, currY + 5);
  doc.text(`DESTINATION : ${order.customer?.city || "N/A"}`, LEFT + (WIDTH / 2) + 2, currY + 5);

  currY += 7;

  // 4. ADDRESS GRID
  const gridH = 32;
  drawGrid(LEFT, currY, WIDTH, gridH);
  doc.line(LEFT + 45, currY, LEFT + 45, currY + gridH); 
  doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + gridH); 
  doc.line(LEFT + 140, currY, LEFT + 140, currY + gridH); 

  for (let i = 1; i < 5; i++) {
    doc.line(LEFT, currY + (i * 6.4), RIGHT, currY + (i * 6.4));
  }

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  // Consignor side
  doc.text("CONSIGNOR", LEFT + 2, currY + 4.5);
  doc.text(order.pickup?.name || "N/A", LEFT + 47, currY + 4.5);
  doc.text("CONTACT NO", LEFT + 2, currY + 11);
  doc.text(order.pickup?.phone || "N/A", LEFT + 47, currY + 11);
  doc.text("REFERENCE NO", LEFT + 2, currY + 17.5);
  doc.text(`DLY: ${order.deliveryType || "Door Delivery"}`, LEFT + 47, currY + 17.5);
  
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No: ${order.invoiceNo || order.invoice_no || "N/A"}`, LEFT + 2, currY + 24);
  
  // FIX: WEIGHT FROM PACKAGES ARRAY
  const totalWeight = (order.packages || []).reduce((sum, pkg) => sum + (pkg.applicable_weight_kg || 0), 0);
  doc.text(`Weight: ${totalWeight.toFixed(2)} kg`, LEFT + 47, currY + 24);

  doc.text(`Invoice Amount: ${order.amount || "0.00"}`, LEFT + 2, currY + 30.5);
  doc.text(`Type: ${order.shipmentType || "N/A"}`, LEFT + 47, currY + 30.5);

  // Consignee side
  doc.setFont("helvetica", "normal");
  doc.text("CONSIGNEE", LEFT + 102, currY + 4.5);
  doc.text(order.customer?.name || "N/A", LEFT + 142, currY + 4.5);
  doc.text("CONTACT NO", LEFT + 102, currY + 11);
  doc.text(order.customer?.phone || "N/A", LEFT + 142, currY + 11);
  doc.text("DISTRICT", LEFT + 102, currY + 17.5);
  doc.text(order.customer?.city || "N/A", LEFT + 142, currY + 17.5);
  doc.text("STATE", LEFT + 102, currY + 24);
  doc.text(order.customer?.state || "Kerala", LEFT + 142, currY + 24);
  doc.text("Booked By", LEFT + 102, currY + 30.5);
  doc.setFont("helvetica", "bold");
  doc.text(order.creator?.name || "ROADOZ", LEFT + 142, currY + 30.5);

  currY += gridH;

  // 5. DESCRIPTION & DYNAMIC CHARGES
  const descH = 40;
  drawGrid(LEFT, currY, WIDTH, descH);
  doc.line(LEFT + 150, currY, LEFT + 150, currY + descH); 
  doc.line(LEFT + 170, currY, LEFT + 170, currY + descH); 
  doc.line(LEFT, currY + 6, RIGHT, currY + 6); 

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DESCRIPTIONS / ITEM NAME", LEFT + 2, currY + 4);
  doc.text("Charges", LEFT + 152, currY + 4);
  doc.text("Amount", RIGHT - 2, currY + 4, { align: "right" });

  doc.setFont("helvetica", "normal");
  order.items?.slice(0, 4).forEach((item, index) => {
    doc.text(`${item.product_name} (Qty: ${item.qty})`, LEFT + 2, currY + 11 + (index * 4));
  });

  // --- Dynamic Payment Charges Logic ---
  let chargesBody = [];
  if (Number(order.charges?.freight) > 0) chargesBody.push(["Freight Charges", order.charges.freight]);
  if (!order.is_gst_exempt && Number(order.charges?.freight_gst) > 0) chargesBody.push(["Freight GST", order.charges.freight_gst]);
  if (Number(order.charges?.insurance) > 0) chargesBody.push(["Insurance", order.charges.insurance]);
  
  // Specific Dynamic Label based on payment method
  const grandTotal = order.charges?.grand_total || 0;
  const m = payMethod;
  if (m === "TOPAY") chargesBody.push(["To Pay Amount", grandTotal]);
  else if (m === "CREDIT") chargesBody.push(["Credit Amount", grandTotal]);
  else if (m === "COD") chargesBody.push(["COD Amount", grandTotal]);
  else if (m === "PREPAID") chargesBody.push(["Prepaid Amount", grandTotal]);

  chargesBody.forEach((c, i) => {
    const rowY = currY + 10 + (i * 4);
    doc.setFontSize(7);
    doc.text(c[0], LEFT + 152, rowY);
    doc.text(parseFloat(c[1]).toFixed(2), RIGHT - 2, rowY, { align: "right" });
  });

  // Bank & Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("BANK: HDFC | A/C: 50200116941777 | IFSC: HDFC0002321", LEFT + 2, currY + 38);

  doc.setFontSize(9);
  doc.text("TOTAL", LEFT + 152, currY + descH - 3);
  doc.text(`${parseFloat(grandTotal).toFixed(2)}`, RIGHT - 2, currY + descH - 3, { align: "right" });

  currY += descH;

  // 6. FOOTER
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  const terms = "Terms & conditions: (1) All shipments subject to standard carriage terms. (2) ROADOZ not responsible for illegal items. (3) Max liability Rs 100/- unless insured.";
  doc.text(doc.splitTextToSize(terms, WIDTH), LEFT, currY + 4);

  const footerY = currY + 14;
  doc.line(LEFT, footerY, LEFT + 40, footerY);
  doc.line(RIGHT - 40, footerY, RIGHT, footerY);
  doc.setFontSize(7);
  doc.text("Receiver Signature", LEFT + 20, footerY + 4, { align: "center" });
  doc.text("Authorized Signatory", RIGHT - 20, footerY + 4, { align: "center" });
};

/** 
 * EXPORT FUNCTIONS 
 */
export const generateInvoicePDF = (order) => {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    drawInvoiceBlock(doc, order, 10, "CONSIGNEE COPY");
    doc.setDrawColor(200);
    doc.setLineDash([2, 2], 0);
    doc.line(0, 148.5, 210, 148.5);
    doc.setLineDash([], 0);
    doc.setDrawColor(0);
    drawInvoiceBlock(doc, order, 158.5, "TRANSIT COPY");
    doc.save(`Invoice_${order.id || "order"}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
  }
};

export const generateInvoiceDataUri = (order) => {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    drawInvoiceBlock(doc, order, 10, "CONSIGNEE COPY");
    doc.setLineDash([2, 2], 0);
    doc.line(0, 148.5, 210, 148.5);
    doc.setLineDash([], 0);
    drawInvoiceBlock(doc, order, 158.5, "TRANSIT COPY");
    return doc.output('bloburl');
  } catch (error) {
    console.error("PDF URI Error:", error);
    return null;
  }
};

export const generateBulkInvoicesPDF = (orders) => {
  try {
    if (!orders?.length) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      drawInvoiceBlock(doc, order, 10, "CONSIGNEE COPY");
      doc.setLineDash([2, 2], 0);
      doc.line(0, 148.5, 210, 148.5);
      doc.setLineDash([], 0);
      drawInvoiceBlock(doc, order, 158.5, "TRANSIT COPY");
    });
    doc.save(`Bulk_Invoices.pdf`);
  } catch (error) {
    console.error("Bulk PDF Error:", error);
  }
};

export const generateBulkInvoicesDataUri = (orders) => {
  try {
    if (!orders || orders.length === 0) return null;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    orders.forEach((order, index) => {
      if (index > 0) doc.addPage();
      drawInvoiceBlock(doc, order, 10, "CONSIGNEE COPY");
      doc.setLineDash([2, 2], 0);
      doc.line(0, 148.5, 210, 148.5);
      doc.setLineDash([], 0);
      drawInvoiceBlock(doc, order, 158.5, "TRANSIT COPY");
    });
    return doc.output('bloburl');
  } catch (error) {
    console.error("Bulk PDF URI Error:", error);
    return null;
  }
};