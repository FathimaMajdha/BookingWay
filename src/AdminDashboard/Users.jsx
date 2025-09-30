import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { BsSearch, BsSortDown, BsSortUp } from "react-icons/bs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../api/axiosInstance"; 

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  
  const [pageSize, setPageSize] = useState(5); 
  const [sortConfig, setSortConfig] = useState({
    column: 'Created_At',
    direction: 'DESC'
  });

  const fetchUsers = async (page = 1, searchTerm = "", sortColumn = 'Created_At', sortDirection = 'DESC') => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: pageSize,
        sortColumn: sortColumn,
        sortDirection: sortDirection,
        searchTerm: searchTerm || null
      };

      console.log("🔄 API Request params:", params);

      const res = await axiosInstance.get("/admin/usermanagement/users", { params });
      console.log("📦 Users API response:", res.data);
      
      let usersData = [];
      let totalCount = 0;
      let pageNumber = page;
      let totalPages = 0;
      
      if (res.data && res.data.Success) { 
       
        if (res.data.Data && res.data.Data.Data) {
          
          usersData = res.data.Data.Data || [];
          totalCount = res.data.Data.TotalCount || 0;
          pageNumber = res.data.Data.PageNumber || page;
          totalPages = res.data.Data.TotalPages || 1;
        } else if (res.data.Data && Array.isArray(res.data.Data)) {
          
          usersData = res.data.Data || [];
          totalCount = res.data.TotalCount || usersData.length;
          totalPages = Math.ceil(totalCount / pageSize);
        } else {
          
          usersData = res.data.Data || [];
          totalCount = res.data.TotalCount || usersData.length;
          totalPages = Math.ceil(totalCount / pageSize);
        }

        setUsers(usersData);
        setTotalCount(totalCount);
        setTotalPages(totalPages);
        setCurrentPage(pageNumber);
        
        console.log(`✅ Page ${pageNumber}/${totalPages}: Showing ${usersData.length} of ${totalCount} users`);
      } else {
        console.warn("⚠️ Unexpected users response structure:", res.data);
        setUsers([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      toast.error(err.response?.data?.Message || "Failed to fetch users. Please try again.");
      setUsers([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, "", sortConfig.column, sortConfig.direction);
    debugBackendData();
  }, [pageSize, sortConfig]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, searchVal, sortConfig.column, sortConfig.direction);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchVal]);

  const handleSort = (column) => {
    const newDirection = sortConfig.column === column && sortConfig.direction === 'ASC' ? 'DESC' : 'ASC';
    setSortConfig({
      column,
      direction: newDirection
    });
  };

  const getSortIcon = (column) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'ASC' ? <BsSortUp /> : <BsSortDown />;
  };

  const toggleButton = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      
      setUsers((prev) => 
        prev.map((user) => 
          user.id === userId ? { ...user, isBlocked: !currentStatus } : user
        )
      );
      
      const endpoint = currentStatus ? "unblock" : "block";
      const response = await axiosInstance.post(`/admin/usermanagement/${endpoint}/${userId}`);
      
      if (response.data.Success) { 
        console.log(`User ${userId} ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
        toast.success(`User ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
        
        fetchUsers(currentPage, searchVal, sortConfig.column, sortConfig.direction);
      } else {
        throw new Error(response.data.Message || "Operation failed"); 
      }
    } catch (err) {
      console.error("Error updating user status:", err);
      
      setUsers((prev) => 
        prev.map((user) => 
          user.id === userId ? { ...user, isBlocked: currentStatus } : user
        )
      );
      toast.error(err.response?.data?.Message || "Failed to update user status. Please try again."); 
    } finally {
      setActionLoading(null);
    }
  };
  

  
