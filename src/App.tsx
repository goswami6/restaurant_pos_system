import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api";

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = () => {
  setLoading(true);

    fetch(`${API_URL}/orders`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setOrders(data.data);
        }
      })
      .catch((err) => console.error("API Error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Start Order API
  const updateOrderStatus = (order) => {

  let newStatus = "";

  if (order.order_status === "PENDING") {
    newStatus = "PREPARING";
  } 
  else if (order.order_status === "PREPARING") {
    newStatus = "READY";
  } 
  else {
    return;
  }

  setLoading(true);

  fetch(`${API_URL}/order/update-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: order.id,
      order_status: newStatus,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      fetchOrders();
    })
    .catch((err) => console.error("Update Error:", err))
    .finally(() => setLoading(false));
};
  return (
    <div className="container">
      <h1 className="title">🍳 Kitchen Orders</h1>
{loading && <div className="loader"></div>}
      <div className="orders-grid">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <h3>Order #{order.id}</h3>
            <p>Type: {order.order_type}</p>

            <ul>
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} x{item.quantity}
                  {item.variant_name && ` (${item.variant_name})`}
                  {item.addon_name && ` + ${item.addon_name}`}
                </li>
              ))}
            </ul>

            <button
            className="start-btn"
            disabled={order.order_status === "READY"}
            onClick={() => updateOrderStatus(order)}
          >
            {order.order_status === "PENDING" && "Start"}
            {order.order_status === "PREPARING" && "Mark Ready"}
            {order.order_status === "READY" && "Completed"}
          </button>
              
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;