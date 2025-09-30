import React, { useEffect, useState } from "react";
import Sidebar from "../AdminDashboard/Sidebar";
import axiosInstance from "../api/axiosInstance";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { FaUsers, FaShoppingCart, FaRupeeSign, FaClock } from "react-icons/fa";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#d0ed57"];

const OverView = () => {
  const [cards, setCards] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: "0.00",
  });
  const [revenueByUser, setRevenueByUser] = useState([]);
  const [bookingsPerUser, setBookingsPerUser] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topHotelBookings, setTopHotelBookings] = useState([]);
  const [topFlightBookings, setTopFlightBookings] = useState([]);
  const [hotelOffers, setHotelOffers] = useState([]);
  const [flightOffers, setFlightOffers] = useState([]);

 
useEffect(() => {
  const fetchData = async () => {
    try {
      const extractData = (response, fallback = []) => {
        if (response.data && response.data.Data) {
          return response.data.Data;
        } else if (response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && typeof response.data === 'object') {
          return response.data;
        }
        return fallback;
      };

      const overviewRes = await axiosInstance.get("/AdminOverview/overview");
      console.log("Overview API response:", overviewRes.data);
      const overviewData = extractData(overviewRes, {});
      
      setCards({
        totalUsers: overviewData.TotalUsers || 0,
        totalBookings: overviewData.TotalBookings || 0,
        totalRevenue: Number(overviewData.TotalRevenue || 0).toFixed(2),
      });

      try {
        const revUserRes = await axiosInstance.get("/AdminOverview/revenue-by-user");
        const revUserData = extractData(revUserRes, []);
        setRevenueByUser(
          (Array.isArray(revUserData) ? revUserData : []).map((u) => ({
            name: u.Name || "Unknown",
            revenue: u.Revenue || 0,
            bookings: u.Bookings || 0,
          }))
        );
      } catch (err) {
        console.error("Revenue by user fetch error:", err);
        setRevenueByUser([]);
      }

      try {
        const bookUserRes = await axiosInstance.get("/AdminOverview/bookings-per-user");
        const bookUserData = extractData(bookUserRes, []);
        setBookingsPerUser(
          (Array.isArray(bookUserData) ? bookUserData : []).map((u) => ({
            name: u.Name || "Unknown",
            bookings: u.Bookings || 0,
            revenue: u.Revenue || 0,
          }))
        );
      } catch (err) {
        console.error("Bookings per user fetch error:", err);
        setBookingsPerUser([]);
      }

      try {
        const dailyRevRes = await axiosInstance.get("/AdminOverview/daily-revenue-trend");
        const dailyRevData = extractData(dailyRevRes, []);
        setDailyRevenue(
          (Array.isArray(dailyRevData) ? dailyRevData : []).map((d) => ({
            date: new Date(d.Date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            total: d.TotalRevenue || 0,
          }))
        );
      } catch (err) {
        console.error("Daily revenue fetch error:", err);
        setDailyRevenue([]);
      }

      try {
        const recentRes = await axiosInstance.get("/AdminOverview/recent-activities");
        const recentData = extractData(recentRes, []);
        setRecentActivities(
          (Array.isArray(recentData) ? recentData : []).map((item) => ({
            message: item.Message || "No details",
            timestamp: item.Timestamp || new Date().toISOString(),
          }))
        );
      } catch (err) {
        console.error("Recent activities fetch error:", err);
        setRecentActivities([]);
      }

  
      try {
        const topHotelsRes = await axiosInstance.get("/AdminOverview/top-hotels");
        const topHotelsData = extractData(topHotelsRes, []);
        setTopHotelBookings(
          (Array.isArray(topHotelsData) ? topHotelsData : []).map((h) => ({
            name: h.Name || "Unknown",
            bookings: h.Bookings || 0,
          }))
        );
      } catch (err) {
        console.error("Top hotels fetch error:", err);
        setTopHotelBookings([]);
      }

      try {
        const topFlightsRes = await axiosInstance.get("/AdminOverview/top-flights");
        const topFlightsData = extractData(topFlightsRes, []);
        setTopFlightBookings(
          (Array.isArray(topFlightsData) ? topFlightsData : []).map((f) => ({
            name: f.Name || "Unknown",
            bookings: f.Bookings || 0,
          }))
        );
      } catch (err) {
        console.error("Top flights fetch error:", err);
        setTopFlightBookings([]);
      }

      
      try {
        const hotelOffersRes = await axiosInstance.get("/AdminOverview/hotel-offers");
        const hotelOffersData = extractData(hotelOffersRes, []);
        setHotelOffers((Array.isArray(hotelOffersData) ? hotelOffersData : []).slice(0, 5));
      } catch (err) {
        console.error("Hotel offers fetch error:", err);
        setHotelOffers([]);
      }

      
      try {
        const flightOffersRes = await axiosInstance.get("/AdminOverview/flight-offers");
        const flightOffersData = extractData(flightOffersRes, []);
        setFlightOffers((Array.isArray(flightOffersData) ? flightOffersData : []).slice(0, 5));
      } catch (err) {
        console.error("Flight offers fetch error:", err);
        setFlightOffers([]);
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setCards({
        totalUsers: 0,
        totalBookings: 0,
        totalRevenue: "0.00",
      });
    }
  };

  fetchData();
}, []);
  const cardList = [
    { title: "Total Users", value: cards.totalUsers, icon: <FaUsers className="text-primary fs-2" /> },
    { title: "Total Bookings", value: cards.totalBookings, icon: <FaShoppingCart className="text-success fs-2" /> },
    { title: "Total Revenue", value: `₹${cards.totalRevenue}`, icon: <FaRupeeSign className="text-warning fs-2" /> },
  ];

  return (
    <div className="d-flex bg-light min-vh-100">
      <div className="flex-shrink-0">
        <Sidebar />
      </div>
      <div className="container-fluid p-4" style={{ marginLeft: "100px" }}>
        <h4 className="text-center mb-5 fw-bold text-dark">Admin Dashboard</h4>

        <div className="row g-4 mb-5">
          {cardList.map((card, idx) => (
            <div className="col-md-4" key={idx}>
              <div className="card shadow-sm text-center p-3 h-100">
                <div className="mb-3">{card.icon}</div>
                <div className="text-muted small">{card.title}</div>
                <h3 className="fw-bold">{card.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="card shadow-sm mb-5">
          <div className="card-body">
            <h5 className="card-title d-flex align-items-center gap-2 mb-3">
              <FaClock className="text-primary" /> Recent Activities
            </h5>
            <div className="overflow-auto" style={{ maxHeight: "300px" }}>
              {recentActivities.length === 0 ? (
                <p className="text-muted fst-italic">No recent activities.</p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="border-start border-4 border-primary ps-3 py-2 mb-2 bg-light rounded">
                    <p className="mb-1">{activity.message}</p>
                    <small className="text-muted">
                      {new Date(activity.timestamp).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="row g-4 mt-4">
          <div className="col-md-6">
            <div className="card shadow-sm p-3 h-100">
              <h5 className="card-title mb-3 text-primary">Top 5 Hotel Offers</h5>
              {hotelOffers.map((offer, i) => (
                <div key={i} className="border-start border-4 border-success ps-3 py-2 mb-2 bg-light rounded">
                  <h6 className="fw-bold mb-1">
                    {offer.Title} <small className="text-muted">{offer.DiscountPercentage}%</small>
                  </h6>
                  <small className="text-muted">{offer.Description}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm p-3 h-100">
              <h5 className="card-title mb-3 text-danger">Top 5 Flight Offers</h5>
              {flightOffers.map((offer, i) => (
                <div key={i} className="border-start border-4 border-warning ps-3 py-2 mb-2 bg-light rounded">
                  <h6 className="fw-bold mb-1">
                    {offer.Title} <small className="text-muted">{offer.DiscountPercentage}%</small>
                  </h6>
                  <small className="text-muted">{offer.Description}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row g-4 mt-4">
          <div className="col-md-6">
            <ChartCard title="Revenue by User">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={revenueByUser} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {revenueByUser.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${parseFloat(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="col-md-6">
            <ChartCard title="Top 5 Hotel Bookings">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topHotelBookings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="col-md-6">
            <ChartCard title="Top 5 Flight Bookings">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topFlightBookings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="col-md-6">
            <ChartCard title="Bookings Per User">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bookingsPerUser}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, _, obj) =>
                      obj.dataKey === "bookings" ? `${value} bookings` : `₹${parseFloat(value).toFixed(2)}`
                    }
                  />
                  <Bar dataKey="bookings" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="col-12">
            <ChartCard title="Daily Revenue Trend">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => `₹${parseFloat(value).toFixed(2)}`} />
                  <Area dataKey="total" type="monotone" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="card shadow-sm p-3 h-100">
    <h5 className="card-title mb-3">{title}</h5>
    {children}
  </div>
);

export default OverView;
