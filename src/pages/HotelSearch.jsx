import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../Components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const HotelSearch = () => {
  const navigate = useNavigate();
  const [allHotels, setAllHotels] = useState([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [search, setSearch] = useState({
    city: "",
    checkIn: "",
    checkOut: "",
    adults: 2,
    children: 0,
    rooms: 1,
  });

  const cities = ["Dubai", "London", "New York", "Paris", "Tokyo", "Mumbai", "Sydney", "Singapore"];
  const [cityQuery, setCityQuery] = useState("");

  const [filters, setFilters] = useState({
    maxPrice: 30000,
    minRating: 0,
    freeCancellation: false,
    breakfastIncluded: false,
    amenities: [],
  });
  const [sortBy, setSortBy] = useState("priceAsc");

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async (hotelSearchId = null) => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching hotels from API...", hotelSearchId ? `with hotelSearchId: ${hotelSearchId}` : "all hotels");

      const params = hotelSearchId ? { hotelSearchId } : {};
      const res = await axiosInstance.get("admin/adminhotel", { params });

      console.log("Raw API Response:", res);
      console.log("Response data:", res.data);

      let hotelsData = [];

      if (res.data && typeof res.data === "object") {
        if (res.data.hasOwnProperty("Success") || res.data.hasOwnProperty("success")) {
          const success = res.data.Success ?? res.data.success;
          const data = res.data.Data ?? res.data.data;
          const message = res.data.Message ?? res.data.message;

          if (success) {
            if (Array.isArray(data)) {
              hotelsData = data;
            } else if (data && typeof data === "object") {
              hotelsData = [data];
            } else {
              hotelsData = [];
            }
          } else {
            throw new Error(message || "Failed to fetch hotels");
          }
        } else if (Array.isArray(res.data)) {
          hotelsData = res.data;
        } else {
          hotelsData = [res.data];
        }
      } else if (Array.isArray(res.data)) {
        hotelsData = res.data;
      } else {
        throw new Error("Unexpected response format from server");
      }

      console.log("Extracted hotels data:", hotelsData);

      const normalized = hotelsData.map((hotel, index) => {
        console.log(`Processing hotel ${index + 1}:`, {
          id: hotel.HotelId || hotel.hotelId,
          name: hotel.Hotel_Name || hotel.hotelName,
          rawPictures: hotel.Hotel_PicturesArray || hotel.Hotel_Pictures,
          type: typeof (hotel.Hotel_PicturesArray || hotel.Hotel_Pictures),
        });

        const processedHotel = {
          ...hotel,
          HotelId: hotel.HotelId || hotel.hotelId,
          Hotel_Name: hotel.Hotel_Name || hotel.hotelName || hotel.name,
          Hotel_Pictures: processHotelImages(hotel),
          City: hotel.City || hotel.city,
          Nearest_Location: hotel.Nearest_Location || hotel.nearestLocation || hotel.location,
          Hotel_Description: hotel.Hotel_Description || hotel.hotelDescription || hotel.description,
          Price: Number(hotel.Price || hotel.price) || 0,
          Rating: Number(hotel.Rating || hotel.rating) || 0,
          FreeCancellation: Boolean(hotel.FreeCancellation || hotel.freeCancellation),
          BreakfastIncluded: Boolean(hotel.BreakfastIncluded || hotel.breakfastIncluded),
          selectedImage: null,
        };

        if (processedHotel.Hotel_Pictures.length > 0) {
          processedHotel.selectedImage = processedHotel.Hotel_Pictures[0];
        }

        console.log(`Processed hotel ${index + 1} images:`, processedHotel.Hotel_Pictures);
        return processedHotel;
      });

      console.log("Final normalized hotels:", normalized);

      setHotels(normalized);
      setAllHotels(normalized);
    } catch (err) {
      console.error("Error fetching hotels:", err);

      let errorMessage = "Failed to load hotels. Please try again later.";

      if (err.response) {
        const responseData = err.response.data;
        if (responseData && (responseData.Message || responseData.message)) {
          errorMessage = responseData.Message || responseData.message;
        } else {
          errorMessage = `Server error: ${err.response.status} - ${err.response.statusText}`;
        }
      } else if (err.request) {
        errorMessage = "Network error: Unable to connect to server. Please check your connection.";
      } else {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processHotelImages = (hotel) => {
    if (hotel.Hotel_PicturesArray || hotel.hotel_PicturesArray) {
      const pictures = hotel.Hotel_PicturesArray || hotel.hotel_PicturesArray;
      try {
        if (Array.isArray(pictures)) {
          const urls = pictures
            .filter((url) => url && typeof url === "string" && url.trim() !== "")
            .map((url) => url.trim());
          if (urls.length > 0) return urls;
        } else if (typeof pictures === "string") {
          try {
            const parsed = JSON.parse(pictures);
            if (Array.isArray(parsed)) {
              const urls = parsed
                .map((item) => {
                  if (typeof item === "string") return item.trim();
                  if (item && typeof item === "object") return item.ImageUrl || item.url || item.image || null;
                  return null;
                })
                .filter((url) => url && url.trim() !== "");
              if (urls.length > 0) return urls;
            }
          } catch (e) {
            if (pictures.includes(",")) {
              const urls = pictures
                .split(",")
                .map((url) => url.trim())
                .filter((url) => url && url.trim() !== "");
              if (urls.length > 0) return urls;
            }

            if (pictures.trim() !== "") {
              return [pictures.trim()];
            }
          }
        }
      } catch (error) {
        console.warn("Error processing Hotel_PicturesArray:", error);
      }
    }

    if (hotel.Hotel_Pictures || hotel.hotel_Pictures) {
      const pictures = hotel.Hotel_Pictures || hotel.hotel_Pictures;
      try {
        if (Array.isArray(pictures)) {
          const urls = pictures
            .filter((url) => url && typeof url === "string" && url.trim() !== "")
            .map((url) => url.trim());
          if (urls.length > 0) return urls;
        } else if (typeof pictures === "string") {
          try {
            const parsed = JSON.parse(pictures);
            if (Array.isArray(parsed)) {
              const urls = parsed
                .map((item) => {
                  if (typeof item === "string") return item.trim();
                  if (item && typeof item === "object") return item.ImageUrl || item.url || item.image || null;
                  return null;
                })
                .filter((url) => url && url.trim() !== "");
              if (urls.length > 0) return urls;
            }
          } catch (e) {
            if (pictures.includes(",")) {
              const urls = pictures
                .split(",")
                .map((url) => url.trim())
                .filter((url) => url && url.trim() !== "");
              if (urls.length > 0) return urls;
            }

            if (pictures.trim() !== "") {
              return [pictures.trim()];
            }
          }
        }
      } catch (error) {
        console.warn("Error processing Hotel_Pictures:", error);
      }
    }

    const otherImageProps = ["Images", "ImageUrls", "Hotel_Image", "MainImage", "images", "imageUrls"];
    for (const prop of otherImageProps) {
      if (hotel[prop]) {
        try {
          if (Array.isArray(hotel[prop])) {
            const urls = hotel[prop]
              .filter((url) => url && typeof url === "string" && url.trim() !== "")
              .map((url) => url.trim());
            if (urls.length > 0) return urls;
          } else if (typeof hotel[prop] === "string") {
            try {
              const parsed = JSON.parse(hotel[prop]);
              if (Array.isArray(parsed)) {
                const urls = parsed
                  .map((item) => {
                    if (typeof item === "string") return item.trim();
                    if (item && typeof item === "object") return item.ImageUrl || item.url || item.image || null;
                    return null;
                  })
                  .filter((url) => url && url.trim() !== "");
                if (urls.length > 0) return urls;
              }
            } catch (e) {
              if (hotel[prop].trim() !== "") {
                return [hotel[prop].trim()];
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing ${prop}:`, error);
        }
      }
    }

    console.warn("No valid images found for hotel:", hotel.HotelId || hotel.hotelId, hotel.Hotel_Name || hotel.hotelName);
    return ["https://via.placeholder.com/300x200?text=No+Image+Available"];
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();

    if (!search.city.trim()) {
      await fetchHotels();
      return;
    }

    await fetchHotels();

    const filteredHotels = allHotels.filter((h) => (h.City || "").toLowerCase().includes(search.city.toLowerCase().trim()));

    console.log("Search city:", search.city, "Available hotel cities:", [
      ...new Set(allHotels.map((h) => h.City).filter(Boolean)),
    ]);

    if (filteredHotels.length === 0) {
      setError(`No hotels found in "${search.city}". Try another city.`);
      setHotels([]);
    } else {
      setError("");
      setHotels(filteredHotels);
    }
  };

  const handleFilterCheckbox = (e) => {
    const { name, checked, value, type } = e.target;
    if (name === "amenities" && type === "checkbox") {
      setFilters((prev) => ({
        ...prev,
        amenities: checked ? [...prev.amenities, value] : prev.amenities.filter((a) => a !== value),
      }));
    } else if (name === "freeCancellation" || name === "breakfastIncluded") {
      setFilters((prev) => ({ ...prev, [name]: checked }));
    }
  };

  const filteredHotels = useMemo(() => {
    let list = [...hotels];

    list = list.filter((h) => h.Price <= filters.maxPrice);
    list = list.filter((h) => h.Rating >= filters.minRating);
    if (filters.freeCancellation) list = list.filter((h) => h.FreeCancellation);
    if (filters.breakfastIncluded) list = list.filter((h) => h.BreakfastIncluded);

    if (sortBy === "priceAsc") list.sort((a, b) => a.Price - b.Price);
    if (sortBy === "priceDesc") list.sort((a, b) => b.Price - a.Price);
    if (sortBy === "ratingDesc") list.sort((a, b) => b.Rating - a.Rating);

    return list;
  }, [hotels, filters, sortBy]);

  const filteredCities = useMemo(
    () => cities.filter((c) => c.toLowerCase().includes((cityQuery || search.city).toLowerCase())),
    [cityQuery, search.city]
  );

  const handleImageSelect = (hotelId, imageUrl) => {
    setHotels((prev) => prev.map((hotel) => (hotel.HotelId === hotelId ? { ...hotel, selectedImage: imageUrl } : hotel)));
  };

  const resetFilters = () => {
    fetchHotels();
    setFilters({
      maxPrice: 30000,
      minRating: 0,
      freeCancellation: false,
      breakfastIncluded: false,
      amenities: [],
    });
    setSearch((prev) => ({ ...prev, city: "" }));
    setError("");
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: 80, marginLeft: "150px" }}>
        <form
          onSubmit={handleSearchSubmit}
          className="p-5 border rounded shadow mb-4 text-white"
          style={{ maxWidth: 1200, background: "#000957" }}
        >
          <div className="row g-3 align-items-end">
            <div className="col-md-4 position-relative">
              <label className="form-label">CITY</label>
              <input
                type="text"
                className="form-control"
                placeholder="Where to?"
                value={search.city}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  setSearch((p) => ({ ...p, city: e.target.value }));
                }}
                list="citySuggestions"
              />
              <datalist id="citySuggestions">
                {cities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>

            <div className="col-md-2">
              <label className="form-label">CHECK-IN</label>
              <input
                type="date"
                className="form-control"
                value={search.checkIn}
                onChange={(e) => setSearch((p) => ({ ...p, checkIn: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">CHECK-OUT</label>
              <input
                type="date"
                className="form-control"
                value={search.checkOut}
                onChange={(e) => setSearch((p) => ({ ...p, checkOut: e.target.value }))}
                min={search.checkIn || new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">GUESTS & ROOMS</label>
              <input
                readOnly
                className="form-control"
                value={`${search.adults + search.children} Guests, ${search.rooms} Room(s)`}
                onClick={() => setShowGuestModal(true)}
              />
            </div>

            <div className="col-md-1 d-grid">
              <button type="submit" className="btn bg-white text-dark">
                Search
              </button>
            </div>
          </div>

          {showGuestModal && (
            <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.4)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Select Guests & Rooms</h5>
                    <button type="button" className="btn-close" onClick={() => setShowGuestModal(false)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Adults</label>
                      <div className="d-flex gap-2 flex-wrap">
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                          <div
                            key={n}
                            className={`border rounded p-2 text-center ${
                              search.adults === n ? "bg-primary text-white" : ""
                            }`}
                            style={{ minWidth: 40, cursor: "pointer" }}
                            onClick={() => setSearch((p) => ({ ...p, adults: n }))}
                          >
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Children</label>
                      <div className="d-flex gap-2 flex-wrap">
                        {Array.from({ length: 6 }, (_, i) => i).map((n) => (
                          <div
                            key={n}
                            className={`border rounded p-2 text-center ${
                              search.children === n ? "bg-primary text-white" : ""
                            }`}
                            style={{ minWidth: 40, cursor: "pointer" }}
                            onClick={() => setSearch((p) => ({ ...p, children: n }))}
                          >
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Rooms</label>
                      <div className="d-flex gap-2 flex-wrap">
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                          <div
                            key={n}
                            className={`border rounded p-2 text-center ${
                              search.rooms === n ? "bg-primary text-white" : ""
                            }`}
                            style={{ minWidth: 40, cursor: "pointer" }}
                            onClick={() => setSearch((p) => ({ ...p, rooms: n }))}
                          >
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowGuestModal(false)}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setShowGuestModal(false)}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {error && (
          <div className="alert alert-danger mb-4" style={{ maxWidth: 1200 }}>
            <strong>Error:</strong> {error}
            <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => fetchHotels()}>
              Retry
            </button>
            <button className="btn btn-sm btn-outline-secondary ms-2" onClick={resetFilters}>
              Show All Hotels
            </button>
          </div>
        )}

        <div className="mb-4" style={{ marginLeft: "100px" }}>
          <div className="row">
            {[
              {
                id: 1,
                title: "Get 15% Off on Dubai Stays",
                description: "Members only deal on 3-night stays.",
                image:
                  "https://thfvnext.bing.com/th/id/OIP.Zis2cXdglxbZemS3QNsdZQHaE8?o=7&cb=thfvnextrm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
              },
              {
                id: 2,
                title: "Breakfast on Us",
                description: "Free breakfast at select London hotels.",
                image: "https://digital.ihg.com/is/image/ihg/even-hotels-eugene-5405616297-4x3",
              },
              {
                id: 3,
                title: "Suite Upgrade Weekend",
                description: "Complimentary upgrade on suites in NYC.",
                image:
                  "https://tse3.mm.bing.net/th/id/OIP.SzzrYZJlfSF3t2NKYLSdWwHaFj?cb=thfvnext&pid=ImgDet&w=474&h=355&rs=1&o=7&rm=3",
              },
            ].map((p) => (
              <div className="col-md-4 mb-3" key={p.id}>
                <div className="card shadow-sm border-0 h-100">
                  <img
                    src={p.image}
                    className="card-img-top"
                    alt={p.title}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{p.title}</h5>
                    <p className="card-text text-muted">{p.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row" style={{ marginLeft: "-110px" }}>
          <div className="col-md-3">
            <div className="border rounded p-3 shadow-sm bg-light">
              <h5>Filters</h5>
              <div className="mb-3">
                <label className="form-label">Max Price (₹/night): {filters.maxPrice.toLocaleString()}</label>
                <input
                  type="range"
                  className="form-range"
                  min={2000}
                  max={30000}
                  step={500}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((p) => ({ ...p, maxPrice: Number(e.target.value) }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Min Rating: {filters.minRating.toFixed(1)}</label>
                <input
                  type="range"
                  className="form-range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={filters.minRating}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      minRating: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="freeCancel"
                  name="freeCancellation"
                  checked={filters.freeCancellation}
                  onChange={handleFilterCheckbox}
                />
                <label className="form-check-label" htmlFor="freeCancel">
                  Free Cancellation
                </label>
              </div>
              <div className="form-check mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="breakfast"
                  name="breakfastIncluded"
                  checked={filters.breakfastIncluded}
                  onChange={handleFilterCheckbox}
                />
                <label className="form-check-label" htmlFor="breakfast">
                  Breakfast Included
                </label>
              </div>
            </div>

            <div className="border rounded p-3 shadow-sm bg-light mt-3">
              <h6 className="mb-2">Sort By</h6>
              <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="ratingDesc">Rating: High to Low</option>
              </select>
            </div>
          </div>

          <div className="col-md-9">
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading hotels...</p>
              </div>
            )}

            {!loading && error && filteredHotels.length === 0 && (
              <div className="text-center py-4">
                <p className="text-danger">{error}</p>
              </div>
            )}

            {!loading && !error && filteredHotels.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted">No hotels match your filters.</p>
                <button className="btn btn-primary mt-2" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              filteredHotels.map((h) => (
                <div key={h.HotelId} className="border rounded shadow-sm mb-3 p-3">
                  <div className="row g-3 align-items-center">
                    <div className="col-md-5">
                      <img
                        src={h.selectedImage || h.Hotel_Pictures[0]}
                        alt={h.Hotel_Name}
                        className="img-fluid rounded mb-2"
                        style={{ maxHeight: "250px", objectFit: "cover", width: "100%" }}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                        }}
                      />

                      {h.Hotel_Pictures.length > 1 && (
                        <div className="d-flex flex-wrap gap-2">
                          {h.Hotel_Pictures.map((pic, idx) => (
                            <img
                              key={idx}
                              src={pic}
                              alt={`Thumbnail ${idx + 1}`}
                              className="rounded border"
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                                cursor: "pointer",
                                border: h.selectedImage === pic ? "2px solid #dc3545" : "1px solid #ddd",
                              }}
                              onClick={() => handleImageSelect(h.HotelId, pic)}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/60x60?text=X";
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className="col-md-5"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/property/${h.HotelId}`, { state: { hotel: h } })}
                    >
                      <h5 style={{ marginTop: "0px" }}>{h.Hotel_Name}</h5>
                      <div className="text-muted">
                        {h.Nearest_Location} • {h.City || ""}
                      </div>
                      <div className="mt-2">
                        <span className="badge bg-success">{Number(h.Rating).toFixed(1)} ★</span>
                        {h.FreeCancellation && <span className="badge bg-info text-dark ms-2">Free Cancellation</span>}
                        {h.BreakfastIncluded && <span className="badge bg-warning text-dark ms-2">Breakfast</span>}
                      </div>
                      <div className="mt-2">
                        {h.Hotel_Description && <p className="text-muted small">{h.Hotel_Description}</p>}
                      </div>
                    </div>

                    <div className="col-md-2 text-end">
                      <h4>₹{h.Price?.toLocaleString()}</h4>
                      <small className="text-muted">per night</small>
                      <button
                        className="btn btn-primary mt-2 w-100"
                        onClick={() => navigate(`/property/${h.HotelId}`, { state: { hotel: h } })}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HotelSearch;
