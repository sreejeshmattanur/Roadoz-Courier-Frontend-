export const mapOrderToInvoice = (order, formatDate, invoice = null) => {
  return {
    id: order.order_number,

    invoiceNo: order.invoicenumber ? `INV-${order.invoicenumber}` : `INV-${order.order_number}`,

    amount: order.amount || null,

    awb: order.order_shipment || "AWB_PENDING",

    created: formatDate(order.created_at),

    pickup: {
      name: order.pickup_address?.contact_name || "Sender",

      address1: order.pickup_address?.address_line_1 || "",

      address2: order.pickup_address?.address_line_2 || "",

      city: `${order.pickup_address?.city || ""}, ${
        order.pickup_address?.state || ""
      } - ${order.pickup_address?.pincode || ""}`,

      phone: order.pickup_address?.phone || "",
    },

    customer: {
      name: order.consignee?.name || "",

      address1: order.consignee?.address_line_1 || "",

      address2: order.consignee?.address_line_2 || "",

      city: `${order.consignee?.city || ""}, ${
        order.consignee?.state || ""
      } - ${order.consignee?.pincode || ""}`,

      phone: order.consignee?.mobile || "",
    },

    shipmentType: order.order_type || "B2C",

    riskType: order.rov || "Owner Risk",

    serviceType: order.service_type || "Surface",

    totalBoxes: order.packages?.[0]?.count || 1,

    is_gst_exempt: order.is_gst_exempt || false,

    product: {
      name: order.items?.[0]?.product_name || "Product",
      sku: order.items?.[0]?.sku || "SKU",
      unit_price: order.items?.[0]?.unit_price || 0,
      qty: order.items?.[0]?.qty || 1,
      package_index: order.items?.[0]?.package_index || 1,
      value: order.items?.[0]?.total || 0,
    },

    items: order.items || [],

    packages: order.packages || [],

    weight: `${order.weight_summary?.total_weight_kg || 0} KG`,

    dims: `${order.packages?.[0]?.length_cm || 0} x ${
      order.packages?.[0]?.breadth_cm || 0
    } x ${order.packages?.[0]?.height_cm || 0} cm`,

    charges: {
      freight: order.freight_charge,

      freight_gst: order.freight_gst,

      total_freight: order.total_freight,
      
      insurance: order.insurance || order.insurance_charge || order.insurance_charges || invoice?.invoice_orders?.[0]?.insurance_charges || 0,
      
      regional_area: order.regional_area || order.regional_charge || invoice?.invoice_orders?.[0]?.regional_area || 0,

      subtotal: order.order_value || 0,

      gst: (
        Number(order.order_value || 0) * 0.18
      ).toFixed(2),
    },

    payment: {
      method: order.payment_method || "",

      total: (
        Number(order.order_value || 0) * 1.18
      ).toFixed(2),
    },
  };
};