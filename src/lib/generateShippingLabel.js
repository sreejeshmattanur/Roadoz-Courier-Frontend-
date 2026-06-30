import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

// ─────────────────────────────────────────────────────────────
// PAGE WIDTH
// ─────────────────────────────────────────────────────────────
const PW = 112.89;
const MIN_PH = 134.48;

// ─────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────
const LEFT = 1.5;
const RIGHT = 111.2;
const MID = 54.5;

const COL_RATE = 27.5;
const COL_QTY = 54.5;
const COL_TOTAL = 81;

const TX = {
  left: 2.5,
  fromX: 3,
  toX: 56,
  rateX: 29,
  qtyX: 56,
  totalX: 82,
};

// ─────────────────────────────────────────────────────────────
// CALCULATE DYNAMIC HEIGHT
// ─────────────────────────────────────────────────────────────
function calculateLabelHeight(order) {
  const pickup = order.pickup_address || {};
  const consignee = order.consignee || {};

  let height = 0;

  height += 16;

  const addressLines = [
    pickup.contact_name,
    pickup.address_line_1,
    pickup.address_line_2,
    pickup.city,
    pickup.state,
    pickup.pincode,
    consignee.name,
    consignee.address_line_1,
    consignee.address_line_2,
    consignee.city,
    consignee.state,
    consignee.pincode,
  ].filter(Boolean).length;

  height += Math.max(30, addressLines * 3 + 12);

  // Increased barcode section height
  height += 40;

  height += 9;

  height += 12;

  height += 8;

  height += 5;

  const items = order.items?.length > 0 ? order.items : [{ product_name: "Item" }];

  let productsHeight = 0;
  items.forEach(item => {
    const productName = item.product_name || "Item";
    const productLines = Math.max(1, Math.ceil(productName.length / 22));
    productsHeight += productLines * 3 + 4;
  });

  height += productsHeight + 2;

  const footerText = "Roadoz pvt Ltd , 1st Floor, A..., 1st main koramangala, 1st Block Bengaluru, 560034";

  const footerLines = Math.ceil(footerText.length / 45);

  height += footerLines * 3 + 16;

  return Math.max(MIN_PH, height + 5);
}

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────
export function generateShippingLabel(orders, returnDoc = false) {
  if (!orders?.length) return;

  const firstHeight = calculateLabelHeight(orders[0]);

  const doc = new jsPDF({
    unit: "mm",
    format: [PW, firstHeight],
    orientation: "portrait",
  });

  orders.forEach((order, index) => {
    const pageHeight = calculateLabelHeight(order);

    if (index > 0) {
      doc.addPage([PW, pageHeight], "portrait");
    }

    drawLabel(doc, order, pageHeight);
  });

  if (returnDoc) {
    return doc;
  }
  doc.save("shipping_labels.pdf");
}

