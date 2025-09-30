import Navbar from "./Components/Navbar.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import HotelPage from "./pages/HotelPage.jsx";
import Profile from "./pages/Profile.jsx";
import MyBookingPage from "./pages/MyBookingPage.jsx";
import FlightPage from "./pages/FlightPage.jsx";
import FlightbookingPage from "./pages/FlightbookingPage.jsx";
import HotelSearch from "./pages/HotelSearch.jsx";
import PropertyInfo from "./pages/PropertyInfo";
import HotelBooked from "./pages/HotelBooked.jsx";
import Footer from "./pages/Footer.jsx";
import Overview from "./AdminDashboard/Overview.jsx";
import Sidebar from "./AdminDashboard/Sidebar.jsx";
import Users from "./AdminDashboard/Users.jsx";
import Flight from "./AdminDashboard/Flight.jsx";
import Hotel from "./AdminDashboard/Hotel.jsx";
import Bookings from "./AdminDashboard/Bookings.jsx";
function App() {
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/sidebar" element={<Sidebar />} />
        <Route path="/users" element={<Users />} />
        <Route path="/admin/dashboard" element={<Overview />} />
        <Route path="/hotelbooked" element={<HotelBooked />} />
        <Route path="/hotelsearch" element={<HotelSearch />} />
        <Route path="/property/:id" element={<PropertyInfo />} />
        <Route path="/flightdetails" element={<FlightPage />} />
        <Route path="/flightbooked" element={<FlightbookingPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Home />} />
        <Route path="/Hotels" element={<HotelPage />} />
        <Route path="/nav" element={<Navbar />} />
        <Route path="/bookings" element={<MyBookingPage />} />
        <Route path="/footer" element={<Footer />} />
        <Route path="/flight" element={<Flight />} />
        <Route path="/hotel" element={<Hotel />} />
        <Route path="/book" element={<Bookings />} />
      </Routes>
    </div>
  );
}

const Root = () => (
  <Router>
    <App />
  </Router>
);

export default Root;
