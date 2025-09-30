import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import axiosInstance from "../api/axiosInstance";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Bookings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axiosInstance.get("/AdminBooking");
        console.log("Bookings API response:", res.data);
        
        let bookingsData = [];
     
        if (res.data && res.data.Data && Array.isArray(res.data.Data)) {
          bookingsData = res.data.Data;
        } else if (res.data && Array.isArray(res.data)) {
          bookingsData = res.data;
        } else {
          console.warn("Unexpected bookings response structure:", res.data);
          bookingsData = [];
        }

        const confirmedBookings = bookingsData.filter(booking => 
          booking.PaymentStatus === "Paid" || 
          booking.PaymentStatus === "Confirmed" ||
          booking.BookingStatus === "Confirmed"
        );

        console.log("Confirmed bookings:", confirmedBookings);

        const userMap = {};

        confirmedBookings.forEach((b) => {
         
          if (!b.UserAuthId) return;

          
          if (!userMap[b.UserAuthId]) {
            userMap[b.UserAuthId] = {
              id: b.UserAuthId,
              name: b.UserName || "Unknown User",
              email: b.UserEmail || "No email",
              bookings: [],
            };
          }

         
          const bookingObj = {
            bookingId: b.MyBookingId || b.BookingId || `temp-${Date.now()}`,
            bookingType: b.BookingType || b.Type || "Unknown",
            bookingTypeName: b.BookingTypeName || b.Type || "Booking",
            totalAmount: b.TotalAmount || 0,
            paymentStatus: b.PaymentStatus || "Unknown",
            bookingDate: b.BookingDate || b.Created_At || new Date().toISOString(),
            passengerName: b.PassengerName,
            passengerEmail: b.PassengerEmail,
            passengerPhone: b.PassengerPhone,
            passengerType: b.PassengerType,
            airlineName: b.AirlineName,
            hotelName: b.HotelName,
            guestName: b.GuestName,
            guestEmail: b.GuestEmail,
            guestPhone: b.GuestPhone,
            roomId: b.RoomId,
          };

          userMap[b.UserAuthId].bookings.push(bookingObj);
        });

        const usersArray = Object.values(userMap);
        console.log("Processed users with confirmed bookings:", usersArray);
        setUsers(usersArray);
        
        if (usersArray.length > 0) {
          toast.success("Bookings fetched successfully!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setUsers([]);
       
        toast.error("Failed to fetch bookings!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      "Paid": { class: "bg-success", text: "Paid" },
      "Confirmed": { class: "bg-success", text: "Confirmed" },
      "Pending": { class: "bg-warning", text: "Pending" },
      "Cancelled": { class: "bg-danger", text: "Cancelled" },
      "Refunded": { class: "bg-info", text: "Refunded" }
    };
    
    const config = statusConfig[status] || { class: "bg-secondary", text: status };
    return <span className={`badge ${config.class} text-white`}>{config.text}</span>;
  };

  
  const getTypeIcon = (type) => {
    return type === "Flight" ? "✈️" : type === "Hotel" ? "🏨" : "📋";
  };

  
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="d-flex bg-light">
      <Sidebar />
      
     
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="container-fluid pt-5" style={{ marginLeft: "30px", width: "1000px" }}>
        <h1 className="h3 mb-4 border-bottom pb-2 text-dark fw-bold">
          All User Bookings
        </h1>

       
        {!loading && users.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">Total Users</h5>
                  <h2 className="card-text">{users.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">Total Bookings</h5>
                  <h2 className="card-text">
                    {users.reduce((total, user) => total + user.bookings.length, 0)}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h5 className="card-title">Flight Bookings</h5>
                  <h2 className="card-text">
                    {users.reduce((total, user) => 
                      total + user.bookings.filter(b => b.bookingType === "Flight").length, 0
                    )}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <h5 className="card-title">Hotel Bookings</h5>
                  <h2 className="card-text">
                    {users.reduce((total, user) => 
                      total + user.bookings.filter(b => b.bookingType === "Hotel").length, 0
                    )}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Loading user bookings...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="row">
            {users.map((user) => (
              <div key={user.id} className="col-12 mb-4">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                      <div>
                        <h5 className="card-title mb-1 text-dark">{user.name}</h5>
                        <p className="card-subtitle text-muted mb-1">{user.email}</p>
                        <small className="text-muted">User ID: {user.id}</small>
                      </div>
                      <span className="badge bg-primary fs-6 mt-2 mt-md-0">
                        {user.bookings.length} Booking
                        {user.bookings.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    {user.bookings.map((booking, index) => (
                      <div key={booking.bookingId} className="border rounded p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold mb-1">
                              {getTypeIcon(booking.bookingType)} {booking.bookingType} Booking 
                              <span className="text-muted"> #{index + 1}</span>
                            </h6>
                            <small className="text-muted">Booking ID: {booking.bookingId}</small>
                          </div>
                          <div className="text-end">
                            {getStatusBadge(booking.paymentStatus)}
                            <div>
                              <small className="text-muted">
                                {formatDate(booking.bookingDate)}
                              </small>
                            </div>
                          </div>
                        </div>

                       
                        {booking.bookingType === "Flight" && (
                          <div className="mb-3">
                            <div className="row">
                              <div className="col-md-6">
                                <strong>Airline:</strong> {booking.bookingTypeName || "Not specified"}
                              </div>
                              <div className="col-md-6">
                                <strong>Passenger:</strong> {booking.passengerName}
                              </div>
                            </div>
                            <div className="row mt-2">
                              <div className="col-md-6">
                                <strong>Email:</strong> {booking.passengerEmail}
                              </div>
                              <div className="col-md-6">
                                <strong>Phone:</strong> {booking.passengerPhone}
                              </div>
                            </div>
                            {booking.passengerType && (
                              <div className="row mt-2">
                                <div className="col-md-12">
                                  <strong>Passenger Type:</strong> {booking.passengerType}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                       
                        {booking.bookingType === "Hotel" && (
                          <div className="mb-3">
                            <div className="row">
                              <div className="col-md-6">
                                <strong>Hotel:</strong> {booking.hotelName || "Not specified"}
                              </div>
                              <div className="col-md-6">
                                <strong>Guest:</strong> {booking.guestName}
                              </div>
                            </div>
                            <div className="row mt-2">
                              <div className="col-md-6">
                                <strong>Email:</strong> {booking.guestEmail}
                              </div>
                              <div className="col-md-6">
                                <strong>Phone:</strong> {booking.guestPhone}
                              </div>
                            </div>
                            {booking.roomId && (
                              <div className="row mt-2">
                                <div className="col-md-12">
                                  <strong>Room ID:</strong> {booking.roomId}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                       
                        <div className="border-top pt-3">
                          <div className="row">
                            <div className="col-6">
                              <strong>Total Amount:</strong>
                            </div>
                            <div className="col-6 text-end">
                              <span className="fw-bold text-success fs-5">
                                ₹{Number(booking.totalAmount || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-5">
            <div className="mb-4">
              <span style={{ fontSize: "4rem" }}>📋</span>
            </div>
            <h4 className="text-muted">No confirmed bookings found</h4>
            <p className="text-muted">There are no paid or confirmed bookings in the system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;