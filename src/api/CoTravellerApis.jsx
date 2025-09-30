import axiosInstance from "./axiosInstance";

const CoTravellerApis = {
  add: (traveller) => axiosInstance.post("/CoTraveller/add", traveller),
  update: (id, traveller) => axiosInstance.put(`/CoTraveller/update/${id}`, traveller),
  delete: (id) => axiosInstance.delete(`/CoTraveller/delete/${id}`),
  getAll: () => axiosInstance.get("/CoTraveller/all"),
  getById: (id) => axiosInstance.get(`/CoTraveller/${id}`),
};

export default CoTravellerApis;
