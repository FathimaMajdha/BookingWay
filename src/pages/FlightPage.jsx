import axiosInstance from "../api/axiosInstance";
import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import Footer from "./Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FlightPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [showFareModal, setShowFareModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fares, setFares] = useState([]);
  const [fareFlight, setFareFlight] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [flightDetails, setFlightDetails] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFare, setSelectedFare] = useState(null);
  const [filters, setFilters] = useState({
    lateDeparture: false,
    oneStop: false,
    refundable: false,
  });

  const cities = ["Dubai", "London", "New York", "Hyderabad", "Delhi", "Paris"];
  const filteredFrom = cities.filter((c) => c.toLowerCase().includes(fromQuery.toLowerCase()));
  const filteredTo = cities.filter((c) => c.toLowerCase().includes(toQuery.toLowerCase()));

  const fetchFares = async (flightId) => {
    try {
      const response = await axiosInstance.get(`/FlightFare/flightFare/${flightId}`);
      const faresData = response.data?.Data || response.data || [];
      setFares(faresData);
    } catch (error) {
      console.error("Error fetching fares:", error);
      setFares([]);
    }
  };

  const ads = [
    {
      id: 1,
      title: "Flat 20% Off on Emirates Flights",
      description: "Book Dubai → London flights and save big this season.",
      image: "https://miro.medium.com/v2/resize:fit:509/0*qcSLVwWT2sg4XZlL",
    },
    {
      id: 2,
      title: "Student Special Fares",
      description: "Exclusive discounts for students traveling abroad.",
      image: "https://miro.medium.com/v2/resize:fit:509/0*qcSLVwWT2sg4XZlL",
    },
    {
      id: 3,
      title: "Business Class Upgrade",
      description: "Fly in style with special upgrade offers.",
      image: "https://images.travelandleisureasia.com/wp-content/uploads/sites/2/2023/04/05124030/google-flights-1.jpeg",
    },
    {
      id: 4,
      title: "Student Special Fares",
      description: "Exclusive discounts for students traveling abroad.",
      image: "https://miro.medium.com/v2/resize:fit:509/0*qcSLVwWT2sg4XZlL",
    },
    {
      id: 5,
      title: "Student Special Fares",
      description: "Exclusive discounts for students traveling abroad.",
      image: "https://miro.medium.com/v2/resize:fit:509/0*qcSLVwWT2sg4XZlL",
    },
    {
      id: 6,
      title: "Business Class Upgrade",
      description: "Fly in style with special upgrade offers.",
      image: "https://images.travelandleisureasia.com/wp-content/uploads/sites/2/2023/04/05124030/google-flights-1.jpeg",
    },
  ];

  const passedData = location.state?.flightData;
  const [flightData, setFlightData] = useState({
    tripType: "One-way",
    source: "",
    destination: "",
    departDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    infants: 0,
    travelClass: "Economy",
    fareType: "Regular",
    passengerType: "Adults",
  });

  const user = JSON.parse(localStorage.getItem("loggedUser")) || null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFlightData({ ...flightData, [name]: value });
  };

  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    setFilters({ ...filters, [name]: checked });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  };

  useEffect(() => {
    if (passedData) {
      const mappedData = {
        tripType: passedData.Trip_Type || "One-way",
        fareType: passedData.Fare_Type || "Regular",
        source: passedData.Source || "",
        destination: passedData.Destination || "",
        departDate: formatDate(passedData.Depart_Date),
        returnDate: formatDate(passedData.Return_Date),
        adults: passedData.Adults || 1,
        children: passedData.Children || 0,
        infants: passedData.Infants || 0,
        travelClass: passedData.Travel_Class || "Economy",
        passengerType: passedData.Passenger_Type || "Adults",
      };

      setFlightData(mappedData);
      fetchAllFlights(mappedData);
    }
  }, [passedData]);

  const fetchAllFlights = async (searchData) => {
    try {
      setLoading(true);

      const { source, destination, departDate, returnDate } = searchData;

      if (!source || !destination) {
        console.warn("Source and Destination required.");
        setFlights([]);
        return;
      }

      const flightsResponse = await axiosInstance.get("/AdminFlights/flight", {
        params: {
          source,
          destination,
          departDate,
          returnDate,
        },
      });

      console.log("Full API response:", flightsResponse.data);

      if (!flightsResponse.data.Success) {
        console.error("API error:", flightsResponse.data.Message);
        setFlights([]);
        return;
      }

      const apiData = flightsResponse.data.Data || [];
      console.log("API flights data:", apiData);

      const filtered = apiData.filter(
        (f) =>
          f.Depart_Place?.trim().toLowerCase() === source.trim().toLowerCase() &&
          f.Arrival_Place?.trim().toLowerCase() === destination.trim().toLowerCase()
      );

      console.log("Filtered flights:", filtered);
      setFlights(filtered);
    } catch (error) {
      console.error("Error fetching flights", error);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAllFlights(flightData);
  };

  const [flightDetailsMap, setFlightDetailsMap] = useState({});

  const toggleFlightDetails = (flightId) => {
    setFlightDetailsMap((prev) => {
      const isOpen = prev[flightId]?.open;
      return {
        ...prev,
        [flightId]: {
          open: !isOpen,
          flight: flights.find((f) => f.FlightId === flightId),
        },
      };
    });
  };

  const filteredFlights = flights.filter((f) => {
    if (filters.lateDeparture && new Date(f.Depart_DateTime).getHours() < 18) return false;
    if (filters.oneStop && f.Stops !== 1) return false;
    if (filters.refundable && !f.IsRefundable) return false;
    return true;
  });

  console.log("After filters:", filteredFlights);

  const groupedFlights = Object.values(
    filteredFlights.reduce((acc, flight) => {
      if (!acc[flight.FlightSearchId]) {
        acc[flight.FlightSearchId] = {
          FlightSearchId: flight.FlightSearchId,
          flights: [],
        };
      }
      acc[flight.FlightSearchId].flights.push(flight);
      return acc;
    }, {})
  );

  const handleFlightSelect = (flight) => {
    setFareFlight(flight);
    setSelectedFlight(flight);
    fetchFares(flight.FlightId);
    setShowFareModal(true);

    toast.success(`✅ ${flight.Airline_Name} flight selected successfully!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  };

  const handleFareSelect = (fare) => {
    setSelectedFare(fare);

    toast.info(` ${fare.FareName} fare selected!`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
  };

  const handleBookFlight = () => {
    if (!selectedFare) {
      toast.error("Please select a fare to continue", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    toast.success(` Booking ${selectedFare.FareName} on ${fareFlight.Airline_Name}...`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });

    setTimeout(() => {
      navigate("/flightbooked", {
        state: {
          flight: fareFlight,
          fare: selectedFare,
        },
      });
    }, 1000);
  };

  return (
    <>
      <Navbar />

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

      <div style={{ minHeight: "100vh" }}>
        <div className="container-fluid mt-4 mt-md-5 px-3 px-md-4">
          <button
            onClick={() => navigate("/")}
            className="btn btn-outline-primary mb-3 mb-md-4"
            style={{ marginTop: "80px" }}
          >
            ⬅ Back to Home
          </button>

          <form
            onSubmit={handleSubmit}
            className="p-3 p-md-4 border rounded shadow mb-4 text-white"
            style={{ background: "#000957" }}
          >
            <div className="row g-3 g-md-4">
              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <label className="form-label fw-medium">TRIP TYPE</label>
                <select className="form-select" name="tripType" value={flightData.tripType} onChange={handleChange}>
                  <option>One-way</option>
                  <option>Round-trip</option>
                  <option>Multi-city</option>
                </select>
              </div>
              <div className="col-12 col-sm-6 col-md-4 col-lg-3 position-relative">
                <label className="form-label fw-medium">FROM</label>
                <input
                  type="text"
                  className="form-control"
                  value={flightData.source}
                  onChange={(e) => {
                    setFromQuery(e.target.value);
                    setFlightData({ ...flightData, source: e.target.value });
                  }}
                  placeholder="Enter city"
                />
                {fromQuery && filteredFrom.length > 0 && (
                  <div className="position-absolute w-100 mt-1" style={{ zIndex: 1050 }}>
                    <div className="list-group">
                      {filteredFrom.map((city) => (
                        <button
                          key={city}
                          type="button"
                          className="list-group-item list-group-item-action text-start"
                          onClick={() => {
                            setFlightData({ ...flightData, source: city });
                            setFromQuery("");
                          }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-lg-3 position-relative">
                <label className="form-label fw-medium">TO</label>
                <input
                  type="text"
                  className="form-control"
                  value={flightData.destination}
                  onChange={(e) => {
                    setToQuery(e.target.value);
                    setFlightData({ ...flightData, destination: e.target.value });
                  }}
                  placeholder="Enter city"
                />
                {toQuery && filteredTo.length > 0 && (
                  <div className="position-absolute w-100 mt-1" style={{ zIndex: 1050 }}>
                    <div className="list-group">
                      {filteredTo.map((city) => (
                        <button
                          key={city}
                          type="button"
                          className="list-group-item list-group-item-action text-start"
                          onClick={() => {
                            setFlightData({ ...flightData, destination: city });
                            setToQuery("");
                          }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <label className="form-label fw-medium">DEPART</label>
                <input
                  type="date"
                  className="form-control"
                  name="departDate"
                  value={flightData.departDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <label className="form-label fw-medium">RETURN</label>
                <input
                  type="date"
                  className="form-control"
                  name="returnDate"
                  value={flightData.returnDate}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <label className="form-label fw-medium">PASSENGERS & CLASS</label>
                <input
                  type="text"
                  className="form-control"
                  readOnly
                  value={`${
                    (flightData.adults || 0) + (flightData.children || 0) + (flightData.infants || 0)
                  } Travellers, ${flightData.travelClass || "Select Class"}`}
                  onClick={() => setShowModal(true)}
                  style={{ cursor: "pointer" }}
                />
              </div>

              <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                <label className="form-label fw-medium d-block">FARE TYPE</label>
                <div className="d-flex flex-wrap gap-3 mt-1">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="fareType"
                      id="fareRegular"
                      value="Regular"
                      checked={flightData.fareType === "Regular"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="fareRegular">
                      Regular
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="fareType"
                      id="fareStudent"
                      value="Student"
                      checked={flightData.fareType === "Student"}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="fareStudent">
                      Student
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4 col-lg-3 d-flex align-items-end">
                <button type="submit" className="btn bg-white text-secondary w-100 fw-medium py-2">
                  Search Flights
                </button>
              </div>
            </div>
          </form>

          {showModal && (
            <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Select Passengers & Class</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mt-3">
                      <label className="form-label fw-medium">Adults (12y+)</label>
                      <div className="d-flex gap-2 flex-wrap">
                        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
                          <div
                            key={`adult-${num}`}
                            className={`border rounded p-2 text-center cursor-pointer ${
                              flightData.adults === num ? "bg-primary text-white" : ""
                            }`}
                            style={{ minWidth: "50px", flex: "1 0 auto" }}
                            onClick={() => setFlightData((prev) => ({ ...prev, adults: num }))}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label fw-medium">Children (2y - 12y)</label>
                      <div className="d-flex gap-2 flex-wrap">
                        {Array.from({ length: 7 }, (_, i) => i).map((num) => (
                          <div
                            key={`child-${num}`}
                            className={`border rounded p-2 text-center cursor-pointer ${
                              flightData.children === num ? "bg-primary text-white" : ""
                            }`}
                            style={{ minWidth: "50px", flex: "1 0 auto" }}
                            onClick={() => setFlightData((prev) => ({ ...prev, children: num }))}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label fw-medium">Infants (below 2y)</label>
                      <div className="d-flex gap-2 flex-wrap">
                        {Array.from({ length: 7 }, (_, i) => i).map((num) => (
                          <div
                            key={`infant-${num}`}
                            className={`border rounded p-2 text-center cursor-pointer ${
                              flightData.infants === num ? "bg-primary text-white" : ""
                            }`}
                            style={{ minWidth: "50px", flex: "1 0 auto" }}
                            onClick={() => setFlightData((prev) => ({ ...prev, infants: num }))}
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="form-label fw-medium">Travel Class</label>
                      <div className="d-flex gap-2 flex-wrap">
                        {["Economy", "Premium Economy", "Business", "First Class"].map((cls) => (
                          <div
                            key={cls}
                            className={`border rounded p-2 text-center cursor-pointer ${
                              flightData.travelClass === cls ? "bg-primary text-white" : ""
                            }`}
                            style={{ minWidth: "120px", flex: "1 0 auto" }}
                            onClick={() => setFlightData((prev) => ({ ...prev, travelClass: cls }))}
                          >
                            {cls}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                      Save Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row g-3 g-md-4 mt-4">
            {ads.map((ad) => (
              <div key={ad.id} className="col-12 col-sm-6 col-lg-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="row g-0 h-100">
                    <div className="col-4">
                      <img src={ad.image} className="img-fluid h-100 w-100" style={{ objectFit: "cover" }} alt={ad.title} />
                    </div>
                    <div className="col-8">
                      <div className="card-body d-flex flex-column h-100">
                        <h6 className="card-title fw-bold">{ad.title}</h6>
                        <p className="card-text text-muted small flex-grow-1">{ad.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="container-fluid mt-4 mt-md-5">
            <div className="row g-3 g-md-4">
              <div className="col-12 col-md-3 col-lg-2">
                <div className="border rounded p-3 shadow-sm bg-light sticky-top" style={{ top: "100px" }}>
                  <h6 className="fw-bold mb-3">Popular Filters</h6>

                  <div className="form-check mt-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="lateDeparture"
                      checked={filters.lateDeparture}
                      onChange={handleFilterChange}
                    />
                    <label className="form-check-label">Late Departure</label>
                  </div>

                  <div className="form-check mt-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="oneStop"
                      checked={filters.oneStop}
                      onChange={handleFilterChange}
                    />
                    <label className="form-check-label">1 Stop</label>
                  </div>

                  <div className="form-check mt-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="refundable"
                      checked={filters.refundable}
                      onChange={handleFilterChange}
                    />
                    <label className="form-check-label">Refundable Fares</label>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-9 col-lg-10">
                {loading && (
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading flights...</p>
                  </div>
                )}

                {!loading && groupedFlights.length === 0 && (
                  <div className="text-center my-5">
                    <img
                      src="https://tse3.mm.bing.net/th/id/OIP.3Np_T0hESe7CIOC3VMawuwHaHU?cb=thfvnext&rs=1&pid=ImgDetMain&o=7&rm=3"
                      alt="No Flights"
                      style={{ width: "100px", opacity: 0.7 }}
                    />
                    <h5 className="mt-3">No Flights Found</h5>
                    <p className="text-muted">Try adjusting your search — different dates, destinations, or filters.</p>
                  </div>
                )}

                {!loading &&
                  groupedFlights.map((group) => (
                    <div key={group.FlightSearchId} className="mb-4 border rounded shadow-sm p-3">
                      <h6 className="mb-3 fw-bold">Flights Available</h6>

                      {group.flights.map((f) => (
                        <React.Fragment key={f.FlightId}>
                          <div className="border rounded mb-3 p-3">
                            <div className="row g-3 align-items-center">
                              <div className="col-12 col-sm-6 col-md-3">
                                <div className="d-flex align-items-center gap-2">
                                  <img
                                    src={f.Airline_Icon}
                                    alt={f.Airline_Name}
                                    className="img-fluid"
                                    style={{
                                      maxHeight: "40px",
                                      maxWidth: "40px",
                                      objectFit: "contain",
                                    }}
                                  />
                                  <div>
                                    <strong className="d-block">{f.Airline_Name}</strong>
                                    <small className="text-muted">
                                      {f.IATA_Code}, {f.FlightNumber}
                                    </small>
                                  </div>
                                </div>
                              </div>

                              <div className="col-6 col-sm-3 col-md-2">
                                <strong className="fs-5">
                                  {new Date(f.Depart_DateTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </strong>
                                <br />
                                <small className="text-muted">{f.Depart_Place}</small>
                              </div>

                              <div className="col-6 col-sm-3 col-md-2">
                                <strong>{f.Depart_Duration}</strong>
                                <br />
                                <hr className="my-1" />
                                <small className="text-muted">
                                  {f.Stops || 0} Stop{(f.Stops || 0) > 1 ? "s" : ""}
                                </small>
                              </div>

                              <div className="col-6 col-sm-3 col-md-2">
                                <strong className="fs-5">
                                  {new Date(f.Arrival_DateTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </strong>
                                <br />
                                <small className="text-muted">{f.Arrival_Place}</small>
                              </div>

                              <div className="col-6 col-sm-3 col-md-3">
                                <div className="text-center text-md-end">
                                  <strong className="fs-4 text-danger d-block">₹{f.Base_Fare}</strong>
                                  <small className="text-muted d-block mb-2">per Adult</small>

                                  <button
                                    className="btn btn-sm text-white w-100 mb-2"
                                    onClick={() => handleFlightSelect(f)}
                                    style={{ background: "#000957" }}
                                  >
                                    View Fares
                                  </button>

                                  <button
                                    className="btn btn-sm text-primary w-100"
                                    onClick={() => toggleFlightDetails(f.FlightId)}
                                  >
                                    {flightDetailsMap[f.FlightId]?.open ? "Hide Details" : "View Details"}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {flightDetailsMap[f.FlightId]?.open && (
                              <div className="border rounded p-3 mt-3 bg-light">
                                <h6 className="fw-bold">Flight Details</h6>
                                <small className="text-muted">
                                  {f.Depart_Place} → {f.Arrival_Place} ·{" "}
                                  {new Date(f.Depart_DateTime).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </small>

                                <div className="d-flex align-items-center mt-2 mb-3 flex-wrap gap-2">
                                  <img
                                    src={f.Airline_Icon}
                                    alt={f.Airline_Name}
                                    className="img-fluid"
                                    style={{
                                      maxHeight: "30px",
                                      maxWidth: "30px",
                                      objectFit: "contain",
                                    }}
                                  />
                                  <span>
                                    {f.Airline_Name} {f.FlightNumber}
                                  </span>
                                  <strong className="rounded border p-1 px-2">{f.Aircraft_Type || "Standard"}</strong>
                                </div>

                                <div className="row g-3">
                                  <div className="col-6 col-sm-4 col-md-2">
                                    <strong>Departure</strong>
                                    <br />
                                    <small>
                                      {new Date(f.Depart_DateTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </small>
                                    <br />
                                    <small className="text-muted">{f.Depart_Place}</small>
                                  </div>
                                  <div className="col-6 col-sm-4 col-md-2">
                                    <strong>Duration</strong>
                                    <br />
                                    <small>{f.Depart_Duration}</small>
                                  </div>
                                  <div className="col-6 col-sm-4 col-md-2">
                                    <strong>Arrival</strong>
                                    <br />
                                    <small>
                                      {new Date(f.Arrival_DateTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </small>
                                    <br />
                                    <small className="text-muted">{f.Arrival_Place}</small>
                                  </div>
                                  <div className="col-6 col-sm-4 col-md-2">
                                    <strong>Baggage</strong>
                                    <br />
                                    <small>{f.Baggage || "N/A"}</small>
                                  </div>
                                  <div className="col-6 col-sm-4 col-md-2">
                                    <strong>Cabin</strong>
                                    <br />
                                    <small>{f.Cabin || "N/A"}</small>
                                  </div>
                                  <div className="col-6 col-sm-4 col-md-2">
                                    <strong>Check-in</strong>
                                    <br />
                                    <small>{f.CheckIn || "N/A"}</small>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  ))}

                {showFareModal && fareFlight && (
                  <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", marginTop: "-70px" }}
                  >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title fw-bold">Choose Your Fare</h5>
                          <button className="btn-close" onClick={() => setShowFareModal(false)}></button>
                        </div>
                        <div className="modal-body">
                          <small className="text-muted">
                            {fareFlight.Depart_Place} → {fareFlight.Arrival_Place}
                          </small>
                          <br />
                          <small className="text-muted">
                            {fareFlight.Airline_Name} · Departure at{" "}
                            {new Date(fareFlight.Depart_DateTime).toLocaleTimeString()} – Arrival at{" "}
                            {new Date(fareFlight.Arrival_DateTime).toLocaleTimeString()}
                          </small>

                          <div className="row g-3 mt-3">
                            {fares.length === 0 ? (
                              <div className="col-12">
                                <p className="text-muted text-center">No fares available for this flight.</p>
                              </div>
                            ) : (
                              fares.map((fare) => (
                                <div className="col-12 col-sm-6 col-lg-4" key={fare.FareId}>
                                  <div
                                    className={`border rounded p-3 h-100 shadow-sm ${
                                      selectedFare?.FareId === fare.FareId ? "border-danger border-2" : "border-secondary"
                                    }`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleFareSelect(fare)}
                                  >
                                    <h6 className="fw-bold">{fare.FareName}</h6>
                                    <p className="text-danger fw-bold fs-5">₹{fare.Price} / Adult</p>
                                    <div className="small">
                                      <div>
                                        <strong>Baggage:</strong> {fare.Baggage}
                                      </div>
                                      <div>
                                        <strong>Refund:</strong> {fare.Refund}
                                      </div>
                                      <div>
                                        <strong>Change Fee:</strong> {fare.ChangeFee}
                                      </div>
                                      <div>
                                        <strong>Meals:</strong> {fare.Meals}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button
                            className="btn text-white fw-medium py-2 px-4"
                            style={{ background: "#000957" }}
                            disabled={!selectedFare}
                            onClick={handleBookFlight}
                          >
                            {selectedFare ? `Book ${selectedFare.FareName}` : "Select a Fare to Book"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FlightPage;
