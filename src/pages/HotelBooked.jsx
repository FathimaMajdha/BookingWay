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

  const [loading, setLoading] = useState(false);

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

  if (!hotel || !room) {
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

  const totalAmount = room.Price + Math.round(room.Price * 0.12);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
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
  };

  const handlePayNow = async () => {
    if (!guest.name?.trim()) {
      safeToast.error("Please enter guest name!");
      return;
    }

    if (!guest.email?.includes("@")) {
      safeToast.error("Please enter a valid email address!");
      return;
    }

    if (guest.phone?.length !== 10) {
      safeToast.error("Please enter a valid 10-digit phone number!");
      return;
    }

    setLoading(true);

    try {
      const bookingPayload = {
        HotelId: hotel.HotelId || hotel.Id,
        RoomId: room.RoomId || room.Id,
        HotelName: hotel.Hotel_Name || hotel.HotelName,
        GuestName: guest.name.trim(),
        GuestEmail: guest.email,
        GuestPhone: guest.phone,
        TotalAmount: totalAmount,
        CheckInDate: new Date().toISOString().split("T")[0],
        CheckOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      };

      console.log("Creating booking with payload:", bookingPayload);

      const bookingResponse = await axiosInstance.post("/HotelBooking", bookingPayload);

      console.log("Booking API response:", bookingResponse);

      let bookingId;
      const responseData = bookingResponse.data;

      if (responseData.Data !== undefined && responseData.Data !== null) {
        bookingId = responseData.Data;
      } else if (responseData.InsertedId) {
        bookingId = responseData.InsertedId;
      } else if (responseData.bookingId) {
        bookingId = responseData.bookingId;
      } else if (responseData.id) {
        bookingId = responseData.id;
      }

      console.log("Extracted Booking ID:", bookingId);

      if (!bookingId) {
        throw new Error("Could not retrieve booking ID from response: " + JSON.stringify(responseData));
      }

      const orderPayload = {
        Amount: totalAmount,
        BookingId: bookingId,
      };

      console.log("Creating order with payload:", orderPayload);

      const orderResponse = await axiosInstance.post("/payment/razorpay/create-order", orderPayload);

      console.log("Order Response:", orderResponse.data);

      const orderResponseData = orderResponse.data;
      let orderId;

      if (orderResponseData.Data) {
        orderId = orderResponseData.Data;
      } else if (orderResponseData.OrderId) {
        orderId = orderResponseData.OrderId;
      } else if (orderResponseData.order_id) {
        orderId = orderResponseData.order_id;
      } else if (orderResponseData.id) {
        orderId = orderResponseData.id;
      }

      console.log("Extracted Order ID:", orderId);

      if (!orderId) {
        throw new Error("Could not retrieve Razorpay order ID from: " + JSON.stringify(orderResponseData));
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        safeToast.error("Failed to load Razorpay. Please check your connection.");
        setLoading(false);
        return;
      }

      const options = {
        key: "rzp_test_HDLC1terx8qsOw",
        order_id: orderId,
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        name: "Hotel Booking",
        description: `Booking for ${hotel.Hotel_Name || hotel.HotelName}, ${hotel.City}`,
        handler: async function (response) {
          try {
            console.log("Payment successful:", response);

            const verifyPayload = {
              RazorpayOrderId: response.razorpay_order_id,
              RazorpayPaymentId: response.razorpay_payment_id,
              RazorpaySignature: response.razorpay_signature,
            };

            console.log("Verifying payment with:", verifyPayload);

            const verifyResponse = await axiosInstance.post("/payment/razorpay/verify", verifyPayload);

            console.log("Verify Response:", verifyResponse.data);

            if (verifyResponse.data.Success || verifyResponse.status === 200) {
              try {
                const updatePayload = {
                  RazorpayOrderId: response.razorpay_order_id,
                  RazorpayPaymentId: response.razorpay_payment_id,
                  RazorpaySignature: response.razorpay_signature,
                  PaymentStatus: "Paid",
                  PaymentMethod: "Razorpay",
                };

                console.log("Updating hotel booking with:", updatePayload);

                await axiosInstance.put(`/HotelBooking/${bookingId}`, updatePayload);

                safeToast.success("Payment successful! Booking confirmed.");

                navigate("/bookings", {
                  state: {
                    hotel,
                    room,
                    guest,
                    totalAmount,
                    bookingId,
                    paymentStatus: "Paid",
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                  },
                });
              } catch (updateError) {
                console.error("Error updating hotel booking:", updateError);
                console.error("Update error response:", updateError.response?.data);
                safeToast.error("Payment successful but failed to update booking status.");
              }
            } else {
              safeToast.error("Payment verification failed!");
            }
          } catch (err) {
            console.error("Verification error:", err);
            console.error("Verification error response:", err.response?.data);
            safeToast.error("Payment verification error!");
          }
        },
        prefill: {
          name: guest.name,
          email: guest.email,
          contact: guest.phone,
        },
        notes: {
          bookingId: bookingId.toString(),
          hotel: hotel.Hotel_Name || hotel.HotelName,
        },
        theme: {
          color: "#000957",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            safeToast.info("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Booking/Payment error:", err);
      console.error("Error response:", err.response?.data);

      let errorMessage = "An unexpected error occurred";

      if (err.response?.data) {
        if (err.response.data.Message) {
          errorMessage = err.response.data.Message;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.title) {
          errorMessage = err.response.data.title;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      safeToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ marginTop: "100px", minHeight: "80vh" }}>
        <div className="row">
          <div className="col-12">
            <h3 className="mb-4">Hotel Booking</h3>
          </div>

          <div className="col-md-8">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-2">{hotel.Hotel_Name || hotel.HotelName}</h5>
                <p className="text-muted mb-1">
                  {hotel.City}, {hotel.Nearest_Location}
                </p>
                <p className="small">⭐ {hotel.Star_Rating || hotel.Rating} Star Hotel</p>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Selected Room</h5>
                <div className="row">
                  <div className="col-6">
                    <h6 className="text-primary">{room.Room_Type}</h6>
                    <p className="mb-1 small">Size: {room.Sqft} sqft</p>
                  </div>
                  <div className="col-6 text-end">
                    <p className="mb-1 fw-bold text-success">₹{room.Price?.toLocaleString()}</p>
                    <p className="small text-muted">per night</p>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-4">
                    <strong>Max Guests</strong>
                    <p className="mb-0">{room.MaximumGuest_Count}</p>
                  </div>
                  <div className="col-4 text-center">
                    <strong>Beds</strong>
                    <p className="mb-0">{room.Bed_Count}</p>
                  </div>
                  <div className="col-4 text-end">
                    <strong>Bathrooms</strong>
                    <p className="mb-0">{room.Bathroom_Count}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <strong>Description:</strong>
                  <p className="text-muted mb-0">{room.Room_Facility_Description}</p>
                </div>
              </div>
            </div>

            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Guest Contact Details</h5>

                <div className="mb-3">
                  <label className="form-label fw-medium">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={guest.name}
                    onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                    placeholder="Enter guest name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={guest.email}
                    onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={guest.phone}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/\D/g, "");
                      if (numbers.length <= 10) {
                        setGuest({ ...guest, phone: numbers });
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

            {policies?.length > 0 && (
              <div className="card shadow-sm rounded-3 mb-4">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Hotel Policies</h5>
                  <div className="row">
                    <div className="col-6">
                      <strong>Check-in</strong>
                      <p className="mb-0">{policies[0].CheckInTime}</p>
                    </div>
                    <div className="col-6 text-end">
                      <strong>Check-out</strong>
                      <p className="mb-0">{policies[0].CheckOutTime}</p>
                    </div>
                  </div>
                  {policies[0].GuestPolicy && (
                    <div className="mt-3">
                      <strong>Guest Policy:</strong>
                      <p className="text-muted mb-0">{policies[0].GuestPolicy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm rounded-3 mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Fare Summary</h6>

                <div className="d-flex justify-content-between mb-2">
                  <span>Room Price (1 night)</span>
                  <span>₹{room.Price?.toLocaleString()}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span>Taxes & Fees (12%)</span>
                  <span>₹{Math.round(room.Price * 0.12)?.toLocaleString()}</span>
                </div>

                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5 text-primary">
                  <span>Total Amount</span>
                  <span>₹{totalAmount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              className="btn w-100 py-3 text-white fw-bold"
              style={{ background: "#000957", fontSize: "1.1rem" }}
              onClick={handlePayNow}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Processing Payment...
                </>
              ) : (
                `Pay ₹${totalAmount?.toLocaleString()}`
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

export default HotelBooked;
