import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../Components/Navbar";
import Footer from "./Footer";
import axiosInstance from "../api/axiosInstance";

const MyBookingPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletedBookings, setDeletedBookings] = useState(new Set());
  const [processingPayment, setProcessingPayment] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

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

  const checkAuth = () => {
    const user = JSON.parse(localStorage.getItem("loggedUser") || "null");
    const token = localStorage.getItem("token");

    if (!user || !token) {
      safeToast.error("Please login first to view your bookings!");
      navigate("/");
      return false;
    }
    return true;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    if (!checkAuth()) return;
    fetchAllBookings();
  }, [navigate]);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);

      if (!checkAuth()) return;

      console.log("Fetching all bookings...");

      const response = await axiosInstance.get("/Booking/my-bookings", {
        headers: getAuthHeaders(),
      });

      console.log("All Bookings API Response:", response.data);

      if (response.data.Success && response.data.Data) {
        const allBookings = response.data.Data;

        const localDeleted = JSON.parse(localStorage.getItem("deletedBookings") || "[]");
        const deletedSet = new Set(localDeleted);
        setDeletedBookings(deletedSet);

        const filteredBookings = allBookings
          .filter((b) => !deletedSet.has(b.MyBookingId))
          .sort((a, b) => new Date(b.BookingDate) - new Date(a.BookingDate))
          .map((booking) => ({
            MyBookingId: booking.MyBookingId,
            Type: booking.Type,
            TotalAmount: booking.TotalAmount,
            PaymentStatus: booking.PaymentStatus,
            BookingDate: booking.BookingDate,

            Flight_Booking_Id: booking.Flight_Booking_Id,
            AirlineName: booking.AirlineName,
            PassengerName: booking.PassengerName,
            PassengerEmail: booking.PassengerEmail,
            PassengerPhone: booking.PassengerPhone,
            PassengerType: booking.PassengerType,

            Hotel_Booking_Id: booking.Hotel_Booking_Id,
            HotelId: booking.HotelId,
            HotelName: booking.HotelName || booking.Hotel_Name,
            RoomId: booking.RoomId,
            GuestName: booking.GuestName,
            GuestEmail: booking.GuestEmail,
            GuestPhone: booking.GuestPhone,
            City: booking.City,
            Room_Type: booking.Room_Type,
            RoomPrice: booking.RoomPrice,

            BookingId: booking.MyBookingId,
            Created_At: booking.BookingDate,
          }));

        console.log("Processed Bookings:", filteredBookings);
        console.log(
          "Flight Bookings:",
          filteredBookings.filter((b) => b.Type === "Flight")
        );
        console.log(
          "Hotel Bookings:",
          filteredBookings.filter((b) => b.Type === "Hotel")
        );

        setBookings(filteredBookings);
        localStorage.setItem("myBookings", JSON.stringify(filteredBookings));
      } else {
        safeToast.error(response.data.Message || "Failed to load bookings");

        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);

      if (error.response?.status === 401) {
        safeToast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("loggedUser");
        navigate("/");
        return;
      }

      safeToast.error("Failed to load bookings from server");

      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const localBookings = localStorage.getItem("myBookings");
    if (localBookings) {
      setBookings(JSON.parse(localBookings));
      safeToast.info("Showing cached bookings data");
    }
  };

  const fetchFlightBookings = async () => {
    try {
      const res = await axiosInstance.get("/Booking/flight-bookings", {
        headers: getAuthHeaders(),
      });

      console.log("Flight Bookings API Response:", res.data);

      if (res.data.Success && res.data.Data) {
        return res.data.Data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching flight bookings:", error);
      safeToast.error("Failed to load flight bookings");
      return [];
    }
  };

  const fetchHotelBookings = async () => {
    try {
      const res = await axiosInstance.get("/Booking/hotel-bookings", {
        headers: getAuthHeaders(),
      });

      console.log("Hotel Bookings API Response:", res.data);

      if (res.data.Success && res.data.Data) {
        return res.data.Data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching hotel bookings:", error);
      safeToast.error("Failed to load hotel bookings");
      return [];
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    switch (activeTab) {
      case "flight":
        return booking.Type === "Flight";
      case "hotel":
        return booking.Type === "Hotel";
      default:
        return true;
    }
  });

  const handleDelete = async (booking) => {
    if (!checkAuth()) return;

    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const response = await axiosInstance.delete(`/Booking/${booking.MyBookingId}`, {
        headers: getAuthHeaders(),
      });

      console.log("Delete response:", response.data);

      if (response.data.Success) {
        const deleted = JSON.parse(localStorage.getItem("deletedBookings") || "[]");
        deleted.push(booking.MyBookingId);
        localStorage.setItem("deletedBookings", JSON.stringify(deleted));

        const updatedBookings = bookings.filter((item) => item.MyBookingId !== booking.MyBookingId);
        setBookings(updatedBookings);
        setDeletedBookings((prev) => new Set([...prev, booking.MyBookingId]));

        safeToast.success("Booking cancelled successfully!");
      } else {
        safeToast.error(response.data.Message || "Failed to cancel booking");
      }
    } catch (err) {
      console.error("Delete error:", err);
      safeToast.error(err.response?.data?.Message || "Failed to cancel booking");
    }
  };
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

  const handleCompletePayment = async (booking) => {
    if (!checkAuth()) return;

    try {
      setProcessingPayment(booking.MyBookingId);

      const bookingId = booking.Type === "Flight" ? booking.Flight_Booking_Id : booking.Hotel_Booking_Id;

      const orderResponse = await axiosInstance.post(
        "/Payment/razorpay/create-order",
        {
          Amount: booking.TotalAmount,
          BookingId: bookingId,
          BookingType: booking.Type,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("Order response:", orderResponse.data);

      if (!orderResponse.data?.Success) {
        throw new Error(orderResponse.data?.Message || "Failed to create payment order");
      }

      const orderId = orderResponse.data.Data;

      if (!orderId) {
        throw new Error("Failed to get order ID from response");
      }

      const options = {
        key: "rzp_test_HDLC1terx8qsOw",
        order_id: orderId,
        amount: Math.round(booking.TotalAmount * 100),
        currency: "INR",
        name: `${booking.Type} Booking Payment`,
        description: `Payment for ${booking.Type} Booking #${bookingId}`,
        handler: async (response) => {
          try {
            console.log("Payment success response:", response);

            const updateUrl = booking.Type === "Flight" ? `/FlightBooking/${bookingId}` : `/HotelBooking/${bookingId}`;

            const verifyResponse = await axiosInstance.put(
              updateUrl,
              {
                RazorpayOrderId: response.razorpay_order_id,
                RazorpayPaymentId: response.razorpay_payment_id,
                RazorpaySignature: response.razorpay_signature,
                PaymentStatus: "Paid",
              },
              {
                headers: getAuthHeaders(),
              }
            );

            console.log("Verification response:", verifyResponse.data);

            if (verifyResponse.data?.Success) {
              safeToast.success("Payment successful! Booking confirmed.");

              const updatedBookings = bookings.map((b) =>
                b.MyBookingId === booking.MyBookingId ? { ...b, PaymentStatus: "Paid" } : b
              );

              setBookings(updatedBookings);
              localStorage.setItem("myBookings", JSON.stringify(updatedBookings));
            } else {
              safeToast.error("Payment verification failed!");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            safeToast.error(err.response?.data?.Message || "Payment verification error!");
          } finally {
            setProcessingPayment(null);
          }
        },
        prefill: {
          name: booking.PassengerName || booking.GuestName,
          email: booking.PassengerEmail || booking.GuestEmail,
          contact: booking.PassengerPhone || booking.GuestPhone,
        },
        theme: { color: "#000957" },
        modal: {
          ondismiss: () => {
            safeToast.info("Payment cancelled by user");
            setProcessingPayment(null);
          },
        },
      };

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        safeToast.error("Failed to load Razorpay. Please check your connection.");
        setProcessingPayment(null);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment processing error:", err);
      safeToast.error(err.response?.data?.Message || "Error while processing payment");
      setProcessingPayment(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Paid: { class: "bg-success", text: "Paid" },
      Pending: { class: "bg-warning text-dark", text: "Pending" },
      Cancelled: { class: "bg-danger", text: "Cancelled" },
      Refunded: { class: "bg-info", text: "Refunded" },
    };

    const config = statusConfig[status] || { class: "bg-secondary", text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getTypeIcon = (type) => {
    return type === "Flight" ? "✈️" : "🏨";
  };

  const renderHotelDetails = (booking) => (
    <>
      <div className="mb-2">
        <strong>Hotel:</strong> {booking.HotelName || "Not specified"}
      </div>
      {booking.City && (
        <div className="mb-2">
          <strong>Location:</strong> {booking.City}
        </div>
      )}
      {booking.Room_Type && (
        <div className="mb-2">
          <strong>Room Type:</strong> {booking.Room_Type}
        </div>
      )}
      <div className="mb-2">
        <strong>Guest:</strong> {booking.GuestName}
      </div>
      <div className="mb-2">
        <strong>Contact:</strong> {booking.GuestEmail} | {booking.GuestPhone}
      </div>
    </>
  );

  const renderFlightDetails = (booking) => (
    <>
      <div className="mb-2">
        <strong>Airline:</strong> {booking.AirlineName || "Not specified"}
      </div>
      <div className="mb-2">
        <strong>Passenger:</strong> {booking.PassengerName}
      </div>
      <div className="mb-2">
        <strong>Contact:</strong> {booking.PassengerEmail} | {booking.PassengerPhone}
      </div>
      <div className="mb-2">
        <strong>Passenger Type:</strong> {booking.PassengerType || "Adult"}
      </div>
    </>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container text-center" style={{ marginTop: "150px", minHeight: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your bookings...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: "100px", minHeight: "80vh" }}>
        <button className="btn text-white mb-4" style={{ background: "#000957" }} onClick={() => navigate("/")}>
          &larr; Back to Home
        </button>

        <h2 className="mb-4">My Bookings</h2>

        <div className="alert alert-info mb-4">
          <strong>Welcome!</strong> Manage all your flight and hotel bookings in one place.
          <button className="btn btn-sm btn-outline-primary ms-3" onClick={fetchAllBookings} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Bookings"}
          </button>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
                  All Bookings ({bookings.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "flight" ? "active" : ""}`}
                  onClick={() => setActiveTab("flight")}
                >
                  ✈️ Flights ({bookings.filter((b) => b.Type === "Flight").length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "hotel" ? "active" : ""}`}
                  onClick={() => setActiveTab("hotel")}
                >
                  🏨 Hotels ({bookings.filter((b) => b.Type === "Hotel").length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <span style={{ fontSize: "4rem" }}>
                {activeTab === "flight" ? "✈️" : activeTab === "hotel" ? "🏨" : "📋"}
              </span>
            </div>
            <h4>
              {activeTab === "flight"
                ? "No flight bookings found"
                : activeTab === "hotel"
                ? "No hotel bookings found"
                : "No bookings found"}
            </h4>
            <p className="text-muted">
              {activeTab === "all"
                ? "You haven't made any bookings yet."
                : `You haven't made any ${activeTab} bookings yet.`}
            </p>
            <button
              className="btn text-white mt-3"
              style={{ background: "#000957" }}
              onClick={() => navigate(activeTab === "flight" ? "/flight" : activeTab === "hotel" ? "/hotel" : "/")}
            >
              Browse {activeTab === "all" ? "Flights & Hotels" : activeTab === "flight" ? "Flights" : "Hotels"}
            </button>
          </div>
        ) : (
          <div className="row">
            {filteredBookings.map((booking) => (
              <div key={`${booking.Type}-${booking.MyBookingId}`} className="col-lg-6 col-md-12 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {getTypeIcon(booking.Type)} {booking.Type} Booking #{booking.MyBookingId}
                    </h5>
                    {getStatusBadge(booking.PaymentStatus)}
                  </div>

                  <div className="card-body">
                    {booking.Type === "Flight" && renderFlightDetails(booking)}
                    {booking.Type === "Hotel" && renderHotelDetails(booking)}

                    <div className="border-top pt-3 mt-3">
                      <div className="row">
                        <div className="col-6">
                          <strong>Total Amount:</strong>
                        </div>
                        <div className="col-6 text-end">
                          <span className="fw-bold text-primary">₹{booking.TotalAmount}</span>
                        </div>
                      </div>

                      <div className="row mt-2">
                        <div className="col-6">
                          <strong>Booking Date:</strong>
                        </div>
                        <div className="col-6 text-end">
                          <small className="text-muted">
                            {new Date(booking.BookingDate).toLocaleDateString()} at{" "}
                            {new Date(booking.BookingDate).toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer bg-transparent">
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(booking)}
                        disabled={processingPayment === booking.MyBookingId}
                      >
                        Cancel Booking
                      </button>

                      {booking.PaymentStatus === "Pending" && (
                        <button
                          className="btn text-white btn-sm"
                          style={{ background: "#000957" }}
                          onClick={() => handleCompletePayment(booking)}
                          disabled={processingPayment === booking.MyBookingId}
                        >
                          {processingPayment === booking.MyBookingId ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Processing...
                            </>
                          ) : (
                            `Complete Payment - ₹${booking.TotalAmount}`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyBookingPage;
