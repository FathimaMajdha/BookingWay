import axiosInstance from "./axiosInstance";

const CloudStorageApis = {
  uploadImage: async (file, folder = null) => {
    const formData = new FormData();
    formData.append("file", file);

    let url = "/CloudStorage/upload";
    if (folder) {
      url += `?folder=${encodeURIComponent(folder)}`;
    }

    try {
      const response = await axiosInstance.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  uploadMultipleImages: async (files, folder = null) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    let url = "/CloudStorage/upload-multiple";
    if (folder) {
      url += `?folder=${encodeURIComponent(folder)}`;
    }

    try {
      const response = await axiosInstance.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteImage: async (imageUrl) => {
    try {
      const response = await axiosInstance.delete("/CloudStorage/delete", {
        params: { imageUrl },
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  uploadProfilePicture: async (file, userId = null) => {
    const folder = userId ? `profile-pictures/${userId}` : "profile-pictures";
    return await CloudStorageApis.uploadImage(file, folder);
  },

  uploadHotelImages: async (files, hotelId = null) => {
    const folder = hotelId ? `hotels/${hotelId}` : "hotels";
    return await CloudStorageApis.uploadMultipleImages(files, folder);
  },

  uploadRoomImages: async (files, roomId = null) => {
    const folder = roomId ? `rooms/${roomId}` : "rooms";
    return await CloudStorageApis.uploadMultipleImages(files, folder);
  },
};

export default CloudStorageApis;
