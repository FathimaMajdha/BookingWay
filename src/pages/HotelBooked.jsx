import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../Components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HotelBooked = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hotel, room, policies } = location.state || {};

  const [guest, setGuest] = useState({
    name: "",
    email: "",
    phone: "",
  });

  if (!hotel || !room) {
    return (
      <div className="container py-5 text-center">
        <Navbar />
        <h4>No booking details found!</h4>
      </div>
    );
  }

  const totalAmount = room.Price + Math.round(room.Price * 0.12);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async () => {
    if (!guest.name || !guest.email || !guest.phone) {
      toast.error("Please fill in all guest details!");
      return;
    }

    try {
      const bookingResponse = await axiosInstance.post("/HotelBooking", {
        HotelId: hotel.HotelId,
        RoomId: room.RoomId,
        HotelName: hotel.Hotel_Name,
        GuestName: guest.name,
        GuestEmail: guest.email,
        GuestPhone: guest.phone,
        TotalAmount: totalAmount,
      });

      const bookingId = bookingResponse.data.InsertedId;
      const orderResponse = await axiosInstance.post("/payment/create-order", {
        Amount: totalAmount,
        BookingId: bookingId,
      });

      const { OrderId, Key } = orderResponse.data;

      const options = {
        key: Key,
        order_id: OrderId,
        amount: totalAmount * 100,
        currency: "INR",
        name: "Hotel Booking",
        description: `${hotel.Hotel_Name}, ${hotel.City}`,
        handler: async function (response) {
          try {
            const verifyResponse = await axiosInstance.put(`/HotelBooking/${bookingId}`, {
              RazorpayOrderId: response.razorpay_order_id,
              RazorpayPaymentId: response.razorpay_payment_id,
              RazorpaySignature: response.razorpay_signature,
              PaymentStatus: "Paid",
            });

            if (verifyResponse.status === 200) {
              toast.success("Payment successful!");
              navigate("/bookings", {
                state: { hotel, room, guest, totalAmount },
              });
            } else {
              toast.error("Payment verification failed!");
            }
          } catch (err) {
            console.error(err);
            toast.error("Payment verification error!");
          }
        },
        prefill: {
          name: guest.name,
          email: guest.email,
          contact: guest.phone,
        },
        theme: {
          color: "#000957",
        },
      };

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load Razorpay. Please check your connection.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Error while processing booking/payment");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ marginTop: "100px" }}>
        <div className="row">
          <h3>Hotel Booking</h3>
          <div className="col-md-8">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-2">{hotel.HotelName}</h5>
                <p className="text-muted mb-1">
                  {hotel.City}, {hotel.Nearest_Location}
                </p>
                <p className="small">⭐ {hotel.Star_Rating} Star Hotel</p>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Selected Room</h5>
                <p>
                  <strong>Type:</strong> {room.Room_Type}
                </p>
                <p>
                  <strong>Description:</strong> {room.Room_Facility_Description}
                </p>
                <p>
                  <strong>Price:</strong> ₹{room.Price} / night
                </p>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Guest Contact Details</h5>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={guest.name}
                    onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                    placeholder="Enter guest name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={guest.email}
                    onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={guest.phone}
                    onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {policies?.length > 0 && (
              <div className="card shadow-sm rounded-3 mb-4">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Policies</h5>
                  <p>Check-in: {policies[0].CheckInTime}</p>
                  <p>Check-out: {policies[0].CheckOutTime}</p>
                </div>
              </div>
            )}
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm rounded-3">
              <div className="card-body">
                <h6 className="fw-bold">Fare Summary</h6>
                <div className="d-flex justify-content-between">
                  <span>Room Price</span>
                  <span>₹{room.Price}</span>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <span>Taxes & Fees</span>
                  <span>₹{Math.round(room.Price * 0.12)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <button className="btn w-100 mt-3 text-white" style={{ background: "#000957" }} onClick={handlePayNow}>
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HotelBooked;
