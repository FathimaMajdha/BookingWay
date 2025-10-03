import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../api/axiosInstance";

const Flight = () => {
  const [flights, setFlights] = useState([]);
  const [flightSearches, setFlightSearches] = useState([]);
  const [flightFares, setFlightFares] = useState([]);
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [showAddFareModal, setShowAddFareModal] = useState(false);
  const [showEditFareModal, setShowEditFareModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [newFlight, setNewFlight] = useState({
    FlightSearchId: null,
    Airline_Name: "",
    Airline_Icon: "",
    IATA_Code: "",
    FlightNumber: "",
    Depart_Place: "",
    Arrival_Place: "",
    Depart_DateTime: "",
    Arrival_DateTime: "",
    TravelClass: "",
    Base_Fare: 0,
    Baggage: "",
    Cabin: "",
    CheckIn: "",
    IsRefundable: false,
    CategoryName: "",
    Depart_Duration: "",
  });

  const [newFare, setNewFare] = useState({
    FlightId: "",
    FareName: "",
    Price: "",
    Baggage: "",
    Refund: "",
    ChangeFee: "",
    Meals: "",
  });

  const [editFare, setEditFare] = useState(null);
  const [editFlight, setEditFlight] = useState(null);
  const [editSearch, setEditSearch] = useState(null);

  const [selectedSearchId, setSelectedSearchId] = useState(null);
  const [selectedFlightForFare, setSelectedFlightForFare] = useState(null);

  const [newSearch, setNewSearch] = useState({
    Source: "",
    Destination: "",
    Depart_Date: "",
    Return_Date: "",
    Trip_Type: "",
    Passenger_Type: "",
    Travel_Class: "",
    Fare_Type: "",
  });

  const [categories] = useState(["Domestic", "International"]);

  const fetchAllFlightFares = async () => {
    try {
      const response = await axiosInstance.get("/AdminFlightFare");
      if (response.data && response.data.Success) {
        setFlightFares(response.data.Data || []);
      }
    } catch (error) {
      console.error("Error fetching flight fares:", error);
      toast.error("Failed to load flight fares");
    }
  };

  const handleAddFare = async () => {
    try {
      if (!newFare.FareName || !newFare.Price || !newFare.FlightId) {
        toast.error("Please fill in all required fields");
        return;
      }

      const payload = {
        FlightId: parseInt(newFare.FlightId),
        FareName: newFare.FareName,
        Price: parseFloat(newFare.Price),
        Baggage: newFare.Baggage || "Not specified",
        Refund: newFare.Refund || "Not specified",
        ChangeFee: newFare.ChangeFee || "Not specified",
        Meals: newFare.Meals || "Not specified",
      };

      console.log("Adding fare with payload:", payload);

      const response = await axiosInstance.post("/AdminFlightFare", payload);

      if (response.data.Success) {
        toast.success("Flight fare added successfully!");
        setShowAddFareModal(false);
        setNewFare({
          FlightId: "",
          FareName: "",
          Price: "",
          Baggage: "",
          Refund: "",
          ChangeFee: "",
          Meals: "",
        });
        fetchAllFlightFares();
      } else {
        toast.error(response.data.Message || "Failed to add fare");
      }
    } catch (error) {
      console.error("Error adding flight fare:", error);
      toast.error(error.response?.data?.Message || "Error adding flight fare");
    }
  };

  const handleUpdateFare = async () => {
    if (!editFare) return;

    try {
      const payload = {
        FlightId: parseInt(editFare.FlightId),
        FareName: editFare.FareName,
        Price: parseFloat(editFare.Price),
        Baggage: editFare.Baggage || "Not specified",
        Refund: editFare.Refund || "Not specified",
        ChangeFee: editFare.ChangeFee || "Not specified",
        Meals: editFare.Meals || "Not specified",
      };

      console.log("Updating fare with payload:", payload);

      const response = await axiosInstance.put(`/AdminFlightFare/${editFare.FareId}`, payload);

      if (response.data.Success) {
        toast.success("Flight fare updated successfully!");
        setShowEditFareModal(false);
        setEditFare(null);
        fetchAllFlightFares();
      } else {
        toast.error(response.data.Message || "Failed to update fare");
      }
    } catch (error) {
      console.error("Error updating flight fare:", error);
      toast.error(error.response?.data?.Message || "Error updating flight fare");
    }
  };

  const handleDeleteFare = async (fareId) => {
    if (window.confirm("Are you sure you want to delete this fare?")) {
      try {
        const response = await axiosInstance.delete(`/AdminFlightFare/${fareId}`);

        if (response.data.Success) {
          toast.success("Flight fare deleted successfully!");
          fetchAllFlightFares();
        } else {
          toast.error(response.data.Message || "Failed to delete fare");
        }
      } catch (error) {
        console.error("Error deleting flight fare:", error);
        toast.error("Error deleting flight fare");
      }
    }
  };

  const handleOpenAddFare = (flight) => {
    setSelectedFlightForFare(flight);
    setNewFare({
      FlightId: flight.FlightId.toString(),
      FareName: "",
      Price: "",
      Baggage: "",
      Refund: "",
      ChangeFee: "",
      Meals: "",
    });
    setShowAddFareModal(true);
  };

  const handleOpenEditFare = (fare) => {
    setEditFare({ ...fare });
    setShowEditFareModal(true);
  };

  const getFaresForFlight = (flightId) => {
    return flightFares.filter((fare) => fare.FlightId === flightId);
  };

  const fetchFlightSearches = async () => {
    try {
      const res = await axiosInstance.get("/admin/AdminFlight/search");
      console.log("Flight searches API response:", res.data);

      if (res.data && res.data.Success && Array.isArray(res.data.Data)) {
        setFlightSearches(res.data.Data);
      } else {
        console.warn("Unexpected flight searches response structure:", res.data);
        setFlightSearches([]);
      }
    } catch (error) {
      console.error("Failed to load flight searches:", error);
      toast.error("Failed to load flight searches");
      setFlightSearches([]);
    }
  };

  const fetchFlights = async () => {
    try {
      const res = await axiosInstance.get("/admin/AdminFlight");
      console.log("Raw flights API response:", res.data);

      if (!res.data.Success) {
        console.error("API error:", res.data.Message);
        setFlights([]);
        return;
      }

      const apiData = res.data.Data || [];
      console.log("API flights data:", apiData);

      setFlights(apiData);
    } catch (error) {
      console.error("Failed to load flights:", error);
      toast.error("Failed to load flights");
      setFlights([]);
    }
  };

  const handleAddSearch = async () => {
    try {
      const response = await axiosInstance.post("/admin/AdminFlight/search", newSearch);

      if (response.data.Success) {
        toast.success("Flight search added!");
        fetchFlightSearches();
        setShowSearchModal(false);
        setNewSearch({
          Source: "",
          Destination: "",
          Depart_Date: "",
          Return_Date: "",
          Trip_Type: "",
          Passenger_Type: "",
          Travel_Class: "",
          Fare_Type: "",
        });
      } else {
        toast.error(response.data.Message || "Failed to add search");
      }
    } catch (error) {
      console.error("Error adding flight search:", error);
      toast.error("Error adding flight search");
    }
  };

  const handleUpdateSearch = async () => {
    try {
      const payload = {
        Source: editSearch.Source,
        Destination: editSearch.Destination,
        Depart_Date: editSearch.Depart_Date,
        Return_Date: editSearch.Return_Date,
        Trip_Type: editSearch.Trip_Type,
        Passenger_Type: editSearch.Passenger_Type,
        Travel_Class: editSearch.Travel_Class,
        Fare_Type: editSearch.Fare_Type,
      };

      const response = await axiosInstance.put(`/admin/AdminFlight/search/${editSearch.FlightSearchId}`, payload);

      if (response.data.Success) {
        toast.success("Flight search updated!");
        setEditSearch(null);
        fetchFlightSearches();
      } else {
        toast.error(response.data.Message || "Failed to update search");
      }
    } catch (error) {
      console.error("Error updating flight search:", error);
      toast.error("Error updating flight search");
    }
  };

  const handleDeleteSearch = async (id) => {
    if (window.confirm("Are you sure you want to delete this search?")) {
      try {
        const response = await axiosInstance.delete(`/admin/AdminFlight/search/${id}`);

        if (response.data.Success) {
          toast.success("Flight search deleted!");
          fetchFlightSearches();
        } else {
          toast.error(response.data.Message || "Failed to delete search");
        }
      } catch (error) {
        console.error("Error deleting flight search:", error);
        toast.error("Error deleting flight search");
      }
    }
  };

  const handleSaveNewFlight = async () => {
    try {
      const response = await axiosInstance.post("/admin/AdminFlight", newFlight);

      if (response.data.Success) {
        toast.success("Flight added!");
        fetchFlights();
        setShowAddFlightModal(false);
        setSelectedSearchId(null);
      } else {
        toast.error(response.data.Message || "Failed to add flight");
      }
    } catch (error) {
      console.error("Error adding flight:", error);
      toast.error("Error adding flight");
    }
  };

  const handleUpdateFlight = async () => {
    try {
      const response = await axiosInstance.put(`/admin/AdminFlight/${editFlight.FlightId}`, editFlight);

      if (response.data.Success) {
        toast.success("Flight updated!");
        setEditFlight(null);
        fetchFlights();
      } else {
        toast.error(response.data.Message || "Failed to update flight");
      }
    } catch (error) {
      console.error("Error updating flight:", error);
      toast.error("Error updating flight");
    }
  };

  const handleDeleteFlight = async (id) => {
    if (window.confirm("Are you sure you want to delete this flight?")) {
      try {
        const response = await axiosInstance.delete(`/admin/AdminFlight/${id}`);

        if (response.data.Success) {
          toast.success("Flight deleted!");
          fetchFlights();
        } else {
          toast.error(response.data.Message || "Failed to delete flight");
        }
      } catch (error) {
        console.error("Error deleting flight:", error);
        toast.error("Error deleting flight");
      }
    }
  };

  useEffect(() => {
    fetchFlights();
    fetchFlightSearches();
    fetchAllFlightFares();
  }, []);

  const handleOpenAddFlight = (searchId) => {
    const search = flightSearches.find((fs) => fs.FlightSearchId === searchId);
    if (!search) return toast.error("Flight search not found!");

    const depart = search.Depart_Date ? search.Depart_Date.split("T")[0] + "T09:00" : "";
    const arrival = search.Return_Date ? search.Return_Date.split("T")[0] + "T10:00" : "";

    setNewFlight({
      FlightSearchId: Number(searchId),
      Airline_Name: "",
      Airline_Icon: "",
      IATA_Code: "",
      FlightNumber: "",
      Depart_Place: search.Source || "",
      Arrival_Place: search.Destination || "",
      Depart_DateTime: depart,
      Arrival_DateTime: arrival,
      TravelClass: search.Travel_Class || "",
      Base_Fare: 0,
      Baggage: "",
      Cabin: "",
      CheckIn: "",
      IsRefundable: false,
      CategoryName: "",
      Depart_Duration: "",
    });
    setShowAddFlightModal(true);
  };

  const getFlightsForSearch = (searchId) => {
    return flights.filter((f) => Number(f.FlightSearchId) === Number(searchId));
  };

  const groupedFlights = flightSearches.map((fs) => ({
    ...fs,
    flights: getFlightsForSearch(fs.FlightSearchId),
  }));

  return (
    <div className="container-fluid bg-light min-vh-100">
      <Sidebar />
      <div className="p-4 pt-5" style={{ marginLeft: "300px", marginTop: "-2000px" }}>
        <ToastContainer position="top-right" autoClose={2000} />
        <h1 className="text-center mb-4 fw-bold text-dark">Flight Management</h1>

        <div className="d-flex justify-content-center gap-3 mb-4">
          <button className="btn btn-info" onClick={() => setShowSearchModal(true)}>
            + Flight Search
          </button>
        </div>

        {showAddFareModal && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>
                    Add Flight Fare for {selectedFlightForFare?.Airline_Name} {selectedFlightForFare?.FlightNumber}
                  </h5>
                  <button className="btn-close" onClick={() => setShowAddFareModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    placeholder="Fare Name"
                    className="form-control mb-2"
                    value={newFare.FareName}
                    onChange={(e) => setNewFare({ ...newFare, FareName: e.target.value })}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="form-control mb-2"
                    value={newFare.Price}
                    onChange={(e) => setNewFare({ ...newFare, Price: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Baggage Allowance"
                    className="form-control mb-2"
                    value={newFare.Baggage}
                    onChange={(e) => setNewFare({ ...newFare, Baggage: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Refund Policy"
                    className="form-control mb-2"
                    value={newFare.Refund}
                    onChange={(e) => setNewFare({ ...newFare, Refund: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Change Fee"
                    className="form-control mb-2"
                    value={newFare.ChangeFee}
                    onChange={(e) => setNewFare({ ...newFare, ChangeFee: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Meals Included"
                    className="form-control mb-2"
                    value={newFare.Meals}
                    onChange={(e) => setNewFare({ ...newFare, Meals: e.target.value })}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddFareModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAddFare}>
                    Add Fare
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditFareModal && editFare && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Edit Flight Fare</h5>
                  <button className="btn-close" onClick={() => setShowEditFareModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    placeholder="Fare Name"
                    className="form-control mb-2"
                    value={editFare.FareName}
                    onChange={(e) => setEditFare({ ...editFare, FareName: e.target.value })}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="form-control mb-2"
                    value={editFare.Price}
                    onChange={(e) => setEditFare({ ...editFare, Price: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Baggage Allowance"
                    className="form-control mb-2"
                    value={editFare.Baggage}
                    onChange={(e) => setEditFare({ ...editFare, Baggage: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Refund Policy"
                    className="form-control mb-2"
                    value={editFare.Refund}
                    onChange={(e) => setEditFare({ ...editFare, Refund: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Change Fee"
                    className="form-control mb-2"
                    value={editFare.ChangeFee}
                    onChange={(e) => setEditFare({ ...editFare, ChangeFee: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Meals Included"
                    className="form-control mb-2"
                    value={editFare.Meals}
                    onChange={(e) => setEditFare({ ...editFare, Meals: e.target.value })}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowEditFareModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateFare}>
                    Update Fare
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSearchModal && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Add Flight Search</h5>
                  <button className="btn-close" onClick={() => setShowSearchModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    placeholder="Source"
                    className="form-control mb-2"
                    value={newSearch.Source}
                    onChange={(e) => setNewSearch({ ...newSearch, Source: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Destination"
                    className="form-control mb-2"
                    value={newSearch.Destination}
                    onChange={(e) => setNewSearch({ ...newSearch, Destination: e.target.value })}
                  />
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={newSearch.Depart_Date}
                    onChange={(e) => setNewSearch({ ...newSearch, Depart_Date: e.target.value })}
                  />
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={newSearch.Return_Date}
                    onChange={(e) => setNewSearch({ ...newSearch, Return_Date: e.target.value })}
                  />
                  <select
                    className="form-select mb-2"
                    value={newSearch.Trip_Type}
                    onChange={(e) => setNewSearch({ ...newSearch, Trip_Type: e.target.value })}
                  >
                    <option value="">Trip Type</option>
                    <option>One-way</option>
                    <option>Round-trip</option>
                    <option>Multi-city</option>
                  </select>
                  <select
                    className="form-select mb-2"
                    value={newSearch.Passenger_Type}
                    onChange={(e) => setNewSearch({ ...newSearch, Passenger_Type: e.target.value })}
                  >
                    <option value="">Passenger Type</option>
                    <option>Adults</option>
                    <option>Children</option>
                    <option>Infants</option>
                  </select>
                  <select
                    className="form-select mb-2"
                    value={newSearch.Travel_Class}
                    onChange={(e) => setNewSearch({ ...newSearch, Travel_Class: e.target.value })}
                  >
                    <option value="">Class</option>
                    <option>Economy</option>
                    <option>Premium Economy</option>
                    <option>Business</option>
                    <option>First Class</option>
                  </select>
                  <select
                    className="form-select mb-2"
                    value={newSearch.Fare_Type}
                    onChange={(e) => setNewSearch({ ...newSearch, Fare_Type: e.target.value })}
                  >
                    <option value="">Fare Type</option>
                    <option>Regular</option>
                    <option>Student</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowSearchModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAddSearch}>
                    Save Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddFlightModal && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Add Flight (Search ID: {newFlight.FlightSearchId})</h5>
                  <button className="btn-close" onClick={() => setShowAddFlightModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control mb-2"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setNewFlight({ ...newFlight, Airline_Icon: URL.createObjectURL(file) });
                      }
                    }}
                  />

                  {newFlight.Airline_Icon && (
                    <img
                      src={newFlight.Airline_Icon}
                      alt="Airline Icon"
                      className="mb-2"
                      style={{ width: "50px", height: "50px", objectFit: "contain" }}
                    />
                  )}

                  <input
                    className="form-control mb-2"
                    placeholder="Airline Name"
                    value={newFlight.Airline_Name}
                    onChange={(e) => setNewFlight({ ...newFlight, Airline_Name: e.target.value })}
                  />

                  <input
                    className="form-control mb-2"
                    placeholder="IATA Code"
                    value={newFlight.IATA_Code}
                    onChange={(e) => setNewFlight({ ...newFlight, IATA_Code: e.target.value })}
                  />

                  <input
                    className="form-control mb-2"
                    placeholder="Flight Number"
                    value={newFlight.FlightNumber}
                    onChange={(e) => setNewFlight({ ...newFlight, FlightNumber: e.target.value })}
                  />

                  <input type="text" className="form-control mb-2" value={newFlight.Depart_Place} readOnly />
                  <input type="text" className="form-control mb-2" value={newFlight.Arrival_Place} readOnly />
                  <input type="text" className="form-control mb-2" value={newFlight.TravelClass} readOnly />

                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={newFlight.Depart_DateTime}
                    onChange={(e) => setNewFlight({ ...newFlight, Depart_DateTime: e.target.value })}
                  />

                  <input
                    type="text"
                    placeholder="Duration (e.g. 2h 30m)"
                    className="form-control mb-2"
                    value={newFlight.Depart_Duration}
                    onChange={(e) => setNewFlight({ ...newFlight, Depart_Duration: e.target.value })}
                  />

                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={newFlight.Arrival_DateTime}
                    onChange={(e) => setNewFlight({ ...newFlight, Arrival_DateTime: e.target.value })}
                  />

                  <select
                    className="form-select mb-2"
                    value={newFlight.CategoryName}
                    onChange={(e) => setNewFlight({ ...newFlight, CategoryName: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Baggage Allowance"
                    className="form-control mb-2"
                    value={newFlight.Baggage}
                    onChange={(e) => setNewFlight({ ...newFlight, Baggage: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Cabin Allowance"
                    className="form-control mb-2"
                    value={newFlight.Cabin}
                    onChange={(e) => setNewFlight({ ...newFlight, Cabin: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Check-in Allowance"
                    className="form-control mb-2"
                    value={newFlight.CheckIn}
                    onChange={(e) => setNewFlight({ ...newFlight, CheckIn: e.target.value })}
                  />

                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Price"
                    value={newFlight.Base_Fare}
                    onChange={(e) => setNewFlight({ ...newFlight, Base_Fare: e.target.value })}
                  />

                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newFlight.IsRefundable}
                      onChange={(e) => setNewFlight({ ...newFlight, IsRefundable: e.target.checked })}
                    />
                    <label className="form-check-label">Refundable</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowAddFlightModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveNewFlight}>
                    Save Flight
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editFlight && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Edit Flight</h5>
                  <button className="btn-close" onClick={() => setEditFlight(null)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control mb-2"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditFlight({ ...editFlight, Airline_Icon: URL.createObjectURL(file) });
                      }
                    }}
                  />

                  {editFlight.Airline_Icon && (
                    <img
                      src={editFlight.Airline_Icon}
                      alt="Airline Icon"
                      className="mb-2"
                      style={{ width: "50px", height: "50px", objectFit: "contain" }}
                    />
                  )}

                  <input
                    className="form-control mb-2"
                    placeholder="Airline Name"
                    value={editFlight.Airline_Name}
                    onChange={(e) => setEditFlight({ ...editFlight, Airline_Name: e.target.value })}
                  />
                  <input
                    className="form-control mb-2"
                    placeholder="IATA Code"
                    value={editFlight.IATA_Code}
                    onChange={(e) => setEditFlight({ ...editFlight, IATA_Code: e.target.value })}
                  />
                  <input
                    className="form-control mb-2"
                    placeholder="Flight Number"
                    value={editFlight.FlightNumber}
                    onChange={(e) => setEditFlight({ ...editFlight, FlightNumber: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={editFlight.Depart_Place}
                    onChange={(e) => setEditFlight({ ...editFlight, Depart_Place: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={editFlight.Arrival_Place}
                    onChange={(e) => setEditFlight({ ...editFlight, Arrival_Place: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={editFlight.Depart_DateTime}
                    onChange={(e) => setEditFlight({ ...editFlight, Depart_DateTime: e.target.value })}
                  />

                  <input
                    type="text"
                    placeholder="Duration (e.g. 2h 30m)"
                    className="form-control mb-2"
                    value={editFlight.Depart_Duration}
                    onChange={(e) => setEditFlight({ ...editFlight, Depart_Duration: e.target.value })}
                  />

                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={editFlight.Arrival_DateTime}
                    onChange={(e) => setEditFlight({ ...editFlight, Arrival_DateTime: e.target.value })}
                  />
                  <select
                    className="form-select mb-2"
                    value={editFlight.CategoryName}
                    onChange={(e) => setEditFlight({ ...editFlight, CategoryName: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Baggage Allowance"
                    className="form-control mb-2"
                    value={editFlight.Baggage}
                    onChange={(e) => setEditFlight({ ...editFlight, Baggage: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Cabin Allowance"
                    className="form-control mb-2"
                    value={editFlight.Cabin}
                    onChange={(e) => setEditFlight({ ...editFlight, Cabin: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Check-in Allowance"
                    className="form-control mb-2"
                    value={editFlight.CheckIn}
                    onChange={(e) => setEditFlight({ ...editFlight, CheckIn: e.target.value })}
                  />
                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Price"
                    value={editFlight.Base_Fare}
                    onChange={(e) => setEditFlight({ ...editFlight, Base_Fare: e.target.value })}
                  />
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={editFlight.IsRefundable}
                      onChange={(e) => setEditFlight({ ...editFlight, IsRefundable: e.target.checked })}
                    />
                    <label className="form-check-label">Refundable</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setEditFlight(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary w-100" onClick={handleUpdateFlight}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editSearch && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Edit Flight Search</h5>
                  <button className="btn-close" onClick={() => setEditSearch(null)}></button>
                </div>
                <div className="modal-body">
                  <label>Source</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Enter Source"
                    value={editSearch.Source}
                    onChange={(e) => setEditSearch({ ...editSearch, Source: e.target.value })}
                  />
                  <label>Destination</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Enter Destination"
                    value={editSearch.Destination}
                    onChange={(e) => setEditSearch({ ...editSearch, Destination: e.target.value })}
                  />
                  <label>Depart Date</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={editSearch.Depart_Date}
                    onChange={(e) => setEditSearch({ ...editSearch, Depart_Date: e.target.value })}
                  />
                  <label>Return Date</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={editSearch.Return_Date}
                    onChange={(e) => setEditSearch({ ...editSearch, Return_Date: e.target.value })}
                  />
                  <select
                    className="form-select mb-2"
                    value={editSearch.Trip_Type}
                    onChange={(e) => setEditSearch({ ...editSearch, Trip_Type: e.target.value })}
                  >
                    <option>One-way</option>
                    <option>Round-trip</option>
                    <option>Multi-city</option>
                  </select>
                  <select
                    className="form-select mb-2"
                    value={editSearch.Passenger_Type}
                    onChange={(e) => setEditSearch({ ...editSearch, Passenger_Type: e.target.value })}
                  >
                    <option>Adults</option>
                    <option>Children</option>
                    <option>Infants</option>
                  </select>
                  <select
                    className="form-select mb-2"
                    value={editSearch.Travel_Class}
                    onChange={(e) => setEditSearch({ ...editSearch, Travel_Class: e.target.value })}
                  >
                    <option>Economy</option>
                    <option>Premium Economy</option>
                    <option>Business</option>
                    <option>First Class</option>
                  </select>
                  <select
                    className="form-select mb-2"
                    value={editSearch.Fare_Type}
                    onChange={(e) => setEditSearch({ ...editSearch, Fare_Type: e.target.value })}
                  >
                    <option>Regular</option>
                    <option>Student</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setEditSearch(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdateSearch}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {flightSearches.length > 0 && (
          <div className="table-responsive shadow rounded mb-5">
            <h3 className="mt-4 mb-3 text-center">Flight Searches</h3>
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Depart</th>
                  <th>Return</th>
                  <th>Trip Type</th>
                  <th>Passenger</th>
                  <th>Class</th>
                  <th>Fare</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flightSearches.map((fs) => (
                  <tr key={fs.FlightSearchId}>
                    <td>{fs.FlightSearchId}</td>
                    <td>{fs.Source}</td>
                    <td>{fs.Destination}</td>
                    <td>{fs.Depart_Date?.split("T")[0]}</td>
                    <td>{fs.Return_Date?.split("T")[0] || "-"}</td>
                    <td>{fs.Trip_Type}</td>
                    <td>{fs.Passenger_Type}</td>
                    <td>{fs.Travel_Class}</td>
                    <td>{fs.Fare_Type}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => handleOpenAddFlight(fs.FlightSearchId)}
                      >
                        + Add Flight
                      </button>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => setEditSearch({ ...fs })}>
                        Update
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSearch(fs.FlightSearchId)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {groupedFlights.length > 0 && (
          <div className="table-responsive shadow rounded">
            <h3 className="mt-4 mb-3 text-center">Flights by Search</h3>
            {groupedFlights.map((fs) => (
              <div key={fs.FlightSearchId} className="mb-4">
                <h5 className="text-primary">
                  Search ID: {fs.FlightSearchId} ({fs.Source} → {fs.Destination})
                </h5>
                {fs.flights.length > 0 ? (
                  <table className="table table-bordered table-striped align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Airline</th>
                        <th>Flight No</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Depart</th>
                        <th>Duration</th>
                        <th>Arrive</th>
                        <th>Class</th>
                        <th>Price</th>
                        <th>Fares</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fs.flights.map((flight) => {
                        const flightFaresList = getFaresForFlight(flight.FlightId);
                        return (
                          <React.Fragment key={flight.FlightId}>
                            <tr>
                              <td>
                                {flight.Airline_Name}
                                {flight.Airline_Icon && (
                                  <img
                                    src={flight.Airline_Icon}
                                    alt={flight.Airline_Name}
                                    style={{ width: "30px", height: "30px", marginLeft: "5px" }}
                                  />
                                )}
                              </td>
                              <td>{flight.FlightNumber}</td>
                              <td>{flight.Depart_Place}</td>
                              <td>{flight.Arrival_Place}</td>
                              <td>{new Date(flight.Depart_DateTime).toLocaleString()}</td>
                              <td>{flight.Depart_Duration}</td>
                              <td>{new Date(flight.Arrival_DateTime).toLocaleString()}</td>
                              <td>{flight.TravelClass}</td>
                              <td className="fw-bold text-success">₹{flight.Base_Fare}</td>
                              <td>
                                <button className="btn btn-info btn-sm me-2" onClick={() => handleOpenAddFare(flight)}>
                                  + Add Fare
                                </button>
                                {flightFaresList.length > 0 && (
                                  <span className="badge bg-primary">{flightFaresList.length} fares</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="btn btn-warning btn-sm me-2"
                                  onClick={() => setEditFlight({ ...flight })}
                                >
                                  Update
                                </button>
                                <button
                                  className="btn btn-danger btn-sm mt-2"
                                  onClick={() => handleDeleteFlight(flight.FlightId)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>

                            {flightFaresList.length > 0 && (
                              <tr>
                                <td colSpan="11" className="p-0">
                                  <div className="bg-light p-3">
                                    <h6 className="mb-2">Available Fares:</h6>
                                    <div className="row">
                                      {flightFaresList.map((fare) => (
                                        <div key={fare.FareId} className="col-md-4 mb-2">
                                          <div className="card border-primary">
                                            <div className="card-body p-2">
                                              <h6 className="card-title mb-1">{fare.FareName}</h6>
                                              <p className="card-text mb-1 text-success fw-bold">₹{fare.Price}</p>
                                              <small className="text-muted d-block">Baggage: {fare.Baggage}</small>
                                              <small className="text-muted d-block">Refund: {fare.Refund}</small>
                                              <small className="text-muted d-block">Change Fee: {fare.ChangeFee}</small>
                                              <small className="text-muted d-block">Meals: {fare.Meals}</small>
                                              <div className="mt-2">
                                                <button
                                                  className="btn btn-warning btn-sm me-1"
                                                  onClick={() => handleOpenEditFare(fare)}
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  className="btn btn-danger btn-sm"
                                                  onClick={() => handleDeleteFare(fare.FareId)}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-muted">No flights added for this search yet.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Flight;
