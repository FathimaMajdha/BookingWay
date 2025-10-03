import axiosInstance from "./axiosInstance";

const CoTravellerApis = {
  getAll: async () => {
    try {
      const response = await axiosInstance.get("/CoTraveller");
      return response;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/CoTraveller/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  add: async (travellerData) => {
    try {
      const response = await axiosInstance.post("/CoTraveller", travellerData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, travellerData) => {
    try {
      const response = await axiosInstance.put(`/CoTraveller/${id}`, travellerData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await axiosInstance.delete(`/CoTraveller/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};

export default CoTravellerApis;
