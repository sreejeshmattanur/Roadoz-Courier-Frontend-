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
// SAFE PDF DOWNLOAD (VERCEL FIX)
// ─────────────────────────────────────────────────────────────
function downloadPDF(doc, filename) {
  try {
    console.log("DOWNLOADING PDF");

    const blob = doc.output("blob");

    const url = URL.createObjectURL(blob);

    // OPEN PDF
    window.open(url);

    // DOWNLOAD PDF
    const link = document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
  }
}

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

  height += 40;

  height += 9;

  height += 12;

  height += 8;

  height += 5;

  const productName = order.items?.[0]?.product_name || "Item";

  const productLines = Math.ceil(productName.length / 22);

  height += productLines * 3 + 6;

  const footerText = [
    pickup.nickname,
    pickup.address_line_1,
    pickup.address_line_2,
    pickup.city,
    pickup.state,
    pickup.pincode,
  ]
    .filter(Boolean)
    .join(" ");

  const footerLines = Math.ceil(footerText.length / 45);

  height += footerLines * 3 + 16;

  return Math.max(MIN_PH, height + 5);
}

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────
export function generateShippingLabel(orders) {
  try {
    console.log("GENERATE SHIPPING LABEL CALLED");

    if (!orders?.length) {
      console.log("NO ORDERS FOUND");
      return;
    }

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

      drawLabel(doc, order);
    });

    downloadPDF(doc, "shipping_labels.pdf");
  } catch (error) {
    console.error("GENERATE SHIPPING LABEL ERROR:", error);
  }
}

// ─────────────────────────────────────────────────────────────
// DRAW LABEL
// ─────────────────────────────────────────────────────────────
function drawLabel(doc, order) {
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

  doc.setTextColor(0, 0, 0);

  doc.text("Roadoz Courier", LEFT + 2.5, currentY + 9);

  doc.setFontSize(5);

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

  const barcodeHeight = 40;

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

  doc.text(`AWB No: ${awbNo}`, PW / 2, currentY + 13, {
    align: "center",
  });

  doc.text("PCS #: 1", PW / 2, currentY + 18, {
    align: "center",
  });

  // ============================================================
  // BARCODE
  // ============================================================

  try {
    console.log("GENERATING BARCODE");

    const canvas = document.createElement("canvas");

    const barcodeGenerator = JsBarcode.default || JsBarcode;

    barcodeGenerator(canvas, awbNo, {
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
      currentY + 20,
      RIGHT - LEFT - 12,
      16,
    );
  } catch (err) {
    console.error("BARCODE ERROR:", err);

    doc.setFontSize(10);

    doc.text("BARCODE FAILED", PW / 2, currentY + 28, {
      align: "center",
    });
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
}
