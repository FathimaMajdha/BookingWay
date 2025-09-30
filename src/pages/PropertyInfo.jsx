import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import axiosInstance from "../api/axiosInstance";

const tabs = [
  { id: "rooms", label: "Room Options" },
  { id: "amenities", label: "Amenities" },
  { id: "dining", label: "Food & Dining" },
  { id: "reviews", label: "Guest Reviews" },
  { id: "policies", label: "Property Policies" },
  { id: "location", label: "Location" },
  { id: "similar", label: "Similar Properties" },
];

const PropertyInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const hotel = location.state?.hotel;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [dining, setDining] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const roomImages = [
    "https://picsum.photos/400/300?random=10",
    "https://picsum.photos/400/300?random=11",
    "https://picsum.photos/400/300?random=12",
  ];

  const [activeTab, setActiveTab] = useState("rooms");
  const [isScrolling, setIsScrolling] = useState(false);

  if (!hotel) {
    return (
      <>
        <Navbar />
        <div className="container mt-5">
          <h4>No hotel details available!</h4>
        </div>
      </>
    );
  }

  const pictures = hotel.Hotel_Pictures && hotel.Hotel_Pictures.length > 0 ? hotel.Hotel_Pictures : [];

  const [mainImage, setMainImage] = useState(pictures.length > 0 ? pictures[0] : null);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    setActiveTab(id);
    setIsScrolling(true);

    const yOffset = -150;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({ top: y, behavior: "smooth" });

    setTimeout(() => setIsScrolling(false), 600);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return;
      const scrollPosition = window.scrollY + 120;
      for (let i = tabs.length - 1; i >= 0; i--) {
        const section = document.getElementById(tabs[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveTab(tabs[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolling]);

  const handleApiResponse = (response, fallback = []) => {
    if (!response.data) return fallback;

   
    if (response.data.hasOwnProperty('Success') || response.data.hasOwnProperty('success')) {
      const success = response.data.Success ?? response.data.success;
      const data = response.data.Data ?? response.data.data;

      if (success && data) {
      
        return Array.isArray(data) ? data : [data];
      } else {
        console.error('API Error:', response.data.Message || response.data.message || 'Unknown error');
        return fallback;
      }
    }
   
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object') {
      return [response.data];
    }

    return fallback;
  };

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        try {
          const roomsRes = await axiosInstance.get(`/HotelRoom/${id}`);
          console.log("Rooms API Response:", roomsRes.data);
          const roomsData = handleApiResponse(roomsRes, []);
          setRooms(roomsData);
        } catch (err) {
          console.error("Error fetching rooms:", err);
          setRooms([]);
        }

        try {
          const amenitiesRes = await axiosInstance.get(`/Amenity`);
          console.log("Amenities API Response:", amenitiesRes.data);
          const amenitiesData = handleApiResponse(amenitiesRes, []);
          setAmenities(amenitiesData);
        } catch (err) {
          console.error("Error fetching amenities:", err);
          setAmenities([]);
        }

        try {
          const similarRes = await axiosInstance.get(`/SimilarProperty/hotel/${id}`);
          console.log("Similar Properties API Response:", similarRes.data);
          const similarData = handleApiResponse(similarRes, []);
          setSimilarProperties(similarData);
        } catch (err) {
          console.error("Error fetching similar properties:", err);
          setSimilarProperties([]);
        }

        try {
          const diningRes = await axiosInstance.get(`/HotelDining/${id}`);
          console.log("Dining API Response:", diningRes.data);
          
          if (diningRes.data) {
            if (diningRes.data.Success || diningRes.data.success) {
              setDining(diningRes.data.Data || diningRes.data.data);
            } else {
              setDining(null);
            }
          } else {
            setDining(diningRes.data);
          }
        } catch (err) {
          console.error("Error fetching dining:", err);
          setDining(null);
        }

        try {
          const policyRes = await axiosInstance.get(`/HotelPolicy/${id}`);
          console.log("Policies API Response:", policyRes.data);
          const policiesData = handleApiResponse(policyRes, []);
          setPolicies(policiesData);
        } catch (err) {
          console.error("Error fetching policies:", err);
          setPolicies([]);
        }

 
        try {
          const locationRes = await axiosInstance.get(`/HotelLocation/${id}`);
          console.log("Location API Response:", locationRes.data);
          const locationsData = handleApiResponse(locationRes, []);
          setLocations(locationsData);
        } catch (err) {
          console.error("Error fetching locations:", err);
          setLocations([]);
        }

      } catch (error) {
        console.error("Error fetching property info:", error);
        setError("Failed to load property information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading property details...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mt-5">
          <div className="alert alert-danger">
            <h4>Error</h4>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container" style={{ marginTop: "100px", marginLeft: "100px" }}>
        <h3>{hotel.Hotel_Name}</h3>
        <p className="text-muted">
          {hotel.Nearest_Location} • {hotel.City}
        </p>

        <div className="row">
          <div className="col-md-8">
            <div className="row g-2">
              <div className="col-md-8 position-relative">
                <img
                  src={mainImage}
                  alt="main-hotel"
                  className="img-fluid rounded w-100"
                  style={{ height: "400px", objectFit: "cover" }}
                />
              </div>

              <div className="col-md-2 d-flex flex-column gap-2">
                {pictures.slice(0, 4).map((pic, idx) => (
                  <img
                    key={idx}
                    src={pic}
                    alt={`preview-${idx}`}
                    className="img-fluid rounded"
                    style={{
                      height: "93px",
                      objectFit: "cover",
                      cursor: "pointer",
                      border: mainImage === pic ? "2px solid red" : "none",
                    }}
                    onClick={() => setMainImage(pic)}
                  />
                ))}
              </div>
              <div
                className="position-absolute text-white rounded"
                style={{ width: "615px", height: "30px", marginTop: "380px", background: "rgba(0,0,0,0.5)" }}
              >
                Property Photos ({pictures.length})
                <button
                  style={{ marginTop: "-300px", marginLeft: "380px" }}
                  className="p-2 mb-2 bg-transparent text-white border-0"
                  onClick={() => setIsModalOpen(true)}
                >
                  View All
                </button>
              </div>

              {isModalOpen && (
                <div
                  className="modal show d-block"
                  tabIndex="-1"
                  style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                  onClick={() => setIsModalOpen(false)}
                >
                  <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">All Property Photos</h5>
                        <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                      </div>
                      <div className="modal-body">
                        <div className="mb-3 text-center">
                          <img
                            src={mainImage}
                            alt="selected"
                            className="img-fluid rounded"
                            style={{ maxHeight: "500px", objectFit: "cover", width: "100%" }}
                          />
                        </div>

                        <div className="row g-2">
                          {pictures.map((pic, idx) => (
                            <div key={idx} className="col-3 position-relative">
                              <span
                                className="position-absolute top-0 start-0 bg-white rounded-circle d-flex justify-content-center align-items-center"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  fontSize: "18px",
                                  zIndex: 10,
                                }}
                              >
                                {idx + 1}
                              </span>

                              <img
                                src={pic}
                                alt={`thumb-${idx}`}
                                className="img-fluid rounded"
                                style={{
                                  cursor: "pointer",
                                  border: mainImage === pic ? "2px solid black" : "2px solid transparent",
                                  height: "100px",
                                  objectFit: "cover",
                                  width: "100%",
                                }}
                                onClick={() => setMainImage(pic)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-md-4 ">
            <div className="border rounded p-3 shadow-sm">
              <h6 className="fw-bold">
                {rooms.length > 0 ? rooms[0].Room_Type : "Room Available"}
              </h6>
              <p className="mb-1">
                {rooms.length > 0 ? `${rooms[0].MaximumGuest_Count} Guests • 1 Room` : "3 Guests • 1 Room"}
              </p>
              <p className="text-success small mb-1">Free Cancellation till {new Date().toLocaleDateString()}</p>
              <h5 className="text-danger">
                ₹{rooms.length > 0 ? Number(rooms[0].Price).toLocaleString() : "972"} <small className="text-muted">+ taxes & fees</small>
              </h5>
              <button className="btn btn-danger w-100 mt-2" onClick={() => scrollToSection("rooms")}>
                View Room Options
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm sticky-top mt-5" style={{ top: "60px", zIndex: 1000 }}>
          <div className="container d-flex gap-3 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`btn btn-link text-decoration-none ${
                  activeTab === tab.id ? "text-danger fw-bold" : "text-dark"
                }`}
                onClick={() => scrollToSection(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <section id="rooms" className="mt-5">
          <h4>Room Options</h4>

          {Array.isArray(rooms) && rooms.length > 0 ? (
            rooms.map((room, index) => (
              <div key={room.RoomId || index} className="border rounded p-3 mb-3 shadow-sm">
                <div className="row">
                  <div className="col-md-4">
                    <img
                      src={room.Room_Image || "https://picsum.photos/400/300"}
                      alt={room.Room_Type}
                      className="img-fluid rounded mb-2"
                      style={{ height: "200px", objectFit: "cover", width: "100%" }}
                    />
                  </div>

                  <div className="col-md-8">
                    <h5>{room.Room_Type}</h5>
                    <p>{room.Room_Facility_Description}</p>
                    <p>
                      <strong>Size:</strong> {room.Sqft} sqft • <strong>Max Guests:</strong> {room.MaximumGuest_Count}
                    </p>
                    <p>
                      {room.Bed_Count} Bed • {room.Bathroom_Count} Bath
                    </p>
                    <p>
                      <strong>Available Rooms:</strong> {room.Available_Rooms}
                    </p>

                    <p className="mb-1">
                      <span className="fw-bold text-danger">₹{Number(room.Price).toLocaleString()}</span>
                      <small className="text-muted"> + taxes & fees</small>
                    </p>
                    <p className="text-muted mb-2">per room per night</p>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger"
                        onClick={() =>
                          navigate("/hotelbooked", {
                            state: {
                              hotel: hotel,
                              room: room,
                              amenities: amenities,
                              dining: dining,
                              policies: policies,
                              locations: locations,
                            },
                          })
                        }
                      >
                        Select Room
                      </button>

                      <button
                        className="btn"
                        style={{ backgroundColor: "white", color: "blue" }}
                        onClick={() => {
                          setSelectedRoom(room);
                          setRoomModalOpen(true);
                        }}
                      >
                        View More Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">No rooms available for this property.</p>
          )}
        </section>

        {roomModalOpen && selectedRoom && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onClick={() => setRoomModalOpen(false)}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedRoom.Room_Type}</h5>
                  <button type="button" className="btn-close" onClick={() => setRoomModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3 text-center">
                    <img
                      src={selectedRoom.Room_Image || "https://picsum.photos/400/300"}
                      alt={selectedRoom.Room_Type}
                      className="img-fluid rounded"
                      style={{ maxHeight: "400px", objectFit: "cover", width: "100%" }}
                    />
                  </div>

                  <h6>Room Details</h6>
                  <div className="row g-2 mb-3">
                    <div className="col-md-4">Size: {selectedRoom.Sqft} sqft</div>
                    <div className="col-md-4">{selectedRoom.Bed_Count} Beds</div>
                    <div className="col-md-4">{selectedRoom.Bathroom_Count} Baths</div>
                    <div className="col-md-4">Max Guests: {selectedRoom.MaximumGuest_Count}</div>
                    <div className="col-md-4">Available: {selectedRoom.Available_Rooms} rooms</div>
                    <div className="col-md-4">Reviews: {selectedRoom.Reviews_Count}</div>
                  </div>

                  <h6>Room Facilities</h6>
                  <p className="mb-3">{selectedRoom.Room_Facility_Description}</p>

                  {selectedRoom.Reviews_Description && (
                    <>
                      <h6>Latest Review</h6>
                      <div className="border rounded p-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{selectedRoom.Reviewer_Name}</strong>
                            <small className="text-muted ms-2">
                              {new Date(selectedRoom.Review_Date).toLocaleDateString()}
                            </small>
                          </div>
                          <span className="badge bg-success">★ {Number(selectedRoom.Rating).toFixed(1)}</span>
                        </div>
                        <p className="mt-2 mb-0">{selectedRoom.Reviews_Description}</p>
                      </div>
                    </>
                  )}

                  {amenities.length > 0 && (
                    <>
                      <h6 className="mt-3">Hotel Amenities</h6>
                      <div className="row g-2 mb-3">
                        {amenities.map((a, idx) => (
                          <div key={idx} className="col-md-6">
                            <strong>{a.Amenity_Name}</strong>
                            {a.Amenities_Description && <p className="text-muted small">{a.Amenities_Description}</p>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {dining && (
                    <>
                      <h6 className="mt-3">Dining Options</h6>
                      <p>{dining.DiningExperience}</p>
                      <p>Opening at: {dining.RestaurantHours}</p>
                      {dining.MealOptions && (
                        <div className="row g-2 mb-2">
                          {dining.MealOptions.split(",").map((meal, idx) => (
                            <div key={idx} className="col-md-4">
                              🍽️ {meal.trim()}
                            </div>
                          ))}
                        </div>
                      )}
                      {dining.SpecialFeatures && (
                        <>
                          <p className="fw-bold">Special features:</p>
                          <div className="row g-2">
                            {dining.SpecialFeatures.split(",").map((feature, idx) => (
                              <div key={idx} className="col-md-4">
                                {feature.trim()}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {policies.length > 0 && (
                    <>
                      <h6 className="mt-3">Hotel Policies</h6>
                      {policies.map((policy, idx) => (
                        <div key={idx}>
                          <p>
                            Check-in Time: {policy.CheckInTime} | Check-out Time: {policy.CheckOutTime}
                          </p>
                          <h6>Guest Policies</h6>
                          <p>{policy.GuestPolicy}</p>
                          <h6>ID Proof Required</h6>
                          <p>{policy.IdProofPolicy}</p>
                        </div>
                      ))}
                    </>
                  )}

                  {locations.length > 0 && (
                    <>
                      <h6 className="mt-3">Location</h6>
                      <p>📍 {locations[0].Address}</p>
                      <a
                        href={
                          locations[0].MapUrl ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locations[0].Address)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        View on Map
                      </a>
                    </>
                  )}
                  <br />
                  <br />
                  <p className="fw-bold fs-5 text-danger">
                    Price: ₹{Number(selectedRoom.Price).toLocaleString()} / night
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <section id="amenities" className="mt-5">
          <h4 className="mb-3">Amenities</h4>
          <div className="border rounded p-3 shadow-sm">
            {amenities.length > 0 ? (
              <div className="row g-3">
                {amenities.map((a, index) => (
                  <div key={index} className="col-md-4">
                    <div className="border rounded p-2">
                      <h6 className="fw-bold">{a.Amenity_Name}</h6>
                      {a.Amenities_Description && <p className="text-muted small mb-0">{a.Amenities_Description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No amenities information available.</p>
            )}
          </div>
        </section>

        <section id="dining" className="mt-5">
          <h4 className="mb-3">Food & Dining at {hotel.Hotel_Name}</h4>

          <div className="border rounded p-4 shadow-sm bg-white">
            {dining ? (
              <>
                <p className="text-muted">{dining.DiningExperience}</p>
                <h6>Meal Options</h6>
                <div className="row g-2 mb-4">
                  {dining.MealOptions?.split(",").map((meal, idx) => (
                    <div key={idx} className="col-md-4">
                      🍽️ {meal.trim()}
                    </div>
                  ))}
                </div>

                <h6 className="mt-4">Restaurant & Café</h6>
                <p className="text-muted">{dining.RestaurantDescription}</p>
                <p className="text-muted">
                  <strong>Opening Hours:</strong> {dining.RestaurantHours}
                </p>

                <h6 className="mt-4">Special Features</h6>
                <div className="row g-2">
                  {dining.SpecialFeatures?.split(",").map((feature, idx) => (
                    <div key={idx} className="col-md-4">
                      {feature.trim()}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted">Dining information not available for this property.</p>
            )}
          </div>
        </section>

        <section id="reviews" className="mt-5">
          <h4 className="mb-3">Guest Reviews & Rating for {hotel.Hotel_Name}</h4>

          <div className="border rounded p-4 shadow-sm bg-white">
            <div className="row">
              <div className="col-md-3 text-center">
                <div className="rounded p-3 text-white" style={{ backgroundColor: "#4CAF50" }}>
                  <p className="mb-1">Hotel Rating</p>
                  <h3 className="fw-bold mb-0">
                    {hotel.Rating ? Number(hotel.Rating).toFixed(1) : "4.2"}<span style={{ fontSize: "18px" }}>/5</span>
                  </h3>
                  <small>{rooms.length > 0 && rooms[0].Reviews_Count ? rooms[0].Reviews_Count : "527"} Ratings</small>
                  <br />
                  <small>Reviews</small>
                </div>
              </div>

              <div className="col-md-5">
                {[
                  { stars: 5, count: 215, color: "bg-success" },
                  { stars: 4, count: 138, color: "bg-info" },
                  { stars: 3, count: 79, color: "bg-warning" },
                  { stars: 2, count: 37, color: "bg-orange" },
                  { stars: 1, count: 58, color: "bg-danger" },
                ].map((item, idx) => (
                  <div key={idx} className="d-flex align-items-center mb-1">
                    <span style={{ width: "40px" }}>{item.stars} ★</span>
                    <div className="progress flex-grow-1 mx-2" style={{ height: "8px" }}>
                      <div
                        className={`progress-bar ${item.color}`}
                        role="progressbar"
                        style={{ width: `${(item.count / 527) * 100}%` }}
                      ></div>
                    </div>
                    <span>{item.count}</span>
                  </div>
                ))}
              </div>

              <div className="col-md-4">
                <h6 className="mb-2">What our guests say?</h6>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-light text-success border">polite staff (47)</span>
                  <span className="badge bg-light text-success border">good stay (29)</span>
                  <span className="badge bg-light text-success border">nice place (21)</span>
                  <span className="badge bg-light text-success border">great location (15)</span>
                  <span className="badge bg-light text-warning border">hot water (12)</span>
                  <span className="badge bg-light text-info border">golf course (11)</span>
                  <span className="badge bg-light text-success border">+ 6 more</span>
                </div>
              </div>
            </div>

            <div className="mt-4 border-top pt-3">
              <h6 className="fw-bold">Reviews Summary</h6>
              <p className="text-muted">
                Stay at the property offers a fantastic experience that guests absolutely love. The cozy ambiance, coupled
                with clean and spacious rooms, creates a pleasant experience. Many visitors highlight the helpful and polite
                staff who provide prompt service. The location is also a strong point, making it convenient for both
                business and leisure travelers.
              </p>
              <a href="#" className="text-primary">
                Read More
              </a>
            </div>

            
            <div className="mt-4">
              {rooms && rooms.length > 0 && rooms.some(room => room.Reviews_Description) ? (
                <>
                  <h6 className="fw-bold">Recent Reviews</h6>
                  {rooms.filter(room => room.Reviews_Description).map((room, idx) => (
                    <div key={room.RoomId || idx} className="mb-4">
                      <div className="border rounded p-3 mb-3 shadow-sm">
                        <div className="d-flex justify-content-between">
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center"
                              style={{ width: "40px", height: "40px", fontWeight: "bold" }}
                            >
                              {room.Reviewer_Name?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "U"}
                            </div>
                            <div className="ms-2">
                              <strong>{room.Reviewer_Name || "Anonymous"}</strong>
                              <br />
                              <small className="text-muted">Stayed {new Date(room.Review_Date).toLocaleDateString()}</small>
                            </div>
                          </div>
                          <span
                            className={`badge p-2 ${
                              room.Rating >= 4 ? "bg-success" : room.Rating >= 3 ? "bg-warning text-dark" : "bg-danger"
                            }`}
                          >
                            {Number(room.Rating).toFixed(1)}/5
                          </span>
                        </div>
                        <p className="mt-2 mb-0">{room.Reviews_Description}</p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-muted">No detailed reviews available for this property.</p>
              )}
            </div>
          </div>
        </section>

        <section id="policies" className="mt-5">
          <h4 className="mb-3">Property Policies at {hotel.Hotel_Name}</h4>

          <div className="border rounded p-4 shadow-sm bg-white">
            {policies.length > 0 ? (
              policies.map((policy, idx) => (
                <div key={policy.PolicyId || idx} className="mb-4">
                  <h6>Check-in & Check-out</h6>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      🕑 Check-in: From <strong>{policy.CheckInTime}</strong>
                    </div>
                    <div className="col-md-6">
                      🕗 Check-out: Until <strong>{policy.CheckOutTime}</strong>
                    </div>
                  </div>

                  <h6 className="mt-4">Guest Policies</h6>
                  <div className="row g-2 mb-3">
                    {policy.GuestPolicy ? (
                      policy.GuestPolicy.split(/\.(?!\d)/)
                        .map((rule) => rule.trim())
                        .filter((rule) => rule.length > 0)
                        .map((rule, idx) => (
                          <div key={idx} className="col-md-6">
                            ✅ {rule}.
                          </div>
                        ))
                    ) : (
                      <div className="col-md-6 text-muted">No specific guest policies.</div>
                    )}
                  </div>

                  <h6 className="mt-4">Cancellation / Prepayment</h6>
                  <p className="text-muted">{policy.CancellationPolicy || "Standard cancellation policy applies."}</p>

                  <h6 className="mt-4">ID Proofs Required</h6>
                  <div className="row g-2 mb-3">
                    {policy.IdProofPolicy ? (
                      policy.IdProofPolicy.split(/\.(?!\d)/)
                        .map((rule) => rule.trim())
                        .filter((rule) => rule.length > 0)
                        .map((rule, idx) => (
                          <div key={idx} className="col-md-6">
                            ✅ {rule}.
                          </div>
                        ))
                    ) : (
                      <div className="col-md-6 text-muted">Standard ID verification required.</div>
                    )}
                  </div>

                  {policy.AdditionalNotes && (
                    <>
                      <h6 className="mt-4">Additional Notes</h6>
                      <div className="row g-2">
                        {policy.AdditionalNotes.split(/\.(?!\d)/)
                          .map((rule) => rule.trim())
                          .filter((rule) => rule.length > 0)
                          .map((rule, idx) => (
                            <div key={idx} className="col-md-6">
                              ℹ️ {rule}.
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted">No policies available for this property.</p>
            )}
          </div>
        </section>

        <section id="location" className="mt-5">
          <h4 className="mb-3">Location of {hotel.Hotel_Name}</h4>

          <div className="border rounded p-4 shadow-sm bg-white">
            {locations.length > 0 ? (
              locations.map((loc, idx) => (
                <div key={loc.LocationId || idx} className="mb-3">
                  <h6>Address</h6>
                  <p className="text-muted">📍 {loc.Address}</p>

                  {loc.NearbyLandmarks && (
                    <>
                      <h6 className="mt-4">Nearby Landmarks</h6>
                      <div className="row g-2">
                        {loc.NearbyLandmarks.split(",").map((feature, idx) => (
                          <div key={idx} className="col-md-4">
                            {feature.trim()}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {loc.EmbedUrl && (
                    <>
                      <h6 className="mt-4">Map</h6>
                      <div className="border rounded shadow-sm overflow-hidden" style={{ height: "200px", maxWidth: "100%" }}>
                        <iframe
                          src={loc.EmbedUrl}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          title="Hotel Location"
                        ></iframe>
                      </div>
                    </>
                  )}

                  <div className="mt-3">
                    <a
                      href={
                        loc.MapUrl ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          loc.Address || "Kochi, Kerala"
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-transparent text-primary btn-sm"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted">No location information available.</p>
            )}
          </div>
        </section>

        <section id="similar" className="mt-5">
          <h4>Similar Properties</h4>
          {similarProperties.length > 0 ? (
            <div className="row">
              {similarProperties.map((prop, idx) => (
                <div key={prop.SimilarId || idx} className="col-md-3 mb-3">
                  <div className="card shadow-sm h-100">
                    <img
                      src={prop.ImageUrl || "https://picsum.photos/300x200"}
                      className="card-img-top"
                      alt={prop.SimilarHotel_Name}
                      style={{ height: "250px", objectFit: "cover" }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{prop.SimilarHotel_Name}</h5>
                      <p className="text-muted">{prop.Location}</p>
                      <p>
                        <strong>Price:</strong> ₹{Number(prop.Price_Per_Night).toLocaleString()} / night
                      </p>
                      <p>
                        <strong>Rating:</strong> ⭐ {Number(prop.Rating).toFixed(1)}/5
                      </p>
                      {prop.Reviews && (
                        <p>
                          <strong>Reviews:</strong> {prop.Reviews}
                        </p>
                      )}
                      <button
                        className="btn btn-outline-danger"
                        onClick={() =>
                          navigate(`/property/${prop.HotelId || prop.SimilarId}`, { 
                            state: { hotel: { ...prop, HotelId: prop.HotelId || prop.SimilarId } } 
                          })
                        }
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No similar properties available for this hotel.</p>
          )}
        </section>
      </div>
    </>
  );
};

export default PropertyInfo;