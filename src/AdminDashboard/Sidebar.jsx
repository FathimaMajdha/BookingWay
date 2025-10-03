import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="d-flex flex-column p-3  text-white " style={{ width: "250px", height: "2000px" ,background: "#000957" }}>
      <h4 className="text-center mb-4">Admin</h4>
      <ul className="nav nav-pills flex-column mb-auto ">
        <li className="nav-item ">
          <Link to="/admin/dashboard" className="nav-link text-white">
            Overview
          </Link>
        </li>
        <li>
          <Link to="/users" className="nav-link text-white">
            Users
          </Link>
        </li>
        <li>
          <Link to="/flight" className="nav-link text-white">
            Flight
          </Link>
        </li>
        <li>
          <Link to="/hotel" className="nav-link text-white">
            Hotel
          </Link>
        </li>
        <li>
          <Link to="/book" className="nav-link text-white">
            Bookings
          </Link>
        </li>
        <li>
          <Link to="/" className="nav-link text-white">
            LogOut
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
