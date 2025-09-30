import React, { useState, useEffect } from "react";
import Navbar from "../Components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Footer from "./Footer";

const Home = () => {
  const navigate = useNavigate();

  const cities = ["Kozhikode", "Kochi", "Paris (CDG)", "Dubai (DXB)", "Mumbai (BOM)", "Chennai (MAA)"];

  const [flightOffers, setFlightOffers] = useState([]);
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [flightFaqs, setFlightFaqs] = useState([]);

  const [flightData, setFlightData] = useState({
    source: cities[0],
    destination: cities[1],
    departDate: "2025-04-23",
    returnDate: "2025-05-24",
    tripType: "One-way",
    passengerType: "Adults",
    travelClass: "Economy",
    fareType: "Regular",
  });

  useEffect(() => {
    axiosInstance.get("/flights/offers").then((res) => {
      if (res.data.Success && res.data.Data && res.data.Data.length > 0) {
        setFlightOffers(res.data.Data);
      }
    });
    
    axiosInstance.get("/flights/popular-routes").then((res) => {
      if (res.data.Success && res.data.Data && res.data.Data.length > 0) {
        setPopularRoutes(res.data.Data);
      }
    });
    
    axiosInstance.get("/flights/faqs").then((res) => {
      if (res.data.Success && res.data.Data && res.data.Data.length > 0) {
        setFlightFaqs(res.data.Data);
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFlightData({ ...flightData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      Trip_Type: flightData.tripType,
      Fare_Type: flightData.fareType,
      Source: flightData.source,
      Destination: flightData.destination,
      Depart_Date: flightData.departDate,
      Return_Date: flightData.returnDate,
      Adults: flightData.passengerType === "Adults" ? 1 : 0,
      Children: flightData.passengerType === "Children" ? 1 : 0,
      Infants: flightData.passengerType === "Infants" ? 1 : 0,
      Travel_Class: flightData.travelClass,
      Passenger_Type: flightData.passengerType,
    };
    navigate("/flightdetails", { state: { flightData: payload } });
  };

  return (
    <>
      <Navbar />
      <div className="container-fluid my-3 my-md-5 px-3 px-md-4 px-lg-5">
       
        <h5 className="text-center mb-4  " style={{ color: "#000957", marginTop: "100px" }}>
          Book Domestic and International Flight Tickets
        </h5>

        
        <form onSubmit={handleSubmit} className="p-3 p-md-4 border rounded shadow bg-white mx-auto" style={{ maxWidth: "900px" }}>
          <div className="row mb-3">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <label className="form-label fw-medium">Source</label>
              <select className="form-select" name="source" value={flightData.source} onChange={handleChange}>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-medium">Destination</label>
              <select className="form-select" name="destination" value={flightData.destination} onChange={handleChange}>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <label className="form-label fw-medium">Depart Date</label>
              <input
                type="date"
                className="form-control"
                name="departDate"
                value={flightData.departDate}
                onChange={handleChange}
                required
              />
            </div>
            {flightData.tripType === "Round-trip" && (
              <div className="col-12 col-md-6">
                <label className="form-label fw-medium">Return Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="returnDate"
                  value={flightData.returnDate}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-4 mb-3 mb-md-0">
              <label className="form-label fw-medium">Trip Type</label>
              <select className="form-select" name="tripType" value={flightData.tripType} onChange={handleChange}>
                <option>One-way</option>
                <option>Round-trip</option>
                <option>Multi-city</option>
              </select>
            </div>
            <div className="col-12 col-md-4 mb-3 mb-md-0">
              <label className="form-label fw-medium">Passenger Type</label>
              <select className="form-select" name="passengerType" value={flightData.passengerType} onChange={handleChange}>
                <option>Adults</option>
                <option>Children</option>
                <option>Infants</option>
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fw-medium">Travel Class</label>
              <select className="form-select" name="travelClass" value={flightData.travelClass} onChange={handleChange}>
                <option>Economy</option>
                <option>Premium Economy</option>
                <option>Business</option>
                <option>First Class</option>
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-medium">Fare Type</label>
              <select className="form-select" name="fareType" value={flightData.fareType} onChange={handleChange}>
                <option>Regular</option>
                <option>Student</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn w-100 text-white fw-medium py-2" style={{ background: "#000957" }}>
            Search Flights
          </button>
        </form>

       
        <div className="mt-5 px-2 px-md-0">
          <h2 className="mb-4 text-center fw-bold" style={{ color: "#000957", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
            Special Flight Offers
          </h2>
          <div className="row g-3 g-md-4 justify-content-center">
            {flightOffers.map((offer) => (
              <div key={offer.FlightOfferId} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-2 mb-md-0">
                <div className="card shadow-sm h-100 border-0">
                  <img
                    src={offer.Flight_Image}
                    className="card-img-top"
                    alt={offer.Flight_Name}
                    style={{ height: "180px", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x180/000957/ffffff?text=Flight+Offer";
                    }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold" style={{ fontSize: "1.1rem" }}>{offer.Flight_Name}</h5>
                    <p className="card-text flex-grow-1" style={{ fontSize: "0.9rem" }}>{offer.FlightOffer_Description}</p>
                    <div className="mt-auto">
                      <span className="badge bg-success fs-6">{offer.DiscountPercentage}% OFF</span>
                      <p className="mt-2 text-muted small">Valid till: {new Date(offer.Valid_Date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

       
        <div className="mt-5 px-2 px-md-0">
          <h2 className="mb-4 text-center fw-bold" style={{ color: "#000957", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
            Popular Flight Routes
          </h2>
          <div className="d-flex overflow-auto pb-3 hide-scrollbar" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div className="d-flex flex-nowrap px-2">
              {popularRoutes.map((route) => (
                <div key={route.RouteId} className="card text-center me-3 shadow-sm border-0 flex-shrink-0" style={{ minWidth: "200px", width: "200px" }}>
                  <div className="card-body p-3 d-flex flex-column justify-content-center">
                    <h6 className="card-title fw-bold mb-2">{route.RouteFlight_Name}</h6>
                    <p className="card-text text-muted mb-0">{route.Route_From}</p>
                    {route.Price && (
                      <p className="text-success fw-bold mt-2 mb-0">From ${route.Price}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        <div className="mt-5 px-2 px-md-0">
          <h2 className="mb-4 text-center fw-bold" style={{ color: "#000957", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
            Flight Booking FAQs
          </h2>
          <div className="row g-3 g-md-4">
            {flightFaqs.map((faq) => (
              <div key={faq.FaqId} className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm h-100 border-0">
                  <div className="card-body">
                    <h5 className="card-title fw-bold" style={{ fontSize: "1.1rem" }}>{faq.Question}</h5>
                    <p className="card-text text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
                      {faq.Answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      
     
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default Home;