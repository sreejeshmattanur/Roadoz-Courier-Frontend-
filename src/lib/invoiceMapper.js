export const mapOrderToInvoice = (order, formatDate, invoice = null) => {
  return {
    id: order.order_number,

    invoiceNo: `INV-${order.order_number}`,

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

    totalBoxes: order.packages?.[0]?.count || 1,

    product: {
      name: order.items?.[0]?.product_name || "Product",
      sku: order.items?.[0]?.sku || "SKU",
      qty: order.items?.[0]?.qty || 1,
      value: order.items?.[0]?.total || 0,
    },

    items: order.items || [],

    weight: `${order.weight_summary?.total_weight_kg || 0} KG`,

    dims: `${order.packages?.[0]?.length_cm || 0} x ${
      order.packages?.[0]?.breadth_cm || 0
    } x ${order.packages?.[0]?.height_cm || 0} cm`,

    charges: {
      freight: order.freight_charge || invoice?.invoice_orders?.[0]?.base_freight || invoice?.invoice_orders?.[0]?.freight_charge || order.shipping_charge || 0,

      freight_gst: order.freight_gst || invoice?.invoice_orders?.[0]?.freight_gst || invoice?.tax_amount || 0,

      total_freight: order.total_freight || invoice?.invoice_orders?.[0]?.total_freight || invoice?.total_amount || 0,

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