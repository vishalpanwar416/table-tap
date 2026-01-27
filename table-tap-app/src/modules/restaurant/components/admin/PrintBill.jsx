import React from "react";

const PrintBill = ({ order, restaurant }) => {
  if (!order || !restaurant) return null;

  return (
    <div style={{
      fontFamily: "'Courier New', monospace",
      width: 320,
      margin: "auto",
      padding: 10,
      color: "#000"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h2>{restaurant.name}</h2>
        <p>{restaurant.address}</p>
        <p>GST: {restaurant.gst_number}</p>
        <p>FSSAI: {restaurant.fssai_license}</p>
        <p>Phone: {restaurant.contact_phone}</p>
        <hr />
      </div>

      {/* Order Info */}
      <div style={{ fontSize: 12 }}>
        <p><strong>Customer:</strong> {order.customer_name || "Guest"}</p>
        <p><strong>Order #:</strong> {order.id.slice(0, 8)}</p>
        <p><strong>Table:</strong> T{order.table_number}</p>
        <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
        <p><strong>Cashier:</strong> Online</p>
        <p><strong>Payment Mode:</strong> {order.payment_method?.toUpperCase()}</p>
      </div>

      {/* Items */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 10 }}>
        <thead>
          <tr>
            <th align="left">Item</th>
            <th align="center">Qty</th>
            <th align="right">Amt</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>{item.name}</td>
              <td align="center">{item.quantity}</td>
              <td align="right">₹{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ fontSize: 13, textAlign: "right", marginTop: 10 }}>
        <p>Subtotal: ₹{order.subtotal.toFixed(2)}</p>
        {order.discount > 0 && <p>Discount: -₹{order.discount.toFixed(2)}</p>}
        <p>SGST 2.5%: ₹{(order.gst / 2).toFixed(2)}</p>
        <p>CGST 2.5%: ₹{(order.gst / 2).toFixed(2)}</p>
        {order.deliveryFee > 0 && (
          <p>Delivery Fee: ₹{order.deliveryFee.toFixed(2)}</p>
        )}
        <p><strong>Total: ₹{order.total.toFixed(2)}</strong></p>
      </div>

      {/* Notes */}
      {order.special_instructions && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <strong>Note:</strong>
          <p>{order.special_instructions}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 12, fontSize: 13 }}>
        <p><strong>Thank you for dining with us!</strong></p>
      </div>
    </div>
  );
};

export default PrintBill;
