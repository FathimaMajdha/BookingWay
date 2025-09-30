
import axiosInstance from "../api/axiosInstance";

const UserProfileApis = {
  
  addUser: async (data) => {
    const res = await axiosInstance.post("/UserProfile/add", data);
    return res.data;
  },

 
  updateUser: async (userId, data) => {
    const res = await axiosInstance.put(`/UserProfile/update/${userId}`, data);
    return res.data;
  },

  
  deleteUser: async () => {
  const res = await axiosInstance.delete("/UserProfile/delete");
  return res.data;
},


 
getMyProfile: async () => {
    const res = await axiosInstance.get("/UserProfile/me");
    return res.data; 
},



  getAllUsers: async () => {
    const res = await axiosInstance.get("/UserProfile/all");
    return res.data;
  }
};


export default UserProfileApis;
