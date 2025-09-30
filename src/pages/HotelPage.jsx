import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Footer from "./Footer";

const HotelPage = () => {
  const navigate = useNavigate();

  const [hotelOffers, setHotelOffers] = useState([]);
  const [dailyDeals, setDailyDeals] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [hotelFaqs, setHotelFaqs] = useState([]);
  const [loading, setLoading] = useState({
    offers: true,
    deals: true,
    seasons: true,
    destinations: true,
    faqs: true
  });

  const locations = ["Wayanad", "New York", "London", "Paris", "Dubai", "Mumbai", "Chennai"];
  const guestTypes = ["Adults", "Children"];
  const roomCounts = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

  const [hotelData, setHotelData] = useState({
    location: locations[0],
    checkin: "2025-08-28",
    checkout: "2025-08-30",
    guestType: guestTypes[0],
    guestCount: 1,
    roomCount: roomCounts[0],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        const offersRes = await axiosInstance.get("/hotels/offers");
        if (offersRes.data.Success && offersRes.data.Data) {
          setHotelOffers(offersRes.data.Data);
        }
        setLoading(prev => ({ ...prev, offers: false }));

        const dealsRes = await axiosInstance.get("/hotels/dailydeals");
        if (dealsRes.data.Success && dealsRes.data.Data) {
          setDailyDeals(dealsRes.data.Data);
        }
        setLoading(prev => ({ ...prev, deals: false }));

        const seasonsRes = await axiosInstance.get("/hotels/seasons");
        if (seasonsRes.data.Success && seasonsRes.data.Data) {
          setSeasons(seasonsRes.data.Data);
        }
        setLoading(prev => ({ ...prev, seasons: false }));

        
        const destinationsRes = await axiosInstance.get("/hotels/popular-destinations");
        if (destinationsRes.data.Success && destinationsRes.data.Data) {
          setPopularDestinations(destinationsRes.data.Data);
        }
        setLoading(prev => ({ ...prev, destinations: false }));

        const faqsRes = await axiosInstance.get("/hotels/faqs");
        if (faqsRes.data.Success && faqsRes.data.Data) {
          setHotelFaqs(faqsRes.data.Data);
        }
        setLoading(prev => ({ ...prev, faqs: false }));

      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading({
          offers: false,
          deals: false,
          seasons: false,
          destinations: false,
          faqs: false
        });
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHotelData({ ...hotelData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      Location: hotelData.location,
      Checkin: hotelData.checkin,
      Checkout: hotelData.checkout,
      Guest_Type: hotelData.guestType,
      Guest_Count: hotelData.guestCount,
      Room_Count: hotelData.roomCount,
    };

    navigate("/hotelsearch", { state: { hotelData: payload } });
  };

  const LoadingSpinner = () => (
    <div className="text-center py-4">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container d-flex justify-content-center">
        <div className="w-100" style={{ maxWidth: "900px" }}>
          <h3 className="text-center" style={{ marginTop: "100px", color: "#000957" }}>
            Book Your Stay Destination
          </h3>
          <form onSubmit={handleSubmit} className="p-4 border rounded shadow" style={{ height: "auto" }}>
            <div style={{ marginTop: "30px" }}>
              <label className="form-label">Location</label>
              <select className="form-select" name="location" value={hotelData.location} onChange={handleChange}>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label" style={{ marginTop: "30px" }}>
                  Check-in Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="checkin"
                  value={hotelData.checkin}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ marginTop: "30px" }}>
                  Check-out Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="checkout"
                  value={hotelData.checkout}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label" style={{ marginTop: "30px" }}>
                  Guest Type
                </label>
                <select className="form-select" name="guestType" value={hotelData.guestType} onChange={handleChange}>
                  {guestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Guest Count</label>
                <input
                  type="number"
                  className="form-control"
                  name="guestCount"
                  min="1"
                  max="10"
                  value={hotelData.guestCount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Room Count</label>
                <select className="form-select" name="roomCount" value={hotelData.roomCount} onChange={handleChange}>
                  {roomCounts.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn text-white w-100" style={{ background: "#000957" }}>
              Search Hotels
            </button>
          </form>

         
          <div className="mt-5">
            <h2 className="mb-4 text-center">Hotel Offers</h2>
            {loading.offers ? (
              <LoadingSpinner />
            ) : hotelOffers.length === 0 ? (
              <p className="text-center text-muted">No hotel offers available at the moment.</p>
            ) : (
              <div className="row">
                {hotelOffers.map((offer) => (
                  <div key={offer.HotelOfferId} className="col-md-4 mb-3">
                    <div className="card shadow-sm h-100">
                      <img
                        src={offer.Hotel_Image}
                        className="card-img-top"
                        alt={offer.Hotel_Name}
                        style={{ height: "150px", objectFit: "cover" }}
                      />
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{offer.Hotel_Name}</h5>
                        <p className="card-text flex-grow-1">{offer.HotelOffer_Description}</p>
                        <div className="mt-auto">
                          <span className="badge bg-success">{offer.DiscountPercentage}% OFF</span>
                          <p className="text-muted mb-0 mt-2">
                            Valid till: {new Date(offer.Valid_Date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

         
          <div className="mt-5">
            <h2 className="mb-4 text-center">Daily Steal Deals</h2>
            {loading.deals ? (
              <LoadingSpinner />
            ) : dailyDeals.length === 0 ? (
              <p className="text-center text-muted">No daily deals available at the moment.</p>
            ) : (
              <div className="row">
                {dailyDeals.map((deal) => {
                  const fullStars = Math.round(deal.Rating || 0);
                  const emptyStars = 5 - fullStars;

                  return (
                    <div key={deal.DealId} className="col-md-6 col-lg-4 mb-3">
                      <div className="card shadow-sm h-100">
                        <img
                          src={deal.Image}
                          className="card-img-top"
                          style={{ height: "150px", objectFit: "cover" }}
                          alt={deal.Hotel_Name}
                        />
                        <div className="card-body d-flex flex-column">
                          <h5 className="card-title">{deal.Hotel_Name}</h5>
                          <p className="card-text">{deal.Location}</p>
                          <div className="mb-2">
                            {Array.from({ length: fullStars }, (_, i) => (
                              <span key={`full-${i}`}>⭐</span>
                            ))}
                            {Array.from({ length: emptyStars }, (_, i) => (
                              <span key={`empty-${i}`}>☆</span>
                            ))}
                          </div>
                          <div className="mt-auto">
                            <p className="mb-1">
                              <b>₹{deal.Price}</b>
                            </p>
                            <small className="text-muted">₹{deal.Price_Per_Night} per night</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

         
          <div className="mt-5">
            <h2 className="mb-4 text-center">Different Seasons</h2>
            {loading.seasons ? (
              <LoadingSpinner />
            ) : seasons.length === 0 ? (
              <p className="text-center text-muted">No season information available.</p>
            ) : (
              <div className="row">
                {seasons.map((season) => (
                  <div key={season.SeasonId} className="col-md-6 col-lg-4 mb-3">
                    <div className="card shadow-sm h-100">
                      <img 
                        src={season.Location_Image} 
                        className="card-img-top" 
                        alt={season.Location_Name}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{season.Season_Name}</h5>
                        <p className="card-text">{season.Location_Name}</p>
                        <small className="text-muted">
                          {new Date(season.Start_Date).toLocaleDateString()} to{" "}
                          {new Date(season.End_Date).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="mt-5">
            <h2 className="mb-4 text-center">Popular Destinations</h2>
            {loading.destinations ? (
              <LoadingSpinner />
            ) : popularDestinations.length === 0 ? (
              <p className="text-center text-muted">No popular destinations available.</p>
            ) : (
              <div className="d-flex overflow-auto pb-3">
                {popularDestinations.map((dest) => (
                  <div
                    key={dest.DestinationId}
                    className="card me-3 shadow-sm"
                    style={{ minWidth: "250px", height: "300px" }}
                  >
                    <img 
                      src={dest.Location_Image} 
                      className="card-img-top" 
                      alt={dest.Location_Name}
                      style={{ height: "150px", objectFit: "cover" }}
                    />
                    <div className="card-body">
                      <h6 className="card-title">{dest.Location_Name}</h6>
                      <p className="card-text text-muted small">{dest.Location_Description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="mt-5">
            <h2 className="mb-4 text-center">Hotel Booking FAQs</h2>
            {loading.faqs ? (
              <LoadingSpinner />
            ) : hotelFaqs.length === 0 ? (
              <p className="text-center text-muted">No FAQs available at the moment.</p>
            ) : (
              <div className="row">
                {hotelFaqs.map((faq) => (
                  <div key={faq.FaqId} className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <h5 className="card-title fw-bold">{faq.Question}</h5>
                        <p className="card-text text-muted">{faq.Answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HotelPage;