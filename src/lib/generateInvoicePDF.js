import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import roadozLogo from "../assets/images/RO-2.png";

const drawInvoice = (doc, order) => {
    const PAGE_W = 210; // A4 Width
    const HALF_H = 148.5; // Half of A4 Height
    const LEFT = 10;
    const RIGHT = 200;
    const WIDTH = RIGHT - LEFT;
    const shipmentTypeStr = order.shipmentType || "N/A";

    let currY = 10;

    // Helper to safely parse strings/numbers and remove currency symbols
    const safeParse = (val) => {
        if (val === null || val === undefined) return 0;
        const sanitized = String(val).replace(/[^0-9.-]+/g, "");
        return parseFloat(sanitized) || 0;
    };

    // Helper to draw the grid lines
    const drawGrid = (x, y, w, h) => doc.rect(x, y, w, h);

    // ---------------------------------------------------------
    // 1. HEADER
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 22);
    
    try {
        doc.addImage(roadozLogo, "PNG", LEFT + 4, currY + 3, 40, 16);
    } catch (e) {
        doc.setFontSize(18);
        doc.text("ROADOZ", LEFT + 5, currY + 12);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ROADOZ PVT. LTD.", LEFT + 60, currY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Courier And Cargo", LEFT + 60, currY + 11);
    doc.setFontSize(7);
    doc.text("Room No: 122, DD Vyapar Bhavan, Kadavanthra, Kochi-682020", LEFT + 60, currY + 14);
    doc.text("Phone: +91 9496630687 | Email: info@roadoz.com | Web: www.roadoz.com", LEFT + 60, currY + 17);
    doc.setFont("helvetica", "bold");
    doc.text(`GSTIN: 32AAPCR1988L1ZP | Invoice No: INV-${order.id || "N/A"}`, LEFT + 60, currY + 20);

    currY += 22;

    // ---------------------------------------------------------
    // 2. META BAR (Date, Payment, Pieces, Barcode)
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 18);
    doc.line(LEFT + 55, currY, LEFT + 55, currY + 18); 
    doc.line(LEFT + 85, currY, LEFT + 85, currY + 18); 
    doc.line(LEFT + 110, currY, LEFT + 110, currY + 18); 

    doc.setFontSize(8);
    doc.text("DATE & TIME", LEFT + 2, currY + 5);
    doc.setFontSize(9);
    doc.text(order.created || "N/A", LEFT + 2, currY + 11);
    doc.setFontSize(7);
    doc.text("Type: " + shipmentTypeStr, LEFT + 2, currY + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const payMethod = (order.payment?.method || "TO PAY").toUpperCase();
    doc.text(payMethod, LEFT + 70, currY + 10, { align: "center" });

    const pkgCount = order.packages?.length || order.package_count || 1;
    doc.setFontSize(7);
    doc.text("TOTAL PIECES", LEFT + 87, currY + 5);
    doc.setFontSize(14);
    doc.text(String(pkgCount), LEFT + 97, currY + 13, { align: "center" });

    try {
        const barcodeId = order.id || "ORD-00000";
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, barcodeId, { format: "CODE128", displayValue: true, fontSize: 18, height: 40 });
        const barcodeImg = canvas.toDataURL("image/png");
        doc.addImage(barcodeImg, 'PNG', LEFT + 115, currY + 2, 75, 14);
    } catch (e) {
        doc.text(order.id || "", LEFT + 120, currY + 10);
    }

    currY += 18;

    // ---------------------------------------------------------
    // 3. ROUTE BAR
    // ---------------------------------------------------------
    drawGrid(LEFT, currY, WIDTH, 7);
    doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + 7);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`FROM : ${order.pickup?.city || "N/A"}`, LEFT + 2, currY + 5);
    doc.text(`DESTINATION : ${order.customer?.city || "N/A"}`, LEFT + (WIDTH / 2) + 2, currY + 5);

    currY += 7;

    // ---------------------------------------------------------
    // 4. ADDRESS GRID
    // ---------------------------------------------------------
    const gridH = 32;
    drawGrid(LEFT, currY, WIDTH, gridH);
    doc.line(LEFT + 45, currY, LEFT + 45, currY + gridH); 
    doc.line(LEFT + (WIDTH / 2), currY, LEFT + (WIDTH / 2), currY + gridH); 
    doc.line(LEFT + 140, currY, LEFT + 140, currY + gridH); 

    const rowH = 6.4;
    for (let i = 1; i < 5; i++) {
        doc.line(LEFT, currY + (i * rowH), RIGHT, currY + (i * rowH));
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("CONSIGNOR", LEFT + 2, currY + 4.5);
    doc.text(order.pickup?.name || "N/A", LEFT + 47, currY + 4.5);
    doc.text("CONTACT NO", LEFT + 2, currY + 11);
    doc.text(order.pickup?.phone || "N/A", LEFT + 47, currY + 11);
    doc.text("REFERENCE NO", LEFT + 2, currY + 17.5);
    doc.text(order.reference_no || "Door Delivery", LEFT + 47, currY + 17.5);
    doc.setFont("helvetica", "bold");
    doc.text(`AWB No: ${order.id || "-"}`, LEFT + 2, currY + 24);
    doc.text(`Weight: ${order.weight || "0"} kg`, LEFT + 47, currY + 24);
    doc.text(`Declared Val: ${order.amount || "0"}`, LEFT + 2, currY + 30.5);
    doc.text(`Service: ${order.serviceType || "Standard"}`, LEFT + 47, currY + 30.5);

    doc.setFont("helvetica", "normal");
    doc.text("CONSIGNEE", LEFT + 102, currY + 4.5);
    doc.text(order.customer?.name || "N/A", LEFT + 142, currY + 4.5);
    doc.text("CONTACT NO", LEFT + 102, currY + 11);
    doc.text(order.customer?.phone || "N/A", LEFT + 142, currY + 11);
    doc.text("DISTRICT", LEFT + 102, currY + 17.5);
    doc.text(order.customer?.city || "N/A", LEFT + 142, currY + 17.5);
    doc.text("STATE", LEFT + 102, currY + 24);
    doc.text(order.customer?.state || "KERALA", LEFT + 142, currY + 24);
    doc.text("DELIVERY BY", LEFT + 102, currY + 30.5);
    doc.text(order.creator?.name  || "ROADOZ LOGISTICS", LEFT + 142, currY + 30.5);

    currY += gridH;

    // ---------------------------------------------------------
    // 5. DESCRIPTION & CHARGES (DYNAMIC)
    // ---------------------------------------------------------
    const descH = 42; // Increased height for more charge rows
    drawGrid(LEFT, currY, WIDTH, descH);
    doc.line(LEFT + 150, currY, LEFT + 150, currY + descH); 
    doc.line(LEFT + 172, currY, LEFT + 172, currY + descH); 
    doc.line(LEFT, currY + 6, RIGHT, currY + 6); 

    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTIONS / ITEM NAME", LEFT + 2, currY + 4);
    doc.text("Charges", LEFT + 152, currY + 4);
    doc.text("Amount", RIGHT - 2, currY + 4, { align: "right" });

    // Left side: Items
    doc.setFont("helvetica", "normal");
    const items = order.items || [];
    let itemTextY = currY + 10;
    if (items.length > 0) {
        items.slice(0, 4).forEach((item) => {
            doc.text(`- ${item.product_name} (Qty: ${item.qty || 1})`, LEFT + 2, itemTextY);
            itemTextY += 4;
        });
    } else {
        doc.text(`- ${order.product?.name || "General Goods"}`, LEFT + 2, itemTextY);
    }
    
    // Bank Details (pinned to bottom of grid)
    doc.setFont("helvetica", "bold");
    doc.text("BANK DETAILS:", LEFT + 2, currY + descH - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("HDFC BANK | A/C: 50200116941777 | IFSC: HDFC0002321", LEFT + 2, currY + descH - 4);
    doc.setFontSize(7);

    // --- Right Side: Logic Based Charges ---
    const chargesBody = [];
    const isCOD = payMethod === "COD" || payMethod === "CASH ON DELIVERY";

    // 1. Product Total (Only for COD)
    if (isCOD) {
        const declaredVal = safeParse(order.amount);
        if (declaredVal > 0) chargesBody.push(["Product Total", declaredVal]);
    }

    // 2. Freight
    const freight = safeParse(order.charges?.freight);
    if (freight > 0) chargesBody.push(["Freight", freight]);

    // 3. GST (If not exempt)
    const gst = safeParse(order.charges?.freight_gst);
    if (!order.is_gst_exempt && gst > 0) chargesBody.push(["GST", gst]);

    // 4. Insurance
    const ins = safeParse(order.charges?.insurance);
    if (ins > 0) chargesBody.push(["Insurance", ins]);

    // 5. Regional Area
    const reg = safeParse(order.charges?.regional_area);
    if (reg > 0) chargesBody.push(["Reg. Area", reg]);

    // 6. COD Amount
    const codA = safeParse(order.charges?.cod_amount);
    if (codA > 0) chargesBody.push(["COD Chrg", codA]);

    // 7. To Pay Amount
    const toPay = safeParse(order.charges?.to_pay_amount);
    if (toPay > 0) chargesBody.push(["To Pay Amt", toPay]);

    // 8. Credit Amount
    const credit = safeParse(order.charges?.credit_amount);
    if (credit > 0) chargesBody.push(["Credit Amt", credit]);

    // 9. Prepaid Amount
    const prepaid = safeParse(order.charges?.prepaid_amount);
    if (prepaid > 0) chargesBody.push(["Prepaid Amt", prepaid]);

    // Render Charges
    chargesBody.forEach((c, i) => {
        const rowY = currY + 10 + (i * 4.5);
        if (rowY < currY + descH - 6) {
            doc.text(c[0], LEFT + 152, rowY);
            doc.text(c[1].toFixed(2), RIGHT - 2, rowY, { align: "right" });
            doc.setDrawColor(230);
            doc.line(LEFT + 150, rowY + 1, RIGHT, rowY + 1);
            doc.setDrawColor(0);
        }
    });

    // Grand Total
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", LEFT + 152, currY + descH - 4);
    const totalVal = safeParse(order.charges?.grand_total) || chargesBody.reduce((acc, curr) => acc + curr[1], 0);
    doc.text(`Rs. ${totalVal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, RIGHT - 2, currY + descH - 4, { align: "right" });

    currY += descH;

    // ---------------------------------------------------------
    // 6. TERMS & FOOTER
    // ---------------------------------------------------------
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    const terms = "Terms & conditions: (1) Shipments subject to standard terms. (2) No illegal items allowed. (3) Max liability is Rs 100/- unless insured. (4) Claims must be made within 15 days of delivery.";
    doc.text(doc.splitTextToSize(terms, WIDTH), LEFT, currY + 4);

    const footerY = HALF_H - 12;
    doc.line(LEFT, footerY, LEFT + 45, footerY);
    doc.line(RIGHT - 45, footerY, RIGHT, footerY);
    doc.setFontSize(7);
    doc.text("Receiver Signature", LEFT + 22, footerY + 4, { align: "center" });
    doc.text("Authorized Signatory", RIGHT - 22, footerY + 4, { align: "center" });
};

// --- Export Functions ---

export const generateInvoicePDF = (order) => {
    try {
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        drawInvoice(doc, order);
        doc.save(`Invoice_${order.id || "ROADOZ"}.pdf`);
    } catch (error) {
        console.error("PDF Error:", error);
    }
};

export const generateInvoiceDataUri = (order) => {
    try {
        const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
        drawInvoice(doc, order);
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
            drawInvoice(doc, order);
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
            drawInvoice(doc, order);
        });
        return doc.output('bloburl');
    } catch (error) {
        return null;
    }
};