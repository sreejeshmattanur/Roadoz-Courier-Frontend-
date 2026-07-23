/**
 * Utility to generate and print the Trip Sheet Statement
 * Fixed: Image path resolution for new windows
 */
import roadozLogo from "../assets/images/RO-2.png";

export const generateTripSheetPrint = (data) => {
  if (!data) return;

  const printWindow = window.open("", "_blank");

  // Format date
  const tripDate = new Date(data.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Ensure logo path is absolute so the new window can find it
  const absoluteLogoPath = roadozLogo.startsWith('data:') 
    ? roadozLogo 
    : `${window.location.origin}${roadozLogo}`;

  // Map orders to table rows
  const rows = data.orders.map((order, index) => {
    let type = "ACC";
    if (order.payment_method === "Prepaid") type = "PD";
    if (order.payment_method === "To Pay") type = "TP";
    if (order.payment_method === "COD") type = "COD";
    if (order.payment_method === "RTO") type = "RTO";
    if (order.payment_method === "Credit") type = "CRD";

    const consignerHtml = `
      <div style="font-weight: bold; font-size: 9px;">${(order.pickup_address?.contact_name || 'N/A').toUpperCase()}</div>
      <div style="font-size: 8px; color: #333;">${order.pickup_address?.address_line_1 || ''}, ${order.pickup_address?.city || ''}</div>
    `;

    const consigneeHtml = `
      <div style="font-weight: bold; font-size: 9px;">${(order.consignee?.name || 'N/A').toUpperCase()}</div>
      <div style="font-size: 8px; color: #333;">${order.consignee?.address_line_1 || ''}, ${order.consignee?.city || ''}</div>
    `;

    return `
      <tr>
        <td style="text-align:center">${index + 1}</td>
        <td>${tripDate}</td>
        <td style="font-weight:bold; font-size: 10px;">${order.order_number}</td>
        <td>${consignerHtml}</td>
        <td>${consigneeHtml}</td>
        <td>${(order.consignee?.city || '').toUpperCase()}</td>
        <td style="text-align:center">${order.sl_no || '-'}</td>
        <td style="text-align:center; font-weight:bold;">${type}</td>
        <td style="text-align:center; font-weight:bold">${order.total_boxes}</td>
        <td style="text-align:right">${Number(order.total_freight).toFixed(2)}</td>
        <td style="text-align:center">0</td>
        <td style="text-align:center">0</td>
        <td style="text-align:right; font-weight:bold">${Number(order.total_freight).toFixed(2)}</td>
        <td></td>
      </tr>
    `;
  }).join("");

  const htmlContent = `
    <html>
      <head>
        <title>Trip Manifest - DISP${data.id.split('-')[0].toUpperCase()}</title>
        <style>
          @page { size: A4 landscape; margin: 5mm; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10px; 
            color: #000; 
            margin: 0; 
            padding: 10px;
          }
          .container { width: 100%; }
          .header-table {
            width: 100%;
            border: 2px solid #000;
            margin-bottom: 8px;
            border-collapse: collapse;
          }
          .header-table td { padding: 8px; vertical-align: middle; }
          .logo-box { width: 15%; text-align: left; }
          .logo-box img { height: 45px; width: auto; display: block; }
          .title-box { text-align: center; width: 65%; }
          .title-box h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
          .title-box p { margin: 4px 0 0 0; font-weight: bold; font-size: 13px; color: #222; }
          .meta-box { width: 20%; text-align: right; line-height: 1.5; font-size: 11px; }
          .main-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          .main-table th, .main-table td { 
            border: 1px solid #000; 
            padding: 4px 3px; 
            font-size: 9px; 
            word-wrap: break-word;
          }
          .main-table th { 
            background-color: #efefef; 
            text-transform: uppercase; 
            font-size: 8px;
            font-weight: bold;
          }
          .summary-wrapper {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            margin-top: 10px;
            border: 1px solid #000;
          }
          .summary-item { padding: 8px; border-right: 1px solid #000; }
          .summary-item:last-child { border-right: none; }
          .summary-item b { font-size: 11px; text-decoration: underline; display: block; margin-bottom: 4px; }
          .footer-section { margin-top: 30px; display: flex; justify-content: space-between; }
          .sig-container { width: 200px; text-align: center; }
          .sig-line {
            margin-top: 35px;
            border-top: 1px solid #000;
            padding-top: 4px;
            font-weight: bold;
            font-size: 10px;
          }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="container">
          <table class="header-table">
            <tr>
              <td class="logo-box">
                <img src="${absoluteLogoPath}" alt="Roadoz Logo" />
              </td>
              <td class="title-box">
                <h1>Delivery & Collection Statement</h1>
                <p>${(data.franchise?.name || 'MAIN OFFICE').toUpperCase()} TO ${(data.destination_franchise?.name || 'DESTINATION HUB').toUpperCase()}</p>
              </td>
              <td class="meta-box">
                <b>MANIFEST ID:</b> DISP${data.id.split('-')[0].toUpperCase()}<br>
                <b>DATE:</b> ${tripDate}<br>
                <b>VEHICLE:</b> ${data.vehicle?.plate_number || 'N/A'}
              </td>
            </tr>
          </table>

          <table class="main-table">
            <thead>
              <tr>
                <th width="25">SL</th>
                <th width="60">DATE</th>
                <th width="85">LR NO</th>
                <th>CONSIGNER & ADDRESS</th>
                <th>CONSIGNEE & ADDRESS</th>
                <th width="80">DESTINATION</th>
                <th width="35">INV</th>
                <th width="30">TYPE</th>
                <th width="30">BOX</th>
                <th width="55">FREIGHT</th>
                <th width="30">TA</th>
                <th width="25">BD</th>
                <th width="55">BALANCE</th>
                <th width="80">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="summary-wrapper">
            <div class="summary-item">
              <b>TOTAL MANIFEST</b>
              Freight: ${Number(data.total_freight || 0).toFixed(2)}<br>
              Total Boxes: ${data.total_packages || 0}
            </div>
            <div class="summary-item">
              <b>TOPAY (TP)</b>
              Freight: ${Number(data.topay_freight || 0).toFixed(2)}<br>
              Boxes: ${data.topay_packages || 0}
            </div>
            <div class="summary-item">
              <b>PREPAID (PD)</b>
              Freight: ${Number(data.prepaid_freight || 0).toFixed(2)}<br>
              Boxes: ${data.prepaid_packages || 0}
            </div>
            <div class="summary-item">
              <b>ACCOUNT (ACC)</b>
              Freight: ${Number(data.credit_freight || 0).toFixed(2)}<br>
              Boxes: ${data.credit_packages || 0}
            </div>
          </div>

          <div class="footer-section">
            <div class="sig-container">
              <div class="sig-line">Dispatched By</div>
              <p style="margin:4px 0;">SREERAG A</p>
            </div>
            <div class="sig-container">
              <div class="sig-line">Driver's Signature</div>
              <p style="margin:4px 0;">(${data.driver?.first_name || 'N/A'})</p>
            </div>
            <div class="sig-container">
              <div class="sig-line">Received By / Authorized Sign</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            // Give the image a moment to load before triggering print
            setTimeout(function() {
              window.print();
            }, 700);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};