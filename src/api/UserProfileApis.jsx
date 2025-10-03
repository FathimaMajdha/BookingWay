import axiosInstance from "./axiosInstance";

const UserProfileApis = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get("/UserProfile");
      return response;
    } catch (error) {
      throw error;
    }
  },

  getMyProfile: async () => {
    try {
      const response = await axiosInstance.get("/UserProfile/my-profile");
      return response;
    } catch (error) {
      throw error;
    }
  },

  getByAuthId: async (userAuthId) => {
    try {
      const response = await axiosInstance.get(`/UserProfile/auth/${userAuthId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  addUser: async (userData) => {
    try {
      const response = await axiosInstance.post("/UserProfile", userData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (userData) => {
    try {
      const response = await axiosInstance.put("/UserProfile", userData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async () => {
    try {
      const response = await axiosInstance.delete("/UserProfile");
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default UserProfileApis;