// ─────────────────────────────────────────────────────────────
// DRAW LABEL
// ─────────────────────────────────────────────────────────────
function drawLabel(doc, order, pageHeight) {
  const LW = 0.22;

  doc.setLineWidth(LW);

  const pickup = order.pickup_address || {};
  const consignee = order.consignee || {};

  let currentY = 1.5;

  // ============================================================
  // HEADER
  // ============================================================

  const headerHeight = 16;

  doc.rect(LEFT, currentY, RIGHT - LEFT, headerHeight);

  doc.line(MID, currentY, MID, currentY + headerHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  // black color
  doc.setTextColor(0, 0, 0);

  doc.text("Roadoz Courier", LEFT + 2.5, currentY + 9);

  // Optional subtitle
  doc.setFontSize(5);
  doc.setTextColor(0, 0, 0);

  doc.text("LOGISTICS AND COURIER SERVICES", LEFT + 2.5, currentY + 13);

  currentY += headerHeight;

  // ============================================================
  // ADDRESS SECTION
  // ============================================================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  const fromLines = [
    pickup.contact_name || "",
    pickup.address_line_1 || "",
    pickup.address_line_2 || "",
    [pickup.city, pickup.state, pickup.pincode].filter(Boolean).join(", ") +
      ", India",
    `GSTIN: ${pickup.gst_number || order.gst_number || ""}`,
  ];

  const toPhone = consignee.mobile || order.customer?.phone || "";

  const toLines = [
    `${consignee.name || ""} (Mobile No: ${toPhone})`,
    consignee.address_line_1 || "",
    consignee.address_line_2 || "",
    [consignee.city, consignee.state, consignee.pincode]
      .filter(Boolean)
      .join(", ") + ", India",
  ];

  const leftWrapped = [];
  fromLines.forEach((line) => {
    leftWrapped.push(...doc.splitTextToSize(line, MID - LEFT - 4));
  });

  const rightWrapped = [];
  toLines.forEach((line) => {
    rightWrapped.push(...doc.splitTextToSize(line, RIGHT - MID - 4));
  });

  const lineHeight = 3;

  const addressHeight =
    Math.max(leftWrapped.length, rightWrapped.length) * lineHeight + 12;

  doc.rect(LEFT, currentY, RIGHT - LEFT, addressHeight);

  doc.line(MID, currentY, MID, currentY + addressHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text("From", TX.fromX, currentY + 5);

  doc.line(TX.fromX, currentY + 5.5, TX.fromX + 7, currentY + 5.5);

  doc.text("To", TX.toX, currentY + 5);

  doc.line(TX.toX, currentY + 5.5, TX.toX + 4, currentY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  leftWrapped.forEach((line, i) => {
    doc.text(line, TX.fromX, currentY + 10 + i * lineHeight);
  });

  rightWrapped.forEach((line, i) => {
    doc.text(line, TX.toX, currentY + 10 + i * lineHeight);
  });

  currentY += addressHeight;

  // ============================================================
  // BARCODE SECTION
  // ============================================================

  const barcodeHeight = 60;

  doc.rect(LEFT, currentY, RIGHT - LEFT, barcodeHeight);

  const awbNo = String(
    order.order_shipment ||
      order.shipment?.id ||
      order.order_number ||
      order.id ||
      "00000000",
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(`Ref No: ${awbNo}`, PW / 2, currentY + 6, {
    align: "center",
  });

  doc.text("PCS #: 1", PW / 2, currentY + 12, {
    align: "center",
  });

  // USE BARCODE IMAGE FROM API RESPONSE
  try {
    let barcodeBase64 = order.barcode || "";

    if (barcodeBase64) {
      barcodeBase64 = barcodeBase64.replace(/^data:image\/png;base64,/, "");

      const barcodeImage = `data:image/png;base64,${barcodeBase64}`;

      doc.addImage(
        barcodeImage,
        "PNG",
        LEFT + 6,
        currentY + 16,
        RIGHT - LEFT - 12,
        40,
      );
    } else {
      // fallback barcode generation
      const canvas = document.createElement("canvas");

      JsBarcode(canvas, awbNo, {
        format: "CODE128",
        displayValue: true,
        fontSize: 16,
        height: 70,
        width: 2,
        margin: 0,
      });

      const generatedBarcode = canvas.toDataURL("image/png");

      doc.addImage(
        generatedBarcode,
        "PNG",
        LEFT + 6,
        currentY + 16,
        RIGHT - LEFT - 12,
        40,
      );
    }
  } catch (err) {
    console.error("Barcode render failed", err);
  }

  currentY += barcodeHeight;

  // ============================================================
  // PAYMENT SECTION
  // ============================================================

  const paymentHeight = 9;

  doc.rect(LEFT, currentY, RIGHT - LEFT, paymentHeight);

  doc.line(MID, currentY, MID, currentY + paymentHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);

  doc.text(
    (order.payment_method || "PREPAID").toUpperCase(),
    TX.left,
    currentY + 5,
  );

  doc.setFont("helvetica", "normal");

  doc.text(
    `Order: # ${order.order_number || order.id || ""}`,
    MID + 2,
    currentY + 5,
  );

  currentY += paymentHeight;

  // ============================================================
  // SELLER HEADER
  // ============================================================

  const sellerHeaderHeight = 5;

  doc.rect(LEFT, currentY, RIGHT - LEFT, sellerHeaderHeight);

  doc.line(COL_QTY, currentY, COL_QTY, currentY + sellerHeaderHeight);

  doc.line(COL_TOTAL, currentY, COL_TOTAL, currentY + sellerHeaderHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);

  doc.text("Seller", TX.left, currentY + 3.5);

  doc.text("Invoice No", COL_QTY + 1, currentY + 3.5);

  doc.text("Date", COL_TOTAL + 1, currentY + 3.5);

  currentY += sellerHeaderHeight;

  // ============================================================
  // SELLER DATA
  // ============================================================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);

  const sellerLines = doc.splitTextToSize(
    pickup.contact_name || "Seller",
    COL_QTY - LEFT - 3,
  );

  const sellerHeight = sellerLines.length * 3 + 3;

  doc.rect(LEFT, currentY, RIGHT - LEFT, sellerHeight);

  doc.line(COL_QTY, currentY, COL_QTY, currentY + sellerHeight);

  doc.line(COL_TOTAL, currentY, COL_TOTAL, currentY + sellerHeight);

  sellerLines.forEach((line, i) => {
    doc.text(line, TX.left, currentY + 4 + i * 3);
  });

  const invoiceDate = formatDate(order.created_at);
  const displayInvoiceNo = order.invoicenumber ? `INV-${order.invoicenumber}` : `INV-${order.order_number || order.id || "N/A"}`;

  doc.text(displayInvoiceNo, COL_QTY + 1, currentY + 4);
  doc.text(invoiceDate, COL_TOTAL + 1, currentY + 4);

  currentY += sellerHeight;

  // ============================================================
  // INVOICE ROW
  // ============================================================

  const invoiceHeight = 8;

  doc.rect(LEFT, currentY, RIGHT - LEFT, invoiceHeight);

  doc.setFontSize(5.7);

  doc.text(
    `Invoice Date : ${invoiceDate}`,
    TX.left,
    currentY + 3,
  );

  doc.text(
    `GSTIN No: ${pickup.gst_number || order.gst_number || ""}`,
    TX.left,
    currentY + 6,
  );

  currentY += invoiceHeight;

  // ============================================================
  // PRODUCT HEADER
  // ============================================================

  const productHeaderHeight = 5;

  doc.rect(LEFT, currentY, RIGHT - LEFT, productHeaderHeight);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);

  doc.text("Product Name", TX.left, currentY + 3.5);

  doc.text("Rate", TX.rateX, currentY + 3.5);

  doc.text("Qty", TX.qtyX, currentY + 3.5);

  doc.text("Total", TX.totalX, currentY + 3.5);

  currentY += productHeaderHeight;

  // ============================================================
  // PRODUCT ROW
  // ============================================================

  const items =
    order.items?.length > 0
      ? order.items
      : [
          {
            product_name: "Item",
            unit_price: order.order_value || 0,
            qty: 1,
            total: order.order_value || 0,
          },
        ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);

  let totalProductsHeight = 0;
  const itemsRenderData = [];

  items.forEach((item) => {
    let nameStr = String(item.product_name || "");
    if (!nameStr) nameStr = "Item";
    const productLines = doc.splitTextToSize(
      nameStr,
      COL_RATE - LEFT - 2,
    );
    const productHeight = productLines.length * 3 + 4;
    totalProductsHeight += productHeight;
    itemsRenderData.push({ item, productLines, productHeight });
  });

  doc.rect(LEFT, currentY, RIGHT - LEFT, totalProductsHeight);

  doc.line(
    COL_RATE,
    currentY - productHeaderHeight,
    COL_RATE,
    currentY + totalProductsHeight,
  );

  doc.line(
    COL_QTY,
    currentY - productHeaderHeight,
    COL_QTY,
    currentY + totalProductsHeight,
  );

  doc.line(
    COL_TOTAL,
    currentY - productHeaderHeight,
    COL_TOTAL,
    currentY + totalProductsHeight,
  );

  let tempY = currentY;
  itemsRenderData.forEach(({ item, productLines, productHeight }, index) => {
    productLines.forEach((line, i) => {
      doc.text(line, TX.left, tempY + 4 + i * 3);
    });

    doc.text(String(item.unit_price || ""), TX.rateX, tempY + 4);

    doc.text(String(item.qty || ""), TX.qtyX, tempY + 4);

    doc.text(String(item.total || ""), TX.totalX, tempY + 4);

    if (index < itemsRenderData.length - 1) {
      doc.line(LEFT, tempY + productHeight, RIGHT, tempY + productHeight);
    }

    tempY += productHeight;
  });

  currentY += totalProductsHeight;

  // ============================================================
  // TOTAL VALUE ROW
  // ============================================================
  let totalValue = 0;
  let totalDeclaredValue = 0;
  if (order.items && order.items.length > 0) {
    totalDeclaredValue = order.items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  } else {
    totalDeclaredValue = Number(order.order_value) || 0;
  }
  totalValue += totalDeclaredValue;

  if (!order.is_gst_exempt) {
    totalValue += Number(order.total_freight) || 0;
  }
  
  totalValue += Number(order.insurance) || Number(order.insurance_charge) || Number(order.insurance_charges) || 0;
  totalValue += Number(order.regional_area) || Number(order.regional_charge) || 0;

  const totalRowHeight = 5;
  doc.rect(LEFT, currentY, RIGHT - LEFT, totalRowHeight);
  doc.line(COL_TOTAL, currentY, COL_TOTAL, currentY + totalRowHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.text("Total Value:", TX.qtyX, currentY + 3.5);
  doc.text(String(`Rs. ${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`), TX.totalX, currentY + 3.5);
  
  currentY += totalRowHeight;

  // ============================================================
  // FOOTER
  // ============================================================

  const returnAddr = "Roadoz pvt Ltd , 1st Floor, A..., 1st main koramangala, 1st Block Bengaluru, 560034";
  const mobileNo = "9496630687";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.2);

  const noteLines = doc.splitTextToSize(
    `${returnAddr} Mobile: ${mobileNo}`,
    RIGHT - LEFT - 4,
  );

  const complaintLines = doc.splitTextToSize(
    `For complaints & queries please contact ${mobileNo}`,
    RIGHT - LEFT - 4,
  );

  const footerHeight =
    5 + noteLines.length * 2.8 + complaintLines.length * 2.8 + 4;

  doc.rect(LEFT, currentY, RIGHT - LEFT, footerHeight);

  doc.text("NOTE: If undelivered return to:", TX.left, currentY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.8);

  let footerY = currentY + 6;

  noteLines.forEach((line) => {
    doc.text(line, TX.left, footerY);
    footerY += 2.8;
  });

  doc.setFont("helvetica", "bold");

  complaintLines.forEach((line) => {
    doc.text(line, TX.left, footerY);
    footerY += 2.8;
  });
}

// ─────────────────────────────────────────────────────────────
// DATE FORMATTER
// ─────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();

  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join("/");
}