const debugBackendData = async () => {
  try {
    const response = await axiosInstance.get("/admin/usermanagement/users", {
      params: { pageNumber: 1, pageSize: 10 }
    });
    console.log("🐛 DEBUG Backend Response:", {
      success: response.data.Success,
      dataType: typeof response.data.Data,
      isArray: Array.isArray(response.data.Data),
      dataLength: response.data.Data?.length,
      firstUser: response.data.Data?.[0],
      totalCount: response.data.TotalCount,
      fullResponse: response.data
    });
  } catch (error) {
    console.error("🐛 DEBUG Error:", error);
  }
};


  const deleteButton = async (userId) => {
    const userName = users.find(u => u.id === userId)?.name || 'this user';
    
    const confirmDelete = () => {
      toast.info(
        <div>
          <p>Are you sure you want to delete {userName}?</p>
          <div className="mt-2">
            <button 
              className="btn btn-danger btn-sm me-2"
              onClick={() => {
                toast.dismiss();
                proceedWithDelete(userId);
              }}
            >
              Yes, Delete
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => toast.dismiss()}
            >
              Cancel
            </button>
          </div>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    };

    confirmDelete();
  };

  const proceedWithDelete = async (userId) => {
    setActionLoading(userId);
    try {
      const response = await axiosInstance.delete(`/admin/usermanagement/delete/${userId}`);
      
      if (response.data.Success) { 
        console.log(`User ${userId} deleted successfully`);
        toast.success('User deleted successfully');
       
        fetchUsers(currentPage, searchVal, sortConfig.column, sortConfig.direction);
      } else {
        throw new Error(response.data.Message || "Delete operation failed"); 
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(err.response?.data?.Message || "Failed to delete user. Please try again."); 
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    fetchUsers(pageNumber, searchVal, sortConfig.column, sortConfig.direction);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleModalOpen = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="d-flex">
      <Sidebar />
      
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
      
      <div className="container mt-4" style={{ marginLeft: "200px" }}>
        <h1 className="mb-4 fw-semibold">Users List</h1>

        
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">
                <BsSearch />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by username or email..."
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select" 
              value={pageSize} 
              onChange={handlePageSizeChange}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
          <div className="col-md-3">
            <div className="text-muted small">
              Total: {totalCount} users
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading users...</p>
          </div>
        )}

        <div className="table-responsive shadow rounded" style={{width:"1000px"}}>
          <table className="table table-striped table-hover align-middle">
            <thead className="table-dark text-center">
              <tr>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('Username')}
                >
                  Username {getSortIcon('Username')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('TotalBookings')}
                >
                  Total Bookings {getSortIcon('TotalBookings')}
                </th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('Email')}
                >
                  Email {getSortIcon('Email')}
                </th>
                <th>Status</th>
                <th 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSort('RegistrationDate')}
                >
                  Registered {getSortIcon('RegistrationDate')}
                </th>
                <th colSpan="3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-center">
  {users.length > 0 ? (
    users.map((user, index) => {
      
      const userId = user.UserAuthId || user.id;
      const uniqueKey = userId ? `user-${userId}` : `user-${index}-${user.Username || 'unknown'}`;
      
      return (
        <tr key={uniqueKey}>
          <td className="fw-semibold">{user.Username || user.name}</td>
          <td>
            <span>{user.TotalBookings || user.totalBookings || 0}</span>
          </td>
          <td>{user.Email || user.email}</td>
          <td>
            <span className={`badge ${user.IsBlocked || user.isBlocked ? 'bg-danger' : 'bg-success'}`}>
              {user.IsBlocked || user.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </td>
          <td>
            <small>{formatDate(user.RegistrationDate || user.registrationDate)}</small>
          </td>
          <td>
            <button
              className={`btn btn-sm ${user.IsBlocked || user.isBlocked ? "btn-success" : "btn-warning"}`}
              onClick={() => toggleButton(userId, user.IsBlocked || user.isBlocked)}
              disabled={actionLoading === userId || userId === 1}
              title={userId === 1 ? "Cannot modify admin user" : ""}
            >
              {actionLoading === userId ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : user.IsBlocked || user.isBlocked ? (
                "Unblock"
              ) : (
                "Block"
              )}
            </button>
          </td>
          <td>
            <button 
              className="btn btn-sm btn-primary text-white" 
              onClick={() => handleModalOpen(user)}
            >
              View Details
            </button>
          </td>
          <td>
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={() => deleteButton(userId)}
              disabled={actionLoading === userId || userId === 1}
              title={userId === 1 ? "Cannot delete admin user" : ""}
            >
              {actionLoading === userId ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                "Delete"
              )}
            </button>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="8" className="text-muted py-4">
        {loading ? "Loading users..." : "No users found"}
      </td>
    </tr>
  )}
</tbody>
          </table>
        </div>

        {!loading && totalPages > 0 && (
          <nav className="mt-4">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  &laquo; Previous
                </button>
              </li>
              
              
              <li className="page-item disabled">
                <span className="page-link">
                  Page {currentPage} of {totalPages}
                </span>
              </li>
              
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next &raquo;
                </button>
              </li>
            </ul>
            
            
            <div className="text-center text-muted small mt-2">
              Showing {users.length} of {totalCount} users • {pageSize} per page
            </div>
          </nav>
        )}

        
        {showModal && selectedUser && (
          <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">User Details - {selectedUser.Username || selectedUser.name}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleModalClose}></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <p><strong>Username:</strong> {selectedUser.Username || selectedUser.name}</p>
                      <p><strong>Email:</strong> {selectedUser.Email || selectedUser.email}</p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Status:</strong> 
                        <span className={`badge ${selectedUser.IsBlocked || selectedUser.isBlocked ? 'bg-danger' : 'bg-success'} ms-2`}>
                          {selectedUser.IsBlocked || selectedUser.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </p>
                      <p>
                        <strong>Registered:</strong> {formatDate(selectedUser.RegistrationDate || selectedUser.registrationDate)}
                      </p>
                      <p>
                        <strong>Total Bookings:</strong> {selectedUser.TotalBookings || selectedUser.totalBookings || 0}
                      </p>
                    </div>
                  </div>
                  
                  <hr />
                  
                  <h6 className="mt-3 mb-3 text-primary">
                    Booking History ({selectedUser.Bookings?.length || selectedUser.bookings?.length || 0})
                  </h6>
                  
                  {(selectedUser.Bookings || selectedUser.bookings || []).length > 0 ? (
                    <div className="booking-list">
                      {(selectedUser.Bookings || selectedUser.bookings || []).map((order) => (
                        <div key={order.BookingId || order.bookingId} className="card mb-3">
                          <div className="card-header d-flex justify-content-between align-items-center">
                            <span className={`badge ${order.BookingType || order.type === 'Flight' ? 'bg-primary' : 'bg-success'}`}>
                              {order.BookingType || order.type} Booking
                            </span>
                            <span className={`badge ${
                              (order.PaymentStatus || order.paymentStatus) === 'Confirmed' || 
                              (order.PaymentStatus || order.paymentStatus) === 'Success' ? 'bg-success' : 
                              (order.PaymentStatus || order.paymentStatus) === 'Pending' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {order.PaymentStatus || order.paymentStatus}
                            </span>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-8">
                                <h6 className="card-title">{order.Name || order.name}</h6>
                                <p className="card-text mb-1">
                                  <strong>Booking ID:</strong> {order.BookingId || order.bookingId}
                                </p>
                                <p className="card-text mb-1">
                                  <strong>Customer:</strong> {order.CustomerName || order.customerName}
                                </p>
                                <p className="card-text mb-1">
                                  <strong>Contact:</strong> {order.CustomerEmail || order.customerEmail} | {order.CustomerPhone || order.customerPhone}
                                </p>
                              </div>
                              <div className="col-md-4 text-end">
                                <p className="card-text">
                                  <strong>Amount:</strong> ₹{(order.TotalAmount || order.totalAmount)?.toFixed(2)}
                                </p>
                                <p className="card-text">
                                  <small className="text-muted">
                                    {new Date(order.BookingDate || order.bookingDate).toLocaleString()}
                                  </small>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <p>No bookings available for this user</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleModalClose}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;