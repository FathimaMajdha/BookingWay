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
  const [loading, setLoading] = useState({
    offers: true,
    routes: true,
    faqs: true,
  });
  const [errors, setErrors] = useState({
    offers: null,
    routes: null,
    faqs: null,
  });

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
    axiosInstance
      .get("/flight/offers")
      .then((res) => {
        console.log("Offers response:", res.data);
        if (res.data.Success && res.data.Data) {
          setFlightOffers(res.data.Data);
        } else {
          setErrors((prev) => ({ ...prev, offers: res.data.Message || "No offers available" }));
        }
      })
      .catch((error) => {
        console.error("Error fetching offers:", error);
        setErrors((prev) => ({ ...prev, offers: "Failed to load offers" }));
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, offers: false }));
      });

    axiosInstance
      .get("/flight/popular-routes")
      .then((res) => {
        console.log("Routes response:", res.data);
        if (res.data.Success && res.data.Data) {
          setPopularRoutes(res.data.Data);
        } else {
          setErrors((prev) => ({ ...prev, routes: res.data.Message || "No popular routes available" }));
        }
      })
      .catch((error) => {
        console.error("Error fetching routes:", error);
        setErrors((prev) => ({ ...prev, routes: "Failed to load popular routes" }));
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, routes: false }));
      });

    axiosInstance
      .get("/flight/faqs")
      .then((res) => {
        console.log("FAQs response:", res.data);
        if (res.data.Success && res.data.Data) {
          setFlightFaqs(res.data.Data);
        } else {
          setErrors((prev) => ({ ...prev, faqs: res.data.Message || "No FAQs available" }));
        }
      })
      .catch((error) => {
        console.error("Error fetching FAQs:", error);
        setErrors((prev) => ({ ...prev, faqs: "Failed to load FAQs" }));
      })
      .finally(() => {
        setLoading((prev) => ({ ...prev, faqs: false }));
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

  const OfferSkeleton = () => (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-2 mb-md-0">
      <div className="card shadow-sm h-100 border-0">
        <div className="card-img-top bg-light" style={{ height: "180px" }}></div>
        <div className="card-body d-flex flex-column">
          <div className="bg-light rounded w-75 mb-2" style={{ height: "20px" }}></div>
          <div className="bg-light rounded w-100 mb-1" style={{ height: "15px" }}></div>
          <div className="bg-light rounded w-100 mb-1" style={{ height: "15px" }}></div>
          <div className="bg-light rounded w-50 mt-auto" style={{ height: "25px" }}></div>
        </div>
      </div>
    </div>
  );

  const RouteSkeleton = () => (
    <div
      className="card text-center me-3 shadow-sm border-0 flex-shrink-0 bg-light"
      style={{ minWidth: "200px", width: "200px", height: "120px" }}
    ></div>
  );

  const FaqSkeleton = () => (
    <div className="col-12 col-md-6 col-lg-4">
      <div className="card shadow-sm h-100 border-0">
        <div className="card-body">
          <div className="bg-light rounded w-100 mb-3" style={{ height: "20px" }}></div>
          <div className="bg-light rounded w-100 mb-2" style={{ height: "15px" }}></div>
          <div className="bg-light rounded w-100 mb-2" style={{ height: "15px" }}></div>
          <div className="bg-light rounded w-75" style={{ height: "15px" }}></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container d-flex justify-content-center">
        <div className="w-100" style={{ maxWidth: "900px" }}>
          <h5 className="text-center mb-4" style={{ color: "#000957", marginTop: "100px" }}>
            Book Domestic and International Flight Tickets
          </h5>

          <form
            onSubmit={handleSubmit}
            className="p-3 p-md-4 border rounded shadow bg-white mx-auto"
            style={{ maxWidth: "900px" }}
          >
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
                <select
                  className="form-select"
                  name="passengerType"
                  value={flightData.passengerType}
                  onChange={handleChange}
                >
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
              {loading.offers ? (
                Array.from({ length: 4 }).map((_, index) => <OfferSkeleton key={index} />)
              ) : errors.offers ? (
                <div className="col-12 text-center text-muted">
                  <p>{errors.offers}</p>
                </div>
              ) : flightOffers.length > 0 ? (
                flightOffers.map((offer) => (
                  <div key={offer.FlightOfferId} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-2 mb-md-0">
                    <div className="card shadow-sm h-100 border-0">
                      <img
                        src={offer.Flight_Image || "https://via.placeholder.com/300x180/000957/ffffff?text=Flight+Offer"}
                        className="card-img-top"
                        alt={offer.Flight_Name}
                        style={{ height: "180px", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x180/000957/ffffff?text=Flight+Offer";
                        }}
                      />
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title fw-bold" style={{ fontSize: "1.1rem" }}>
                          {offer.Flight_Name}
                        </h5>
                        <p className="card-text flex-grow-1" style={{ fontSize: "0.9rem" }}>
                          {offer.Flight_Description || "Special flight offer"}
                        </p>
                        <div className="mt-auto">
                          <span className="badge bg-success fs-6">{offer.Discount_Percentage}% OFF</span>
                          <p className="mt-2 text-muted small">
                            Valid till: {offer.Valid_Date ? new Date(offer.Valid_Date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center text-muted">
                  <p>No flight offers available at the moment.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 px-2 px-md-0">
            <h2 className="mb-4 text-center fw-bold" style={{ color: "#000957", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
              Popular Flight Routes
            </h2>
            <div
              className="d-flex overflow-auto pb-3 hide-scrollbar"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="d-flex flex-nowrap px-2">
                {loading.routes ? (
                  Array.from({ length: 5 }).map((_, index) => <RouteSkeleton key={index} />)
                ) : errors.routes ? (
                  <div className="text-center text-muted w-100 py-4">
                    <p>{errors.routes}</p>
                  </div>
                ) : popularRoutes.length > 0 ? (
                  popularRoutes.map((route) => (
                    <div
                      key={route.RouteId}
                      className="card text-center me-3 shadow-sm border-0 flex-shrink-0"
                      style={{ minWidth: "200px", width: "200px" }}
                    >
                      <div className="card-body p-3 d-flex flex-column justify-content-center">
                        <h6 className="card-title fw-bold mb-2">{route.RouteFlight_Name}</h6>
                        <p className="card-text text-muted mb-0">- {route.Route_From}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted w-100 py-4">
                    <p>No popular routes available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 px-2 px-md-0">
            <h2 className="mb-4 text-center fw-bold" style={{ color: "#000957", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>
              Flight Booking FAQs
            </h2>
            <div className="row g-3 g-md-4">
              {loading.faqs ? (
                Array.from({ length: 6 }).map((_, index) => <FaqSkeleton key={index} />)
              ) : errors.faqs ? (
                <div className="col-12 text-center text-muted">
                  <p>{errors.faqs}</p>
                </div>
              ) : flightFaqs.length > 0 ? (
                flightFaqs.map((faq) => (
                  <div key={faq.FAQId} className="col-12 col-md-6 col-lg-4">
                    <div className="card shadow-sm h-100 border-0">
                      <div className="card-body">
                        <h5 className="card-title fw-bold" style={{ fontSize: "1.1rem" }}>
                          {faq.Question}
                        </h5>
                        <p className="card-text text-muted" style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
                          {faq.Answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center text-muted">
                  <p>No FAQs available at the moment.</p>
                </div>
              )}
            </div>
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
