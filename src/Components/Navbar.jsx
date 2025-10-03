import React, { useState, useRef, useEffect } from "react";
import { FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import axiosInstance from "../api/axiosInstance";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("loggedUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const dropdownRef = useRef();
  const mobileMenuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".navbar-toggler")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleMyBookingsClick = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login first to view your bookings!");
      setShowDropdown(true);
    } else {
      navigate("/bookings");
      setIsMobileMenuOpen(false);
    }
  };

  const toggleForm = () => setIsLogin(!isLogin);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const username = e.target.loginUsername.value.trim();
        const password = e.target.loginPassword.value.trim();

        if (!username || !password) {
          toast.error("Please fill all required fields.");
          return;
        }

        const response = await axiosInstance.post("/auth/login", { username, password });
        const data = response.data;

        const isSuccess = data.Success || data.success;
        const message = data.Message || data.message;
        const userData = data.Data || data.data || {};

        if (!isSuccess) {
          toast.error(message || "Invalid credentials!");
          return;
        }

        if (userData.IsBlocked || userData.isBlocked) {
          toast.error("Your account has been blocked. Please contact administrator.");
          return;
        }

        const loggedUser = {
          UserId: userData.UserAuthId || userData.userAuthId || null,
          username: userData.Username || userData.username || "",
          role: userData.Role || userData.role || "",
          isBlocked: userData.IsBlocked || userData.isBlocked || false,
        };

        localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
        localStorage.setItem("token", userData.Token || userData.token || "");

        setUser(loggedUser);
        toast.success(message || "Login successful!");
        setShowDropdown(false);
        setIsMobileMenuOpen(false);

        if (loggedUser.role.toLowerCase() === "admin") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/";
        }
      } else {
        const username = e.target.registerUsername.value.trim();
        const email = e.target.registerEmail.value.trim();
        const password = e.target.registerPassword.value.trim();

        if (!username || !email || !password) {
          toast.error("Please fill all required fields.");
          return;
        }

        const response = await axiosInstance.post("/auth/register", {
          username,
          email,
          password,
          role: "User",
        });
        const data = response.data;

        const isSuccess = data.Success || data.success;
        const message = data.Message || data.message;
        const userData = data.Data || data.data || {};

        if (!isSuccess) {
          toast.error(message || "Registration failed!");
          return;
        }

        const loggedUser = {
          UserId: userData.UserAuthId || userData.userAuthId || Date.now(),
          username: userData.Username || userData.username || username,
          role: userData.Role || userData.role || "User",
          isBlocked: false,
        };

        localStorage.setItem("loggedUser", JSON.stringify(loggedUser));
        setUser(loggedUser);

        toast.success(message || "Registration successful! You are now logged in.");
        setShowDropdown(false);
        setIsMobileMenuOpen(false);

        if (loggedUser.role.toLowerCase() === "admin") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("API error:", error);

      if (error.response?.status === 401) {
        toast.error("Your account has been blocked. Please contact administrator.");
      } else if (error.response?.data?.Message?.includes("blocked") || error.response?.data?.message?.includes("blocked")) {
        toast.error("Your account has been blocked. Please contact administrator.");
      } else {
        const errorMessage =
          error.response?.data?.Message || error.response?.data?.message || error.message || "Operation failed!";
        toast.error(errorMessage);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("token");
    toast.success("Logged out successfully!");
    setIsMobileMenuOpen(false);
    window.location.href = "/";
  };

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (user && user.isBlocked) {
      toast.error("Your account has been blocked. Please contact administrator.");
      handleLogout();
    }
  }, [user]);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top" style={{ background: "#000957" }}>
        <div className="container-fluid px-3 px-md-4">
          <a className="navbar-brand fw-bold" href="/">
            BookingWay
          </a>

          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
            style={{ outline: "none", boxShadow: "none" }}
          >
            {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/" onClick={handleNavLinkClick}>
                  Flights
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/hotels" onClick={handleNavLinkClick}>
                  Hotels
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/bookings" onClick={handleMyBookingsClick} style={{ cursor: "pointer" }}>
                  My Bookings
                </a>
              </li>
            </ul>

            <div className="d-none d-lg-flex align-items-center gap-3 position-relative" ref={dropdownRef}>
              {!user && (
                <button
                  className="btn btn-light fw-semibold px-3"
                  style={{ color: "#000957", whiteSpace: "nowrap" }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label="Open login or signup form"
                >
                  Login / Signup
                </button>
              )}

              {user && (
                <button
                  className="btn btn-light fw-semibold px-3"
                  onClick={handleLogout}
                  aria-label="Logout"
                  style={{ color: "#000957", whiteSpace: "nowrap" }}
                >
                  Logout
                </button>
              )}

              <button
                className="btn btn-outline-light d-flex align-items-center gap-2 px-3"
                onClick={() => {
                  if (!user) {
                    setShowDropdown(true);
                  } else if (user.role.toLowerCase() !== "admin") {
                    window.location.href = "/profile";
                  } else {
                    window.location.href = "/admin/dashboard";
                  }
                }}
                aria-label="User Profile"
                style={{ whiteSpace: "nowrap" }}
              >
                <FaUserCircle size={18} />
                <span className="d-none d-sm-inline">
                  {user ? (user.role.toLowerCase() === "admin" ? "Admin" : user.username) : "My Profile"}
                </span>
              </button>

              {showDropdown && !user && (
                <div
                  className="position-absolute bg-white p-4 rounded shadow"
                  style={{
                    top: "100%",
                    right: 0,
                    width: "320px",
                    zIndex: 1000,
                    maxWidth: "90vw",
                  }}
                >
                  <h5 className="text-center mb-3 fw-bold">{isLogin ? "Login" : "Signup"}</h5>
                  <form onSubmit={handleSubmit}>
                    {!isLogin && (
                      <>
                        <div className="mb-3">
                          <label htmlFor="registerUsername" className="form-label fw-medium">
                            Username *
                          </label>
                          <input
                            type="text"
                            id="registerUsername"
                            name="registerUsername"
                            className="form-control"
                            placeholder="Enter username"
                            aria-required="true"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="registerEmail" className="form-label fw-medium">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="registerEmail"
                            name="registerEmail"
                            className="form-control"
                            placeholder="Enter email"
                            aria-required="true"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="registerPassword" className="form-label fw-medium">
                            Password *
                          </label>
                          <input
                            type="password"
                            id="registerPassword"
                            name="registerPassword"
                            className="form-control"
                            placeholder="Enter password"
                            aria-required="true"
                            required
                          />
                        </div>
                      </>
                    )}

                    {isLogin && (
                      <>
                        <div className="mb-3">
                          <label htmlFor="loginUsername" className="form-label fw-medium">
                            Username *
                          </label>
                          <input
                            type="text"
                            id="loginUsername"
                            name="loginUsername"
                            className="form-control"
                            placeholder="Enter username"
                            aria-required="true"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="loginPassword" className="form-label fw-medium">
                            Password *
                          </label>
                          <input
                            type="password"
                            id="loginPassword"
                            name="loginPassword"
                            className="form-control"
                            placeholder="Enter password"
                            aria-required="true"
                            required
                          />
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className="btn text-white w-100 fw-semibold py-2"
                      style={{ background: "#000957" }}
                    >
                      {isLogin ? "Login" : "Signup"}
                    </button>
                  </form>

                  <p className="text-center mt-3 mb-0">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <span
                      style={{ cursor: "pointer", color: "#000957", textDecoration: "underline" }}
                      onClick={toggleForm}
                      className="fw-medium"
                    >
                      {isLogin ? "Signup" : "Login"}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {isMobileMenuOpen && (
            <div
              ref={mobileMenuRef}
              className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-white"
              style={{
                zIndex: 1040,
                marginTop: "56px",
                overflowY: "auto",
              }}
            >
              <div className="container-fluid py-4">
                <div className="d-flex flex-column gap-3 mb-4">
                  <a
                    className="btn btn-outline-dark text-start py-3 fw-semibold rounded"
                    href="/"
                    onClick={handleNavLinkClick}
                  >
                    Flights
                  </a>
                  <a
                    className="btn btn-outline-dark text-start py-3 fw-semibold rounded"
                    href="/hotels"
                    onClick={handleNavLinkClick}
                  >
                    Hotels
                  </a>
                  <button
                    className="btn btn-outline-dark text-start py-3 fw-semibold rounded"
                    onClick={handleMyBookingsClick}
                  >
                    My Bookings
                  </button>
                </div>

                <div className="border-top pt-4">
                  {user ? (
                    <div className="d-flex flex-column gap-3">
                      <div className="text-center mb-3">
                        <FaUserCircle size={40} className="text-dark mb-2" />
                        <h6 className="fw-bold mb-1">{user.username}</h6>
                        <small className="text-muted">{user.role}</small>
                      </div>
                      <button
                        className="btn btn-dark w-100 py-2 fw-semibold rounded"
                        onClick={() => {
                          if (user.role.toLowerCase() !== "admin") {
                            window.location.href = "/profile";
                          } else {
                            window.location.href = "/admin/dashboard";
                          }
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {user.role.toLowerCase() === "admin" ? "Admin Dashboard" : "My Profile"}
                      </button>
                      <button className="btn btn-outline-dark w-100 py-2 fw-semibold rounded" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      <div className="bg-light p-4 rounded">
                        <h5 className="text-center mb-3 fw-bold">{isLogin ? "Login" : "Signup"}</h5>
                        <form onSubmit={handleSubmit}>
                          {!isLogin && (
                            <>
                              <div className="mb-3">
                                <label className="form-label fw-medium">Username *</label>
                                <input
                                  type="text"
                                  name="registerUsername"
                                  className="form-control"
                                  placeholder="Enter username"
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label className="form-label fw-medium">Email *</label>
                                <input
                                  type="email"
                                  name="registerEmail"
                                  className="form-control"
                                  placeholder="Enter email"
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label className="form-label fw-medium">Password *</label>
                                <input
                                  type="password"
                                  name="registerPassword"
                                  className="form-control"
                                  placeholder="Enter password"
                                  required
                                />
                              </div>
                            </>
                          )}

                          {isLogin && (
                            <>
                              <div className="mb-3">
                                <label className="form-label fw-medium">Username *</label>
                                <input
                                  type="text"
                                  name="loginUsername"
                                  className="form-control"
                                  placeholder="Enter username"
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label className="form-label fw-medium">Password *</label>
                                <input
                                  type="password"
                                  name="loginPassword"
                                  className="form-control"
                                  placeholder="Enter password"
                                  required
                                />
                              </div>
                            </>
                          )}

                          <button
                            type="submit"
                            className="btn text-white w-100 fw-semibold py-2 rounded"
                            style={{ background: "#000957" }}
                          >
                            {isLogin ? "Login" : "Signup"}
                          </button>
                        </form>

                        <p className="text-center mt-3 mb-0">
                          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                          <span
                            style={{ cursor: "pointer", color: "#000957", textDecoration: "underline" }}
                            onClick={toggleForm}
                            className="fw-medium"
                          >
                            {isLogin ? "Signup" : "Login"}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div style={{ paddingTop: "56px" }}></div>

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
      />
    </>
  );
};

export default Navbar;
