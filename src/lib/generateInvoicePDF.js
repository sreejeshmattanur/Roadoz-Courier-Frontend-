import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import roadozLogo from "../assets/images/RO-2.png";

/**
 * Draws a single invoice copy. 
 * Vertical heights are adjusted to ensure 3 copies fit on one A4 (297mm).
 */
const drawInvoice = (doc, order, startY, label) => {
    const LEFT = 10;
    const RIGHT = 200;
    const WIDTH = RIGHT - LEFT;
    const shipmentTypeStr = order.shipmentType || "N/A";

    let currY = startY;

    // Helper to safely parse strings/numbers
    const safeParse = (val) => {
        if (val === null || val === undefined) return 0;
        const sanitized = String(val).replace(/[^0-9.-]+/g, "");
        return parseFloat(sanitized) || 0;
    };

    const drawGrid = (x, y, w, h) => doc.rect(x, y, w, h);

    // Label for the copy (Top Right)
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text(label, RIGHT, currY - 1, { align: "right" });

    // ---------------------------------------------------------
    // 1. HEADER (Reduced height to 18mm)
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 18);
    try {
        doc.addImage(roadozLogo, "PNG", LEFT + 4, currY + 2, 35, 14);
    } catch (e) {
        doc.setFontSize(16);
        doc.text("ROADOZ", LEFT + 5, currY + 10);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ROADOZ PVT. LTD.", LEFT + 55, currY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Courier And Cargo | Room No: 122, DD Vyapar Bhavan, Kochi-682020", LEFT + 55, currY + 9);
    doc.text("Phone: +91 9496630687 | Email: info@roadoz.com", LEFT + 55, currY + 12);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: 32AAPCR1988L1ZP | Invoice: INV-${order.id || "N/A"}`, LEFT + 55, currY + 16);

    currY += 18;

    // ---------------------------------------------------------
    // 2. META BAR (Reduced height to 15mm)
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 15);
    doc.line(LEFT + 55, currY, LEFT + 55, currY + 15); 
    doc.line(LEFT + 85, currY, LEFT + 85, currY + 15); 
    doc.line(LEFT + 110, currY, LEFT + 110, currY + 15); 

    doc.setFontSize(7);
    doc.text("DATE & TIME", LEFT + 2, currY + 4);
    doc.setFontSize(8);
    doc.text(order.created || "N/A", LEFT + 2, currY + 9);
    doc.setFontSize(6);
    doc.text("Type: " + shipmentTypeStr, LEFT + 2, currY + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const payMethod = (order.payment?.method || "TO PAY").toUpperCase();
    doc.text(payMethod, LEFT + 70, currY + 9, { align: "center" });

    const pkgCount = order.packages?.length || order.package_count || 1;
    doc.setFontSize(7);
    doc.text("TOTAL PCS", LEFT + 87, currY + 4);
    doc.setFontSize(12);
    doc.text(String(pkgCount), LEFT + 97, currY + 11, { align: "center" });

    try {
        const barcodeId = order.id || "ORD-00000";
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, barcodeId, { format: "CODE128", displayValue: false, height: 35 });
        doc.addImage(canvas.toDataURL("image/png"), 'PNG', LEFT + 115, currY + 1, 75, 10);
        doc.setFontSize(7);
        doc.text(barcodeId, LEFT + 152, currY + 13, { align: "center" });
    } catch (e) {
        doc.text(order.id || "", LEFT + 120, currY + 9);
    }

    currY += 15;

    // ---------------------------------------------------------
    // 3. ROUTE BAR (Height: 6mm)
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 6);
    doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + 6);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`FROM : ${order.pickup?.city || "N/A"}`, LEFT + 2, currY + 4);
    doc.text(`DESTINATION : ${order.customer?.city || "N/A"}`, LEFT + (WIDTH / 2) + 2, currY + 4);

    currY += 6;

    // ---------------------------------------------------------
    // 4. ADDRESS GRID (Height: 25mm)
    // ---------------------------------------------------------
    const gridH = 25;
    drawGrid(LEFT, currY, WIDTH, gridH);
    doc.line(LEFT + 45, currY, LEFT + 45, currY + gridH); 
    doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + gridH); 
    doc.line(LEFT + 140, currY, LEFT + 140, currY + gridH); 

    const rowH = 5;
    for (let i = 1; i < 5; i++) {
        doc.line(LEFT, currY + (i * rowH), RIGHT, currY + (i * rowH));
    }

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.text("CONSIGNOR", LEFT + 2, currY + 3.5);
    doc.text(order.pickup?.name?.substring(0, 30) || "N/A", LEFT + 47, currY + 3.5);
    doc.text("CONTACT NO", LEFT + 2, currY + 8.5);
    doc.text(order.pickup?.phone || "N/A", LEFT + 47, currY + 8.5);
    doc.text("REFERENCE NO", LEFT + 2, currY + 13.5);
    doc.text(order.reference_no || "Door Delivery", LEFT + 47, currY + 13.5);
    doc.setFont("helvetica", "bold");
    doc.text(`AWB No: ${order.id || "-"}`, LEFT + 2, currY + 18.5);
    doc.text(`Weight: ${order.weight || "0"} kg`, LEFT + 47, currY + 18.5);
    doc.text(`Declared Val: ${order.amount || "0"}`, LEFT + 2, currY + 23.5);
    doc.text(`Service: ${order.serviceType || "Standard"}`, LEFT + 47, currY + 23.5);

    doc.setFont("helvetica", "normal");
    doc.text("CONSIGNEE", LEFT + 102, currY + 3.5);
    doc.text(order.customer?.name?.substring(0, 30) || "N/A", LEFT + 142, currY + 3.5);
    doc.text("CONTACT NO", LEFT + 102, currY + 8.5);
    doc.text(order.customer?.phone || "N/A", LEFT + 142, currY + 8.5);
    doc.text("DISTRICT", LEFT + 102, currY + 13.5);
    doc.text(order.customer?.city || "N/A", LEFT + 142, currY + 13.5);
    doc.text("STATE", LEFT + 102, currY + 18.5);
    doc.text(order.customer?.state || "KERALA", LEFT + 142, currY + 18.5);
    doc.text("DELIVERY BY", LEFT + 102, currY + 23.5);
    doc.text(order.creator?.name || "ROADOZ LOGISTICS", LEFT + 142, currY + 23.5);

    currY += gridH;

    // ---------------------------------------------------------
    // 5. DESCRIPTION & CHARGES (All Fields Included)
    // ---------------------------------------------------------
    const descH = 26; 
    drawGrid(LEFT, currY, WIDTH, descH);
    doc.line(LEFT + 150, currY, LEFT + 150, currY + descH); 
    doc.line(LEFT + 172, currY, LEFT + 172, currY + descH); 
    doc.line(LEFT, currY + 5, RIGHT, currY + 5); 

    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTIONS", LEFT + 2, currY + 3.5);
    doc.text("Charges", LEFT + 152, currY + 3.5);
    doc.text("Amount", RIGHT - 2, currY + 3.5, { align: "right" });

    // Left side: Item Name
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    const itemName = order.items?.[0]?.product_name || order.product?.name || "General Goods";
    doc.text(`- ${itemName}`, LEFT + 2, currY + 8);

    // Bank Details (Reduced font to fit)
    doc.setFontSize(5);
    doc.text("BANK: HDFC | A/C: 50200116941777 | IFSC: HDFC0002321", LEFT + 2, currY + descH - 2);

    // RIGHT SIDE: EXACT CHARGE LOGIC
    const isCOD = payMethod === "COD" || payMethod === "CASH ON DELIVERY";
    const chargesBody = [];
    
    if (isCOD && safeParse(order.amount) > 0) chargesBody.push(["Product Total", safeParse(order.amount)]);
    if (safeParse(order.charges?.freight) > 0) chargesBody.push(["Freight", safeParse(order.charges?.freight)]);
    if (!order.is_gst_exempt && safeParse(order.charges?.freight_gst) > 0) chargesBody.push(["GST", safeParse(order.charges?.freight_gst)]);
    if (safeParse(order.charges?.insurance) > 0) chargesBody.push(["Insurance", safeParse(order.charges?.insurance)]);
    if (safeParse(order.charges?.regional_area) > 0) chargesBody.push(["Reg. Area", safeParse(order.charges?.regional_area)]);
    if (safeParse(order.charges?.cod_amount) > 0) chargesBody.push(["COD Chrg", safeParse(order.charges?.cod_amount)]);
    if (safeParse(order.charges?.to_pay_amount) > 0) chargesBody.push(["To Pay Amt", safeParse(order.charges?.to_pay_amount)]);
    if (safeParse(order.charges?.credit_amount) > 0) chargesBody.push(["Credit Amt", safeParse(order.charges?.credit_amount)]);
    if (safeParse(order.charges?.prepaid_amount) > 0) chargesBody.push(["Prepaid Amt", safeParse(order.charges?.prepaid_amount)]);

    doc.setFontSize(6);
    chargesBody.forEach((c, i) => {
        const rowY = currY + 8.5 + (i * 3.2);
        if (rowY < currY + descH - 4) {
            doc.text(c[0], LEFT + 152, rowY);
            doc.text(c[1].toFixed(2), RIGHT - 2, rowY, { align: "right" });
        }
    });

    // Grand Total
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const totalVal = safeParse(order.charges?.grand_total) || chargesBody.reduce((acc, curr) => acc + curr[1], 0);
    doc.text("TOTAL", LEFT + 152, currY + descH - 1.5);
    doc.text(`Rs. ${totalVal.toFixed(2)}`, RIGHT - 2, currY + descH - 1.5, { align: "right" });

    currY += descH;

    // ---------------------------------------------------------
    // 6. FOOTER (Signatures)
    // ---------------------------------------------------------
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.text("Terms: Shipments subject to standard terms. Liability restricted. Claims within 15 days.", LEFT, currY + 3);
    
    doc.setFontSize(6);
    doc.text("Receiver Signature", LEFT + 25, currY + 7, { align: "center" });
    doc.text("Authorized Signatory", RIGHT - 25, currY + 7, { align: "center" });
};

/**
 * Handles generating 3 copies per page
 */
const drawThreeCopies = (doc, order) => {
    const labels = ["CONSIGNEE COPY", "CONSIGNOR COPY", "TRANSIT COPY"];
    const verticalSpacing = 96; // 297 / 3 = 99mm. 96 gives room for labels/padding.
    
    labels.forEach((label, index) => {
        const startY = 8 + (index * verticalSpacing);
        drawInvoice(doc, order, startY, label);
        
        // Draw cut-line
        if (index < 2) {
            doc.setDrawColor(200);
            doc.setLineDashPattern([1, 1], 0);
            doc.line(5, startY + verticalSpacing - 3, 205, startY + verticalSpacing - 3);
            doc.setLineDashPattern([], 0);
            doc.setDrawColor(0);
        }
    });
};

// --- Export Functions ---

export const generateInvoicePDF = (order) => {
    try {
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        drawThreeCopies(doc, order);
        doc.save(`Invoice_${order.id || "ROADOZ"}.pdf`);
    } catch (error) {
        console.error("PDF Error:", error);
    }
};

export const generateInvoiceDataUri = (order) => {
    try {
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        drawThreeCopies(doc, order);
        return doc.output('bloburl');
    } catch (error) {
        return null;
    }
};

export const generateBulkInvoicesPDF = (orders) => {
    try {
        if (!orders?.length) return;
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        orders.forEach((order, index) => {
            if (index > 0) doc.addPage();
            drawThreeCopies(doc, order);
        });
        doc.save(`Bulk_Invoices_${orders.length}.pdf`);
    } catch (error) {
        console.error("Bulk PDF Error:", error);
    }
};

export const generateBulkInvoicesDataUri = (orders) => {
    try {
        if (!orders?.length) return null;
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        orders.forEach((order, index) => {
            if (index > 0) doc.addPage();
            drawThreeCopies(doc, order);
        });
        return doc.output('bloburl');
    } catch (error) {
        return null;
    }
};