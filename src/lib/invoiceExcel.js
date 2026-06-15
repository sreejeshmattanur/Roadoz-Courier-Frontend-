import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const downloadInvoiceExcel = (data) => {
  const orders = Array.isArray(data) ? data : [data];

  const invoiceData = orders.map((order) => ({
    "Order Number": order.order_number || "",
    "Transaction ID": order.id || "",
    "Order Type": order.order_type || "",
    "Status": order.status || "",
    "Created At": order.created_at || "",
    "Updated At": order.updated_at || "",
    
    // Consignee Details
    "Consignee Name": order.consignee?.name || "",
    "Consignee Mobile": order.consignee?.mobile || "",
    "Consignee Alt Mobile": order.consignee?.alternate_mobile || "",
    "Consignee Email": order.consignee?.email || "",
    "Consignee Address 1": order.consignee?.address_line_1 || "",
    "Consignee Address 2": order.consignee?.address_line_2 || "",
    "Consignee City": order.consignee?.city || "",
    "Consignee State": order.consignee?.state || "",
    "Consignee Pincode": order.consignee?.pincode || "",

    // Pickup Details
    "Pickup Nickname": order.pickup_address?.nickname || "",
    "Pickup Contact": order.pickup_address?.contact_name || "",
    "Pickup Phone": order.pickup_address?.phone || "",
    "Pickup Email": order.pickup_address?.email || "",
    "Pickup Address 1": order.pickup_address?.address_line_1 || "",
    "Pickup Address 2": order.pickup_address?.address_line_2 || "",
    "Pickup City": order.pickup_address?.city || "",
    "Pickup State": order.pickup_address?.state || "",
    "Pickup Pincode": order.pickup_address?.pincode || "",

    // Financials
    "Payment Method": order.payment_method || "",
    "Order Value": order.order_value || 0,
    "COD Amount": order.cod_amount || 0,
    "To Pay Amount": order.to_pay_amount || 0,
    "Base Freight": order.base_freight || 0,
    "Fuel Surcharge": order.fuel_surcharge || 0,
    "GST Amount": order.gst_amount || 0,
    "Shipping Charge": order.shipping_charge || 0,

    // Items
    "Items (Qty x Name)": order.items?.map(i => `${i.qty}x ${i.product_name}`).join(", ") || "",

    // Package details
    "Total Weight (kg)": order.weight_summary?.total_weight_kg || 0,
    "Volumetric Weight (kg)": order.weight_summary?.total_vol_weight_kg || 0,
    "Applicable Weight (kg)": order.weight_summary?.applicable_weight_kg || 0,
    "Total Boxes": order.weight_summary?.total_boxes || 0,

    // Misc
    "ROV": order.rov || "",
    "GST Number": order.gst_number || "",
    "Eway Bill Number": order.eway_bill_number || "",
    "Created By": order.created_by || "",
    "Franchise ID": order.franchise_id || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(invoiceData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = orders.length === 1 && orders[0].order_number 
    ? `${orders[0].order_number}.xlsx` 
    : "Orders_Export.xlsx";

  saveAs(file, fileName);
};
