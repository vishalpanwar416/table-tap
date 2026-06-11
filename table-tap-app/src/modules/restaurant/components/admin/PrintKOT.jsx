import React from 'react';

const PrintKOT = ({ order, kot }) => {
  if (!order) return null;

  const items = kot?.items || order.items || [];
  const printedAt = kot?.created_at || order.created_at;

  return (
    <div
      style={{
        fontFamily: "'Courier New', monospace",
        width: 420,
        margin: 'auto',
        padding: 20,
        color: '#000',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{kot ? `KOT #${kot.kot_number}` : 'KOT'}</h2>
        <p style={{ margin: '4px 0' }}>
          <strong>Order #:</strong> {order.order_number || order.id.slice(0, 8)}
        </p>
        <p style={{ margin: '4px 0' }}>
          <strong>Table:</strong> T{order.table_number}
        </p>
        <p style={{ margin: '4px 0' }}>
          <strong>Date:</strong> {new Date(printedAt).toLocaleString()}
        </p>
        <hr />
      </div>

      {/* Items List */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th align="left">Item</th>
            <th align="right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '4px 0' }}>{item.name}</td>
              <td align="right" style={{ padding: '4px 0' }}>
                {item.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Special Instructions */}
      {order.special_instructions && (
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <strong>Special Instructions:</strong>
          <p>{order.special_instructions}</p>
        </div>
      )}
    </div>
  );
};

export default PrintKOT;
