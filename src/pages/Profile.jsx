import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import UserProfileApis from "../api/UserProfileApis";
import CoTravellerApis from "../api/CoTravellerApis";
import CloudStorageApis from "../api/CloudStorageApis";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const [editingTraveller, setEditingTraveller] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [coTravellers, setCoTravellers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [showCoTravellerModal, setShowCoTravellerModal] = useState(false);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("loggedUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const fetchUserProfile = async () => {
    if (!user?.UserId) return;

    try {
      const response = await UserProfileApis.getMyProfile();
      if (response.data.Success) {
        setUserProfile(response.data.Data);
        setProfilePic(response.data.Data?.UserImage || null);
      } else {
        toast.info("No profile found. Please create a user profile.");
      }
    } catch (err) {
      if (err.response?.status === 404) {
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
      const response = await CoTravellerApis.getAll();
      if (response.data.Success) {
        setCoTravellers(response.data.Data || []);
      } else {
        toast.error(response.data.Message || "Failed to fetch co-travellers");
      }
    } catch (err) {
      toast.error("Failed to fetch co-travellers");
    }
  };

  useEffect(() => {
    if (activeTab === "coTraveller") {
      fetchCoTravellers();
    }
  }, [activeTab]);

  const handleProfilePicUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await CloudStorageApis.uploadImage(formData, "profile-pictures");
      if (response.data.Success) {
        return response.data.Data;
      } else {
        throw new Error(response.data.Message);
      }
    } catch (err) {
      toast.error("Failed to upload profile picture");
      return null;
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);

      if (userProfile) {
        const imageUrl = await handleProfilePicUpload(file);
        if (imageUrl) {
          const updatedProfile = { ...userProfile, UserImage: imageUrl };
          try {
            const response = await UserProfileApis.updateUser(updatedProfile);
            if (response.data.Success) {
              setUserProfile(updatedProfile);
              toast.success("Profile picture updated!");
            }
          } catch (err) {
            toast.error("Failed to update profile picture");
          }
        }
      }
    }
  };

  return (
    <div className="container pt-4 d-flex">
      <div
        className="d-flex flex-column p-5 shadow-lg align-items-center rounded-4"
        style={{ width: "300px", height: "700px" }}
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
          <input type="file" id="profilePicUpload" accept="image/*" className="d-none" onChange={handleProfilePicChange} />
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
            {(!userProfile || editingUser) && (
              <div className="shadow p-4 rounded" style={{ width: "900px" }}>
                <h3>{editingUser ? "Update User Details" : "Add User Details"}</h3>
                <ProfileForm
                  user={user}
                  initialData={editingUser || userProfile}
                  onSave={(savedProfile) => {
                    setUserProfile(savedProfile);
                    setEditingUser(null);
                    toast.success(editingUser ? "Profile updated successfully!" : "Profile created successfully!");
                  }}
                  onClose={() => setEditingUser(null)}
                />
              </div>
            )}

            {userProfile && !editingUser && (
              <div className="mt-3 shadow p-3 rounded" style={{ width: "900px" }}>
                <div className="list-group">
                  <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <h5>General Information</h5>
                      <strong>
                        {userProfile.FirstName} {userProfile.LastName}
                      </strong>
                      <br />
                      <small>Email: {userProfile.Email}</small>
                      <small className="ps-4">Gender: {userProfile.Gender}</small>
                      <small className="ps-4">DOB: {userProfile.DateOfBirth}</small>
                      <small className="ps-4">Marital Status: {userProfile.MaritalStatus}</small>
                      <small className="ps-4">City: {userProfile.City}</small>
                      <br />
                      <small>State: {userProfile.State}</small>
                      <small className="ps-4">Nationality: {userProfile.Nationality}</small>
                      <br />
                      <br />
                      <h5>Contact Details</h5>
                      <small>Phone Number: {userProfile.MobileNumber}</small>
                      <br />
                      <br />
                      <h5>Document Details</h5>
                      <small>Passport Number: {userProfile.PassportNumber}</small>
                      <small className="ps-4">Issuing Country: {userProfile.IssuingCountry}</small>
                      <br />
                      <small>Expiry Date: {userProfile.ExpiryDate}</small>
                      <small className="ps-5">PAN Card: {userProfile.PancardNumber}</small>
                      <br />
                      <br />
                      <h5>Frequent Flyer Details</h5>
                      <small>Airline: {userProfile.AirlineName}</small>
                      <br />
                      <small>Frequent Flight Number: {userProfile.FrequentFlightNumber}</small>
                    </div>

                    <div style={{ marginTop: "300px" }}>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingUser(userProfile)}>
                        Update
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={async () => {
                          try {
                            const response = await UserProfileApis.deleteUser();
                            if (response.data.Success) {
                              setUserProfile(null);
                              toast.success("Profile deleted successfully!");
                            } else {
                              toast.error(response.data.Message || "Failed to delete profile");
                            }
                          } catch (err) {
                            toast.error("Failed to delete profile");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
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
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                          setEditingTraveller(null);
                          setShowCoTravellerModal(false);
                        }}
                      ></button>
                    </div>
                    <CoTravellerForm
                      initialData={editingTraveller}
                      onSave={(traveller) => {
                        if (editingTraveller) {
                          setCoTravellers((prev) =>
                            prev.map((t) => (t.CoTravellersId === traveller.CoTravellersId ? traveller : t))
                          );
                        } else {
                          setCoTravellers((prev) => [...prev, traveller]);
                        }
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
                  {coTravellers.map((traveller) => (
                    <div key={traveller.CoTravellersId} className="list-group-item d-flex justify-content-between">
                      <div>
                        <h5>General Information</h5>
                        <strong>
                          {traveller.FirstName} {traveller.LastName}
                        </strong>
                        <br />
                        <small>Email: {traveller.Email}</small>
                        <small className="ps-4">Gender: {traveller.Gender}</small>
                        <small className="ps-4">DOB: {traveller.DateOfBirth}</small>
                        <br />
                        <small className="ps-4">Nationality: {traveller.Nationality}</small>
                        <small className="ps-4">Relationship: {traveller.Relationship}</small>
                        <br />
                        <small>Meal Preference: {traveller.MealPreference}</small>
                        <br />
                        <br />
                        <h5>Contact Details</h5>
                        <small>Phone Number: {traveller.MobileNumber}</small>
                        <br />
                        <br />
                        <h5>Document Details</h5>
                        <small>Passport Number: {traveller.PassportNumber}</small>
                        <small className="ps-4">Issuing Country: {traveller.IssuingCountry}</small>
                        <br />
                        <small>Expiry Date: {traveller.ExpiryDate}</small>
                        <br />
                        <br />
                        <h5>Frequent Flyer Details</h5>
                        <small>Airline: {traveller.AirlineName}</small>
                        <br />
                        <small>Frequent Flight Number: {traveller.FrequentFlightNumber}</small>
                      </div>
                      <div>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => setEditingTraveller(traveller)}
                        >
                          Update
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={async () => {
                            try {
                              const response = await CoTravellerApis.delete(traveller.CoTravellersId);
                              if (response.data.Success) {
                                setCoTravellers(coTravellers.filter((t) => t.CoTravellersId !== traveller.CoTravellersId));
                                toast.success("Co-traveller deleted successfully!");
                              } else {
                                toast.error(response.data.Message || "Failed to delete co-traveller");
                              }
                            } catch (err) {
                              toast.error("Failed to delete co-traveller");
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

const ProfileForm = ({ user, initialData, onSave, onClose }) => {
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

  const [profilePicFile, setProfilePicFile] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        submitData.append(key, formData[key]);
      }
    });

    if (profilePicFile) {
      submitData.append("UserImageFile", profilePicFile);
    }

    try {
      let response;
      if (initialData) {
        response = await UserProfileApis.updateUser(submitData);
      } else {
        response = await UserProfileApis.addUser(submitData);
      }

      if (response.data.Success) {
        onSave(response.data.Data || formData);
      } else {
        toast.error(response.data.Message || "Error saving profile");
      }
    } catch (err) {
      toast.error(err.response?.data?.Message || "Error saving profile");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div className="row g-3">
          <h5>General Information</h5>
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

          <div className="col-md-6">
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

          <div className="col-md-6">
            <label>Profile Picture</label>
            <input
              type="file"
              name="UserImageFile"
              className="form-control mt-2"
              accept="image/*"
              onChange={handleFileChange}
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
              className="form-control"
              value={formData.PancardNumber}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="row g-3">
          <h5 style={{ marginTop: "40px" }}>Frequent Flyer Details</h5>
          <div className="col-md-6">
            <select name="AirlineName" className="form-select" value={formData.AirlineName || ""} onChange={handleChange}>
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
          {initialData ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
};

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
      let response;
      if (initialData) {
        response = await CoTravellerApis.update(initialData.CoTravellersId, formData);
      } else {
        response = await CoTravellerApis.add(formData);
      }

      if (response.data.Success) {
        onSave(response.data.Data || formData);
        toast.success(
          response.data.Message || (initialData ? "Co-Traveller updated successfully!" : "Co-Traveller added successfully!")
        );
      } else {
        toast.error(response.data.Message || "Failed to save co-traveller");
      }
    } catch (err) {
      toast.error(err.response?.data?.Message || "Failed to save co-traveller");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label>First Name</label>
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

        <div className="col-md-6">
          <label>Date of Birth</label>
          <input
            type="date"
            name="DateOfBirth"
            className="form-control"
            value={formData.DateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
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

        <div className="col-md-6">
          <label>Gender</label>
          <select name="Gender" className="form-select" value={formData.Gender || ""} onChange={handleChange}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="col-md-6">
          <label>Relationship</label>
          <select name="Relationship" className="form-select" value={formData.Relationship || ""} onChange={handleChange}>
            <option value="">Select Relationship</option>
            <option value="Wife">Wife</option>
            <option value="Husband">Husband</option>
            <option value="Son">Son</option>
            <option value="Daughter">Daughter</option>
            <option value="Mother">Mother</option>
            <option value="Father">Father</option>
            <option value="Friend">Friend</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="col-md-12">
          <label>Meal Preference</label>
          <select
            name="MealPreference"
            className="form-select"
            value={formData.MealPreference || ""}
            onChange={handleChange}
          >
            <option value="">Select Meal Preference</option>
            <option value="Vegetarian">Vegetarian (Veg Meal)</option>
            <option value="Non-Vegetarian">Non-Vegetarian (Standard Meal)</option>
            <option value="Vegan">Vegan Meal</option>
            <option value="Child Meal">Child Meal</option>
            <option value="Baby Meal">Baby Meal</option>
            <option value="Gluten-Free">Gluten-Free Meal</option>
            <option value="Diabetic">Diabetic Meal</option>
            <option value="Halal">Halal Meal</option>
            <option value="Low Fat">Low Fat Meal</option>
          </select>
        </div>

        <div className="col-md-6">
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

        <div className="col-md-6">
          <label>Expiry Date</label>
          <input
            type="date"
            name="ExpiryDate"
            className="form-control"
            value={formData.ExpiryDate}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
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

        <div className="col-md-6">
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
          <label>Airline Name</label>
          <select name="AirlineName" className="form-select" value={formData.AirlineName || ""} onChange={handleChange}>
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
          {initialData ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
};

export default Profile;
