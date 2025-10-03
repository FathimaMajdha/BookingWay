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

  const safeToast = {
    success: (message) => {
      try {
        toast.success(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (error) {
        console.warn("Toast error:", error);
      }
    },
    error: (message) => {
      try {
        toast.error(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (error) {
        console.warn("Toast error:", error);
      }
    },
    info: (message) => {
      try {
        toast.info(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnHover: true,
        });
      } catch (error) {
        console.warn("Toast error:", error);
      }
    },
  };

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
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayNow = async () => {
    if (!passenger.name?.trim()) {
      safeToast.error("Please enter passenger name!");
      return;
    }

    if (!passenger.email?.includes("@")) {
      safeToast.error("Please enter a valid email address!");
      return;
    }

    if (passenger.phone?.length !== 10) {
      safeToast.error("Please enter a valid 10-digit phone number!");
      return;
    }

    try {
      setProcessing(true);

      const bookingPayload = {
        FlightId: flight.FlightId,
        FareId: fare.FareId,
        AirlineName: flight.Airline_Name,
        PassengerName: passenger.name.trim(),
        PassengerEmail: passenger.email,
        PassengerPhone: passenger.phone,
        Meals: selectedMeals.map((m) => m.name).join(", "),
        TotalAmount: totalAmount,
        DeparturePlace: flight.Depart_Place,
        ArrivalPlace: flight.Arrival_Place,
        DepartureDateTime: flight.Depart_DateTime,
        ArrivalDateTime: flight.Arrival_DateTime,
        FlightNumber: flight.FlightNumber,
      };

      console.log("Creating booking with payload:", bookingPayload);

      const bookingResponse = await axiosInstance.post("/FlightBooking", bookingPayload);

      console.log("Booking API response:", bookingResponse);

      if (bookingResponse.status === 201) {
        console.log("Booking created successfully with status 201");

        let bookingId;

        if (bookingResponse.data?.Data) {
          bookingId = bookingResponse.data.Data;
        } else if (bookingResponse.data?.data) {
          bookingId = bookingResponse.data.data;
        } else if (bookingResponse.data?.id) {
          bookingId = bookingResponse.data.id;
        } else {
          bookingId = bookingResponse.data;
        }

        console.log("Extracted booking ID:", bookingId);

        if (!bookingId) {
          console.error("Could not extract booking ID from response:", bookingResponse.data);
          throw new Error("Booking created but could not retrieve booking ID");
        }

        const orderPayload = {
          Amount: totalAmount,
          BookingId: bookingId.toString(),
        };

        console.log("Creating order with payload:", orderPayload);

        const orderResponse = await axiosInstance.post("/Payment/razorpay/create-order", orderPayload);

        console.log("Order API response:", orderResponse);

        if (!orderResponse.data?.Success) {
          throw new Error(orderResponse.data?.Message || "Failed to create payment order");
        }

        const orderId = orderResponse.data.Data;

        console.log("Order ID:", orderId);
        console.log("Order response structure:", orderResponse.data);

        if (!orderId) {
          console.error("Order response structure:", orderResponse.data);
          throw new Error("Could not retrieve order ID from payment service");
        }

        console.log("Order created with ID:", orderId);

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          safeToast.error("Payment service is temporarily unavailable. Please try again.");
          setProcessing(false);
          return;
        }

        const options = {
          key: "rzp_test_HDLC1terx8qsOw",
          order_id: orderId,
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          name: "Flight Booking",
          description: `${flight.Depart_Place} → ${flight.Arrival_Place}`,
          handler: async (response) => {
            try {
              console.log("Payment success:", response);

              const verifyPayload = {
                RazorpayOrderId: response.razorpay_order_id,
                RazorpayPaymentId: response.razorpay_payment_id,
                RazorpaySignature: response.razorpay_signature,
              };

              console.log("Verifying payment with:", verifyPayload);

              const verifyResponse = await axiosInstance.post("/Payment/razorpay/verify", verifyPayload);

              console.log("Verification response:", verifyResponse);

              if (verifyResponse.data?.Success) {
                const updatePayload = {
                  RazorpayOrderId: response.razorpay_order_id,
                  RazorpayPaymentId: response.razorpay_payment_id,
                  RazorpaySignature: response.razorpay_signature,
                  PaymentStatus: "Paid",
                };

                await axiosInstance.put(`/FlightBooking/${bookingId}`, updatePayload);

                safeToast.success("Payment successful! Booking confirmed.");

                navigate("/bookings", {
                  state: {
                    bookingId,
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    flight,
                    fare,
                    passenger,
                    selectedMeals,
                    totalAmount,
                  },
                });
              } else {
                safeToast.error("Payment verification failed. Please contact support.");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              console.error("Error details:", error.response?.data);
              safeToast.error("Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            name: passenger.name.trim(),
            email: passenger.email,
            contact: passenger.phone,
          },
          theme: { color: "#000957" },
          modal: {
            ondismiss: () => {
              safeToast.info("Payment cancelled");
              setProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error(`Booking failed with status: ${bookingResponse.status}`);
      }
    } catch (error) {
      console.error("Booking/Payment error:", error);
      console.error("Error response:", error.response?.data);

      let errorMessage = "An unexpected error occurred";

      if (error.response?.data) {
        if (error.response.data.Message) {
          errorMessage = error.response.data.Message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.title) {
          errorMessage = error.response.data.title;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      safeToast.error(errorMessage);
      setProcessing(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ marginTop: "100px", minHeight: "80vh" }}>
        <div className="row">
          <div className="col-12">
            <h3 className="mb-4">Flight Booking</h3>
          </div>

          <div className="col-md-8">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">
                  {flight.Depart_Place} → {flight.Arrival_Place}
                </h5>
                <div className="row">
                  <div className="col-6">
                    <h6 className="text-primary">{flight.Airline_Name}</h6>
                    <p className="mb-1 small">Flight: {flight.FlightNumber}</p>
                  </div>
                  <div className="col-6 text-end">
                    <p className="mb-1 fw-bold text-success">₹{fare.Price}</p>
                    <p className="small text-muted">{fare.FareName} Fare</p>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-4">
                    <strong>Departure</strong>
                    <p className="mb-0">
                      {new Date(flight.Depart_DateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <small className="text-muted">{flight.Depart_Place}</small>
                  </div>
                  <div className="col-4 text-center">
                    <strong>Duration</strong>
                    <p className="mb-0">{flight.Depart_Duration}</p>
                    <small className="text-muted">
                      {flight.Stops || 0} Stop{(flight.Stops || 0) !== 1 ? "s" : ""}
                    </small>
                  </div>
                  <div className="col-4 text-end">
                    <strong>Arrival</strong>
                    <p className="mb-0">
                      {new Date(flight.Arrival_DateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    <small className="text-muted">{flight.Arrival_Place}</small>
                  </div>
                </div>

                <div className="mt-3 p-2 bg-light rounded">
                  <small>
                    <strong>Baggage:</strong> Cabin: 7kg • Check-in: {fare.Baggage} |<strong> Refund:</strong> {fare.Refund}{" "}
                    |<strong> Meals:</strong> {fare.Meals}
                  </small>
                </div>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Passenger Contact Details</h5>

                <div className="mb-3">
                  <label className="form-label fw-medium">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={passenger.name}
                    onChange={(e) => setPassenger({ ...passenger, name: e.target.value })}
                    placeholder="Enter passenger full name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium">Email Address *</label>
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
                  <label className="form-label fw-medium">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={passenger.phone}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      if (numbers.length <= 10) {
                        setPassenger({ ...passenger, phone: numbers });
                      }
                    }}
                    placeholder="Enter 10-digit phone number"
                    maxLength="10"
                    required
                  />
                  <small className="text-muted">We'll send booking confirmation via SMS and email</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Fare Summary</h6>

                <div className="d-flex justify-content-between mb-2">
                  <span>Base Fare</span>
                  <span>₹{fare.Price}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Taxes & Fees (15%)</span>
                  <span>₹{Math.round(fare.Price * 0.15)}</span>
                </div>

                {selectedMeals.length > 0 && (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Additional Meals</span>
                      <span>₹{mealsTotal}</span>
                    </div>
                    <div className="small text-muted mb-2">Includes: {selectedMeals.map((m) => m.name).join(", ")}</div>
                  </>
                )}

                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5 text-primary">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Add Chargeable Meals</h6>
                {mealsOptions.map((meal) => {
                  const isSelected = selectedMeals.find((m) => m.id === meal.id);
                  return (
                    <div
                      key={meal.id}
                      className="d-flex justify-content-between align-items-center mb-3 p-2 border rounded"
                    >
                      <div className="flex-grow-1">
                        <div className="fw-medium">{meal.name}</div>
                        <small className="text-muted">₹{meal.price}</small>
                      </div>
                      <button
                        className={`btn btn-sm ${isSelected ? "btn-danger" : "btn-outline-primary"}`}
                        onClick={() => toggleMeal(meal)}
                        type="button"
                      >
                        {isSelected ? "Remove" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              className="btn w-100 py-3 text-white fw-bold"
              style={{ background: "#000957", fontSize: "1.1rem" }}
              onClick={handlePayNow}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing Payment...
                </>
              ) : (
                `Pay ₹${totalAmount}`
              )}
            </button>

            <div className="text-center mt-3">
              <small className="text-muted">🔒 Secure payment powered by Razorpay</small>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FlightBookingPage;
