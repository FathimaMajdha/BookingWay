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

  
  const checkAuth = () => {
    const user = JSON.parse(localStorage.getItem("loggedUser") || "null");
    if (!user) {
      toast.error("Please login first to view your bookings!");
      navigate("/");
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!checkAuth()) return;
    fetchBookings();
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      if (!checkAuth()) return;

      const res = await axiosInstance.get("/Booking/mybookings");
      console.log("API Response:", res.data);
      
      if (res.data.Success && res.data.Data) {
        const localDeleted = JSON.parse(localStorage.getItem('deletedBookings') || '[]');
        const deletedSet = new Set(localDeleted);
        setDeletedBookings(deletedSet);

        const data = res.data.Data
          .filter(b => !deletedSet.has(b.MyBookingId))
          .map((b) => {
            return {
              BookingId: b.MyBookingId,
              Type: b.Type,
              TotalAmount: b.TotalAmount,
              PaymentStatus: b.PaymentStatus,
              Created_At: b.BookingDate,
              FlightId: b.Flight_Booking_Id,
              AirlineName: b.AirlineName,
              PassengerName: b.PassengerName,
              PassengerEmail: b.PassengerEmail,
              PassengerPhone: b.PassengerPhone,
              PassengerType: b.PassengerType,
              HotelId: b.Hotel_Booking_Id,
              HotelName: b.HotelName,
              RoomId: b.RoomId,
              GuestName: b.GuestName,
              GuestEmail: b.GuestEmail,
              GuestPhone: b.GuestPhone,
            };
          });

        setBookings(data);
        localStorage.setItem("myBookings", JSON.stringify(data));
      } else {
        toast.error("Failed to load bookings: " + (res.data.Message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings from server");
      
      const localBookings = localStorage.getItem("myBookings");
      if (localBookings) {
        setBookings(JSON.parse(localBookings));
        toast.info("Showing cached bookings data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (booking) => {
    if (!checkAuth()) return;
    
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const url = booking.Type === "Flight" 
        ? `/FlightBooking/${booking.BookingId}` 
        : `/HotelBooking/${booking.BookingId}`;

      await axiosInstance.delete(url);
      
      
      const deleted = JSON.parse(localStorage.getItem('deletedBookings') || '[]');
      deleted.push(booking.BookingId);
      localStorage.setItem('deletedBookings', JSON.stringify(deleted));
      const updatedBookings = bookings.filter((item) => item.BookingId !== booking.BookingId);
      setBookings(updatedBookings);
      setDeletedBookings(prev => new Set([...prev, booking.BookingId]));
      toast.success("Booking cancelled successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleCompletePayment = async (booking) => {
    if (!checkAuth()) return;

    try {
      setProcessingPayment(booking.BookingId);

      
      const orderResponse = await axiosInstance.post("/Payment/create-order", {
        Amount: booking.TotalAmount,
        BookingId: booking.BookingId,
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
        amount: booking.TotalAmount * 100,
        currency: "INR",
        name: `${booking.Type} Booking Payment`,
        description: `Payment for ${booking.Type} Booking #${booking.BookingId}`,
        handler: async (response) => {
          try {
            console.log("Payment success response:", response);
            
            const updateUrl = booking.Type === "Flight" 
              ? `/FlightBooking/${booking.BookingId}`
              : `/HotelBooking/${booking.BookingId}`;

            const verifyResponse = await axiosInstance.put(updateUrl, {
              RazorpayOrderId: response.razorpay_order_id,
              RazorpayPaymentId: response.razorpay_payment_id,
              RazorpaySignature: response.razorpay_signature,
              PaymentStatus: "Paid",
            });

            console.log("Verification response:", verifyResponse.data);

            if (verifyResponse.status === 200) {
              toast.success("Payment successful! Booking confirmed.");
              
              const updatedBookings = bookings.map(b => 
                b.BookingId === booking.BookingId 
                  ? { ...b, PaymentStatus: "Paid" }
                  : b
              );
              
              setBookings(updatedBookings);
              localStorage.setItem("myBookings", JSON.stringify(updatedBookings));
             
              window.location.reload();
            } else {
              toast.error("Payment verification failed!");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            console.error("Error details:", err.response?.data);
            toast.error(err.response?.data?.title || "Payment verification error!");
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
          ondismiss: function() {
            toast.info("Payment cancelled by user");
            setProcessingPayment(null);
          }
        }
      };

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load Razorpay. Please check your connection.");
        setProcessingPayment(null);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (err) {
      console.error("Payment processing error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || err.response?.data?.title || "Error while processing payment");
      setProcessingPayment(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "Paid": { class: "bg-success", text: "Paid" },
      "Pending": { class: "bg-warning", text: "Pending" },
      "Cancelled": { class: "bg-danger", text: "Cancelled" },
      "Refunded": { class: "bg-info", text: "Refunded" }
    };
    
    const config = statusConfig[status] || { class: "bg-secondary", text: status };
    return <span className={`badge ${config.class} text-white`}>{config.text}</span>;
  };

  const getTypeIcon = (type) => {
    return type === "Flight" ? "✈️" : "🏨";
  };

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
        <button 
          className="btn text-white mb-4" 
          style={{ background: "#000957" }} 
          onClick={() => navigate("/")}
        >
          &larr; Back to Home
        </button>

        <h2 className="mb-4">My Bookings</h2>
      
        <div className="alert alert-info mb-4">
          <strong>Welcome!</strong> Here are all your bookings.
        </div>
       
        {bookings.length > 0 && (
          <div className="mt-4 p-4 border rounded bg-light mb-4">
            <h5>Booking Summary</h5>
            <div className="row">
              <div className="col-md-3">
                <strong>Total Bookings:</strong> <span className="text-primary">{bookings.length}</span>
              </div>
              <div className="col-md-3">
                <strong>Flight Bookings:</strong> <span className="text-primary">{bookings.filter(b => b.Type === "Flight").length}</span>
              </div>
              <div className="col-md-3">
                <strong>Hotel Bookings:</strong> <span className="text-primary">{bookings.filter(b => b.Type === "Hotel").length}</span>
              </div>
              <div className="col-md-3">
                <strong>Total Spent:</strong> <span className="text-success">₹{bookings.reduce((sum, b) => sum + b.TotalAmount, 0)}</span>
              </div>
            </div>
          </div>
        )}
        
        {bookings.length === 0 ? (
          <div className="text-center py-5">
            <div className="mb-4">
              <span style={{ fontSize: "4rem" }}>📋</span>
            </div>
            <h4>No bookings found</h4>
            <p className="text-muted">You haven't made any bookings yet.</p>
            <button 
              className="btn text-white mt-3" 
              style={{ background: "#000957" }}
              onClick={() => navigate("/")}
            >
              Browse Flights & Hotels
            </button>
          </div>
        ) : (
          <div className="row">
            {bookings.map((booking) => (
              <div key={`${booking.Type}-${booking.BookingId}`} className="col-lg-6 col-md-12 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {getTypeIcon(booking.Type)} {booking.Type} Booking #{booking.BookingId}
                    </h5>
                    {getStatusBadge(booking.PaymentStatus)}
                  </div>
                  
                  <div className="card-body">
                    {booking.Type === "Flight" && (
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
                    )}

                    {booking.Type === "Hotel" && (
                      <>
                        <div className="mb-2">
                          <strong>Hotel:</strong> {booking.HotelName || "Not specified"}
                        </div>
                        <div className="mb-2">
                          <strong>Guest:</strong> {booking.GuestName}
                        </div>
                        <div className="mb-2">
                          <strong>Contact:</strong> {booking.GuestEmail} | {booking.GuestPhone}
                        </div>
                        {booking.RoomId && (
                          <div className="mb-2">
                            <strong>Room ID:</strong> {booking.RoomId}
                          </div>
                        )}
                      </>
                    )}

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
                            {new Date(booking.Created_At).toLocaleDateString()} at{" "}
                            {new Date(booking.Created_At).toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer bg-transparent">
                    <div className="d-grid gap-2">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(booking)}
                        disabled={processingPayment === booking.BookingId}
                      >
                        Cancel Booking
                      </button>
                      
                      {booking.PaymentStatus === "Pending" && (
                        <button
                          className="btn text-white btn-sm"
                          style={{ background: "#000957" }}
                          onClick={() => handleCompletePayment(booking)}
                          disabled={processingPayment === booking.BookingId}
                        >
                          {processingPayment === booking.BookingId ? (
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