import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../Components/Navbar";
import Footer from "./Footer";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FlightBookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { flight, fare } = location.state || {};

  const [passenger, setPassenger] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [selectedMeals, setSelectedMeals] = useState([]);
  const [processing, setProcessing] = useState(false);

  const mealsOptions = [
    { id: 1, name: "Veg Meal", price: 350 },
    { id: 2, name: "Non-Veg Meal", price: 450 },
    { id: 3, name: "Snacks", price: 200 },
    { id: 4, name: "Beverage", price: 150 },
  ];

  if (!flight || !fare) {
    return (
      <div className="container py-5 text-center">
        <Navbar />
        <h4>No booking details found!</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
          Go Back Home
        </button>
      </div>
    );
  }

  const toggleMeal = (meal) => {
    setSelectedMeals((prev) =>
      prev.find((m) => m.id === meal.id) ? prev.filter((m) => m.id !== meal.id) : [...prev, meal]
    );
  };

  const mealsTotal = selectedMeals.reduce((acc, meal) => acc + meal.price, 0);
  const totalAmount = fare.Price + Math.round(fare.Price * 0.15) + mealsTotal;

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayNow = async () => {
    if (!passenger.name || !passenger.email || !passenger.phone) {
      toast.error("Please fill in all passenger details!");
      return;
    }

   
    if (passenger.phone.length < 10) {
      toast.error("Please enter a valid phone number!");
      return;
    }

    if (!passenger.email.includes('@')) {
      toast.error("Please enter a valid email address!");
      return;
    }

    try {
      setProcessing(true);

      
      const bookingResponse = await axiosInstance.post("/FlightBooking", {
        FlightId: flight.FlightId,
        FareId: fare.FareId,
        AirlineName: flight.Airline_Name,
        PassengerName: passenger.name,
        PassengerEmail: passenger.email,
        PassengerPhone: passenger.phone,
        Meals: selectedMeals.map((m) => m.name).join(", "),
        TotalAmount: totalAmount,
      });

      console.log("Booking response:", bookingResponse.data);

      
      const bookingId = bookingResponse.data?.InsertedId?.Data;
      
      if (!bookingId) {
        throw new Error("Failed to get booking ID from response");
      }

      
      const orderResponse = await axiosInstance.post("/Payment/create-order", {
        Amount: totalAmount,
        BookingId: bookingId,
      });

      console.log("Order response:", orderResponse.data);

      
      const orderId = orderResponse.data?.OrderId?.Data;
      const key = orderResponse.data?.Key;

      if (!orderId || !key) {
        throw new Error("Failed to get order details from response");
      }

      const options = {
        key: key,
        order_id: orderId,
        amount: totalAmount * 100,
        currency: "INR",
        name: "Flight Booking",
        description: `${flight.Depart_Place} → ${flight.Arrival_Place}`,
        handler: async (response) => {
          try {
            console.log("Payment success response:", response);
            
       
            const verifyResponse = await axiosInstance.put(`/FlightBooking/${bookingId}`, {
              RazorpayOrderId: response.razorpay_order_id,
              RazorpayPaymentId: response.razorpay_payment_id,
              RazorpaySignature: response.razorpay_signature,
              PaymentStatus: "Paid",
            });

            console.log("Verification response:", verifyResponse.data);

            if (verifyResponse.status === 200) {
              toast.success("Payment successful! Booking confirmed.");
              navigate("/bookings", {
                state: { 
                  flight, 
                  fare, 
                  passenger, 
                  selectedMeals, 
                  totalAmount,
                  bookingId,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id
                },
              });
            } else {
              toast.error("Payment verification failed!");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            console.error("Error details:", err.response?.data);
            toast.error(err.response?.data?.title || "Payment verification error!");
          }
        },
        prefill: {
          name: passenger.name,
          email: passenger.email,
          contact: passenger.phone,
        },
        theme: { color: "#000957" },
        modal: {
          ondismiss: function() {
            toast.info("Payment cancelled by user");
            setProcessing(false);
          }
        }
      };

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load Razorpay. Please check your connection.");
        setProcessing(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err) {
      console.error("Booking/Payment error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || err.response?.data?.title || "Error while processing booking/payment");
      setProcessing(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ marginTop: "100px" }}>
        <div className="row">
          <div className="col-12">
            <h3 className="mb-4">Flight Booking</h3>
          </div>
          
          <div className="col-md-8">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-4">
                  {flight.Depart_Place} → {flight.Arrival_Place}
                </h5>
                <h6 className="text-muted">{flight.Airline_Name}</h6>
                <p className="mb-1 fw-bold">
                  {new Date(flight.Depart_DateTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  -{" "}
                  {new Date(flight.Arrival_DateTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
                <p className="small text-muted">Flight No: {flight.FlightNumber}</p>
                <p className="small">Cabin Baggage: 7 Kgs | Check-In Baggage: {fare.Baggage}</p>
                <p className="small text-success">Fare Type: {fare.FareName}</p>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Passenger Contact Details</h5>
                <div className="mb-3">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={passenger.name}
                    onChange={(e) => setPassenger({ ...passenger, name: e.target.value })}
                    placeholder="Enter passenger name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={passenger.email}
                    onChange={(e) => setPassenger({ ...passenger, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={passenger.phone}
                    onChange={(e) => setPassenger({ ...passenger, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="Enter phone number"
                    maxLength="10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Fare Summary</h6>
                <div className="d-flex justify-content-between">
                  <span>Base Fare ({fare.FareName})</span>
                  <span>₹{fare.Price}</span>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <span>Taxes & Fees (15%)</span>
                  <span>₹{Math.round(fare.Price * 0.15)}</span>
                </div>
                {selectedMeals.length > 0 && (
                  <>
                    <div className="d-flex justify-content-between mt-2">
                      <span>Meals Selected</span>
                      <span>₹{mealsTotal}</span>
                    </div>
                    <div className="small text-muted">
                      Includes: {selectedMeals.map(m => m.name).join(', ')}
                    </div>
                  </>
                )}
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Add Chargeable Meals</h5>
                {mealsOptions.map((meal) => (
                  <div key={meal.id} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <div>{meal.name}</div>
                      <small className="text-muted">₹{meal.price}</small>
                    </div>
                    <button
                      className={`btn btn-sm ${
                        selectedMeals.find((m) => m.id === meal.id) ? "btn-danger" : "btn-outline-danger"
                      }`}
                      onClick={() => toggleMeal(meal)}
                    >
                      {selectedMeals.find((m) => m.id === meal.id) ? "Remove" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="btn w-100 mt-3 text-white" 
              style={{ background: "#000957" }} 
              onClick={handlePayNow}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing...
                </>
              ) : (
                `Proceed to Pay ₹${totalAmount}`
              )}
            </button>
            
            <div className="text-center mt-3">
              <small className="text-muted">
                Secure payment powered by Razorpay
              </small>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FlightBookingPage;