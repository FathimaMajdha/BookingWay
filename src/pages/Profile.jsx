import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import UserProfileApis from "../api/UserProfileApis";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const [editingTraveller, setEditingTraveller] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [coTravellers, setCoTravellers] = useState([]);
  const [addedUsers, setAddedUsers] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [showCoTravellerModal, setShowCoTravellerModal] = useState(false);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("loggedUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const fetchUserProfile = async () => {
    if (!user?.UserId) return;

    try {
      const res = await UserProfileApis.getMyProfile();
      setAddedUsers([res]);
      setProfilePic(res.UserImage || null);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.info("No profile found. Please create a user profile.");
      } else {
        toast.error("Failed to fetch user profile");
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user?.UserId]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const fetchCoTravellers = async () => {
    try {
      const res = await CoTravellerApis.getAll();
      setCoTravellers(res.data);
    } catch (err) {
      toast.error("Failed to fetch co-travellers");
    }
  };

  useEffect(() => {
    if (activeTab === "coTraveller") {
      fetchCoTravellers();
    }
  }, [activeTab]);

  return (
    <div className="container pt-4 d-flex ">
      <div
        className="d-flex flex-column p-5 shadow-lg align-items-center rounded-4"
        style={{ width: "300px", height: "700px " }}
      >
        <div className="position-relative profile-pic-wrapper">
          <div className="outer-circle d-flex justify-content-center align-items-center">
            <img
              src={profilePic || "https://go-assets.ibcdn.com/u/MMT/images/1745385553523-Default-img.png"}
              alt="Profile"
              className="img-fluid rounded-circle"
              style={{ width: "120px", height: "120px", objectFit: "cover" }}
            />
          </div>

          <label htmlFor="profilePicUpload" className="edit-icon d-flex justify-content-center align-items-center">
            <i className="bi bi-pencil-fill fs-4"></i>
          </label>
          <input
            type="file"
            id="profilePicUpload"
            accept="image/*"
            className="d-none"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => setProfilePic(reader.result);
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        <h5>My Account</h5>
        <button
          className={`btn mt-4 mb-3 ps-4 pe-5 pt-2 ${
            activeTab === "profile" ? "btn-danger text-white" : "btn-outline-danger"
          }`}
          onClick={() => setActiveTab("profile")}
        >
          UserProfile
        </button>

        <button
          className={`btn mb-2 ps-4 pe-5 pt-2 ${
            activeTab === "coTraveller" ? "btn-danger text-white" : "btn-outline-danger"
          }`}
          onClick={() => setActiveTab("coTraveller")}
        >
          Co-Traveller
        </button>

        <button className="btn btn-danger mt-auto" onClick={handleBack}>
          ← Back
        </button>
      </div>

      <div style={{ marginLeft: "100px" }}>
        {activeTab === "profile" && (
          <>
            {(addedUsers.length === 0 || editingUser) && (
              <div className="shadow p-4 rounded" style={{ width: "900px" }}>
                <h3>{editingUser ? "Update User Details" : "Add User Details"}</h3>
                <ProfileForm
                  user={user}
                  initialData={editingUser?.data || null}
                  onSave={(newUser) => {
                    setAddedUsers([newUser]);
                    setEditingUser(null);
                    toast.success(editingUser ? "User updated!" : "User details added!");
                  }}
                  onClose={() => setEditingUser(null)}
                />
              </div>
            )}

            {addedUsers.length > 0 && !editingUser && (
              <div className="mt-3 shadow p-3 rounded" style={{ width: "900px" }}>
                <div className="list-group">
                  {addedUsers.map((u, idx) => (
                    <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h5>General Information</h5>
                        <strong>
                          {u.FirstName} {u.LastName}
                        </strong>
                        <br />
                        <small>Email: {u.Email}</small>
                        <small className="ps-4">Gender: {u.Gender}</small>
                        <small className="ps-4">DOB: {u.DateOfBirth}</small>
                        <small className="ps-4">Marital Status: {u.MaritalStatus}</small>
                        <small className="ps-4">City: {u.City}</small>
                        <br />
                        <small>State: {u.State}</small>
                        <small className="ps-4">Nationality: {u.Nationality}</small>
                        <br />
                        <br />
                        <h5>Contact Details</h5>
                        <small>Phone Number: {u.MobileNumber}</small>
                        <br />
                        <br />
                        <h5>Document Details</h5>
                        <small>Passport Number: {u.PassportNumber}</small>
                        <small className="ps-4">Issuing Country: {u.IssuingCountry}</small>
                        <br />
                        <small>Expiry Date: {u.ExpiryDate}</small>
                        <small className="ps-5">PAN Card: {u.PancardNumber}</small>
                        <br />
                        <br />
                        <h5>Frequent Flyer Details</h5>
                        <small>Airline: {u.AirlineName}</small>
                        <br />
                        <small>Frequent Flight Number: {u.FrequentFlightNumber}</small>
                      </div>

                      <div style={{ marginTop: "300px" }}>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => setEditingUser({ index: idx, data: u })}
                        >
                          Update
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            try {
                              await UserProfileApis.deleteUser();
                              setAddedUsers([]);

                              setActiveTab("profile");
                              toast.success("User Profile deleted");
                            } catch (err) {
                              toast.error("Failed to delete user");
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "coTraveller" && (
          <>
            <button className="btn btn-success mb-3" onClick={() => setShowCoTravellerModal(true)}>
              + Add Co-Traveller
            </button>
            {(showCoTravellerModal || editingTraveller) && (
              <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <div className="modal-dialog modal-lg">
                  <div className="modal-content p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3>{editingTraveller ? "Update Co-Traveller" : "Add Co-Traveller"}</h3>
                    </div>
                    <CoTravellerForm
                      initialData={editingTraveller}
                      onSave={(traveller) => {
                        setCoTravellers((prev) => {
                          const exists = prev.some((t) => t.CoTravellersId === traveller.CoTravellersId);
                          if (exists) {
                            return prev.map((t) => (t.CoTravellersId === traveller.CoTravellersId ? traveller : t));
                          } else {
                            return [...prev, traveller];
                          }
                        });

                        toast.success(
                          coTravellers.some((t) => t.CoTravellersId === traveller.CoTravellersId)
                            ? "Co-Traveller updated!"
                            : "Co-Traveller added!"
                        );

                        setEditingTraveller(null);
                        setShowCoTravellerModal(false);
                      }}
                      onClose={() => {
                        setEditingTraveller(null);
                        setShowCoTravellerModal(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3">
              {coTravellers.length === 0 ? (
                <p>No co-travellers added yet.</p>
              ) : (
                <div className="list-group">
                  {coTravellers.map((c) => (
                    <div key={c.CoTravellersId} className="list-group-item d-flex justify-content-between">
                      <div>
                        <h5>General Information</h5>
                        <strong>
                          {c.FirstName} {c.LastName}
                        </strong>
                        <br />
                        <small>Email: {c.Email}</small>
                        <small className="ps-4">Gender: {c.Gender}</small>
                        <small className="ps-4">DOB: {c.DateOfBirth}</small>
                        <br />
                        <small className="ps-4">Nationality: {c.Nationality}</small>
                        <small className="ps-4">Relationship: {c.Relationship}</small>
                        <br />
                        <small>Email: {c.Email}</small>
                        <small className="ps-4">Meal Preference: {c.MealPreference}</small>
                        <br />
                        <br />
                        <h5>Contact Details</h5>
                        <small>Phone Number: {c.MobileNumber}</small>
                        <br />
                        <br />
                        <h5>Document Details</h5>
                        <small>Passport Number: {c.PassportNumber}</small>
                        <small className="ps-4">Issuing Country: {c.IssuingCountry}</small>
                        <br />
                        <small>Expiry Date: {c.ExpiryDate}</small>

                        <br />
                        <br />
                        <h5>Frequent Flyer Details</h5>
                        <small>Airline: {c.AirlineName}</small>
                        <br />
                        <small>Frequent Flight Number: {c.FrequentFlightNumber}</small>
                      </div>
                      <div>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingTraveller(c)}>
                          Update
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            try {
                              await CoTravellerApis.delete(c.CoTravellersId);
                              setCoTravellers(coTravellers.filter((x) => x.CoTravellersId !== c.CoTravellersId));
                              toast.success("Deleted successfully!");
                            } catch (err) {
                              toast.error("Failed to delete");
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ProfileForm = ({ user, onSave, onClose, initialData }) => {
  const [formData, setFormData] = useState(
    initialData || {
      FirstName: "",
      LastName: "",
      Email: "",
      Gender: "",
      UserImage: "",
      DateOfBirth: "",
      Nationality: "",
      MaritalStatus: "",
      City: "",
      State: "",
      MobileNumber: "",
      PassportNumber: "",
      ExpiryDate: "",
      IssuingCountry: "",
      PancardNumber: "",
      AirlineName: "",
      FrequentFlightNumber: "",
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(formDataState).forEach((key) => {
      if (key === "UserImageFile" && profilePicFile) {
        formData.append("UserImageFile", profilePicFile);
      } else {
        formData.append(key, formDataState[key]);
      }
    });

    try {
      if (initialData) {
        const res = await UserProfileApis.updateUser(user.UserId, formData);
        toast.success(res.Message || "Profile updated");
      } else {
        const res = await UserProfileApis.addUser(formData);
        toast.success(res.Message || "Profile added");
      }

      onSave(formDataState);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.Error || "Error saving profile");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div className="row g-3">
          <h5>Genaral Infromation</h5>
          <div className="col-md-6">
            <input
              type="text"
              name="FirstName"
              placeholder="First Name"
              className="form-control"
              value={formData.FirstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              name="LastName"
              placeholder="Last Name"
              className="form-control"
              value={formData.LastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <input
              type="email"
              name="Email"
              placeholder="Email"
              className="form-control"
              value={formData.Email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 ">
            <select name="Gender" className="form-select" value={formData.Gender || ""} onChange={handleChange} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-md-6">
            <label>Date of Birth</label>
            <input
              type="date"
              name="DateOfBirth"
              className="form-control mt-2"
              value={formData.DateOfBirth}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6 mt-5">
            <select
              name="MaritalStatus"
              className="form-select"
              value={formData.MaritalStatus || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Marital Status</option>
              <option value="Married">Married</option>
              <option value="UnMarried">UnMarried</option>
            </select>
          </div>

          <div className="col-md-6">
            <input
              type="text"
              name="City"
              placeholder="City"
              className="form-control"
              value={formData.City}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              name="State"
              placeholder="State"
              className="form-control"
              value={formData.State}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              name="Nationality"
              placeholder="Nationality"
              className="form-control"
              value={formData.Nationality}
              onChange={handleChange}
            />
          </div>
        </div>

        <h5 style={{ marginTop: "40px" }}>Contact Details</h5>
        <div className="col-md-6">
          <input
            type="text"
            name="MobileNumber"
            placeholder="Mobile Number"
            className="form-control"
            value={formData.MobileNumber}
            onChange={handleChange}
          />
        </div>

        <div className="row g-3">
          <h5 style={{ marginTop: "40px" }}>Document Details</h5>
          <div className="col-md-6">
            <input
              type="text"
              name="PassportNumber"
              placeholder="Passport Number"
              className="form-control"
              value={formData.PassportNumber}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <input
              type="text"
              name="IssuingCountry"
              placeholder="Issuing Country"
              className="form-control"
              value={formData.IssuingCountry}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label>Expiry Date</label>
            <input
              type="date"
              name="ExpiryDate"
              className="form-control mt-2"
              value={formData.ExpiryDate}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6 mt-5">
            <input
              type="text"
              name="PancardNumber"
              placeholder="PAN Card Number"
              className="form-control "
              value={formData.PancardNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="row g-3">
          <h5 style={{ marginTop: "40px" }}>Frequent Flyer Details</h5>
          <div className="col-md-6">
            <select
              name="AirlineName"
              className="form-select"
              value={formData.AirlineName || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select Airline</option>
              <option value="Air India">Air India</option>
              <option value="IndiGo">IndiGo</option>
              <option value="SpiceJet">SpiceJet</option>
              <option value="Vistara">Vistara</option>
              <option value="AirAsia India">AirAsia India</option>
              <option value="Alliance Air">Alliance Air</option>
              <option value="Akasa Air">Akasa Air</option>
              <option value="Emirates">Emirates</option>
              <option value="Qatar Airways">Qatar Airways</option>
            </select>
          </div>

          <div className="col-md-6">
            <input
              type="text"
              name="FrequentFlightNumber"
              placeholder="Frequent Flyer Number"
              className="form-control"
              value={formData.FrequentFlightNumber}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end mt-4">
        <button type="button" className="btn btn-danger me-2" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-danger">
          Save
        </button>
      </div>
    </form>
  );
};

import CoTravellerApis from "../api/CoTravellerApis";

const CoTravellerForm = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    initialData || {
      FirstName: "",
      LastName: "",
      Gender: "",
      DateOfBirth: "",
      Nationality: "",
      Relationship: "",
      MealPreference: "",
      PassportNumber: "",
      ExpiryDate: "",
      IssuingCountry: "",
      MobileNumber: "",
      Email: "",
      AirlineName: "",
      FrequentFlightNumber: "",
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      let savedTraveller;

      if (initialData) {
        res = await CoTravellerApis.update(formData.CoTravellersId, formData);
        toast.success(res.data?.Message || "Co-Traveller updated successfully!");
        savedTraveller = res.data?.Data || formData;
        savedTraveller.CoTravellersId = formData.CoTravellersId;
      } else {
        res = await CoTravellerApis.add(formData);
        toast.success(res.data?.Message || "Co-Traveller added successfully!");
        savedTraveller = res.data?.Data || res.data;
      }

      onSave(savedTraveller);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.Error || "Failed to save co-traveller");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label> First Name</label>
          <input
            type="text"
            name="FirstName"
            placeholder="First Name"
            className="form-control"
            value={formData.FirstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label>Last Name</label>
          <input
            type="text"
            name="LastName"
            placeholder="Last Name"
            className="form-control"
            value={formData.LastName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label> Date of Birth</label>
          <div className="col-md-4 mt-2">
            <input
              type="date"
              name="DateOfBirth"
              className="form-control"
              value={formData.DateOfBirth}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="col-md-6 mb-2">
          <label>Nationality</label>
          <input
            type="text"
            name="Nationality"
            placeholder="Nationality"
            className="form-control"
            value={formData.Nationality}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label>Gender</label>
          <select name="Gender" className="form-select" value={formData.Gender} onChange={handleChange}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <div className="col-md-6 ">
          <label>Relationship</label>
          <select name="Relationship" className="form-select" value={formData.Relationship || ""} onChange={handleChange}>
            <option>Wife</option>
            <option>Friend</option>
            <option>Son</option>
            <option>Mother</option>
            <option>Husband</option>
            <option>Daughter</option>
          </select>
        </div>

        <select name="MealPreference" className="form-select" value={formData.MealPreference || ""} onChange={handleChange}>
          <option>Vegetarian (Veg Meal)</option>
          <option>Non-Vegetarian (Standard Meal)</option>
          <option>Vegan Meal</option>
          <option>Child Meal</option>
          <option>Baby Meal</option>
          <option>Gluten-Free Meal</option>
          <option>Diabetic Meal</option>
          <option>Halal Meal</option>
          <option>Low Fat Meal</option>
        </select>

        <div className="col-md-6 mt-5">
          <label>Passport Number</label>
          <input
            type="text"
            name="PassportNumber"
            placeholder="Passport Number"
            className="form-control"
            value={formData.PassportNumber}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginTop: "-70px", marginLeft: "390px" }}>
          <label> Expiry Date</label>
          <div className="col-md-4 mt-2">
            <input
              type="date"
              name="ExpiryDate"
              className="form-control"
              value={formData.ExpiryDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="col-md-6 mt-4">
          <label>Issuing Country</label>
          <input
            type="text"
            name="IssuingCountry"
            placeholder="Issuing Country"
            className="form-control"
            value={formData.IssuingCountry}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6 mt-4">
          <label>Phone Number</label>
          <input
            type="text"
            name="MobileNumber"
            placeholder="Mobile Number"
            className="form-control"
            value={formData.MobileNumber}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label>Email</label>
          <input
            type="email"
            name="Email"
            placeholder="Email"
            className="form-control"
            value={formData.Email}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label>Frequent Flyer Name</label>
          <select name="Airline Name" className="form-select" value={formData.AirlineName || ""} onChange={handleChange}>
            <option>Air India</option>
            <option>IndiGo</option>
            <option>SpiceJet</option>
            <option>Vistara</option>
            <option>AirAsia India</option>
            <option>Alliance Air</option>
            <option>Akasa Air</option>
            <option>Emirates</option>
            <option>Qatar Airways</option>
          </select>
        </div>
        <div className="col-md-6">
          <label>Frequent Flyer Number</label>
          <input
            type="text"
            name="FrequentFlightNumber"
            placeholder="Frequent Flyer Number"
            className="form-control"
            value={formData.FrequentFlightNumber}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="d-flex justify-content-end mt-4">
        <button type="button" className="btn btn-danger me-2" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-danger">
          Save
        </button>
      </div>
    </form>
  );
};

export default Profile;
