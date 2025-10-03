import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../api/axiosInstance";
import { useParams } from "react-router-dom";

const Hotel = () => {
  const { hotelId } = useParams();
  const [hotels, setHotels] = useState([]);
  const [hotelSearches, setHotelSearches] = useState([]);
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [editHotel, setEditHotel] = useState(null);
  const [editSearch, setEditSearch] = useState(null);
  const [newHotel, setNewHotel] = useState({
    Hotel_Search_Id: "",
    Hotel_Name: "",
    Nearest_Location: "",
    City: "",
    Rating: 0,
    Hotel_Description: "",
    Price: 0,
    Reviews: "",
    FreeCancellation: false,
    BreakfastIncluded: false,
    AmenitiesDescription: "",
    Hotel_Pictures: [],
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchDto, setSearchDto] = useState({
    Location: "",
    Checkin: "",
    Checkout: "",
    Guest_Type: "",
    Guest_Count: 1,
    Room_Count: 1,
  });

  const [showRoomOptionsModal, setShowRoomOptionsModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [showPoliciesModal, setShowPoliciesModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSimilarPropertiesModal, setShowSimilarPropertiesModal] = useState(false);
  const [showDiningModal, setShowDiningModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [roomData, setRoomData] = useState([]);
  const [amenitiesData, setAmenitiesData] = useState([]);
  const [policiesData, setPoliciesData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [similarPropsData, setSimilarPropsData] = useState([]);
  const [diningData, setDiningData] = useState({});
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHotelDetails, setSelectedHotelDetails] = useState(null);
  const hotelsPerPage = 10;

  const safeToast = {
    success: (message) => {
      try {
        toast.success(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (error) {
        console.warn("Toast error:", error);
      }
    },
    error: (message) => {
      try {
        toast.error(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } catch (error) {
        console.warn("Toast error:", error);
      }
    },
    info: (message) => {
      try {
        toast.info(message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnHover: true,
        });
      } catch (error) {
        console.warn("Toast error:", error);
      }
    },
  };

  useEffect(() => {
    fetchHotelSearches();
    fetchHotels();
  }, []);

  const fetchHotelSearches = async () => {
    try {
      const res = await axiosInstance.get("/admin/AdminHotelSearch");
      console.log("Hotel searches API response:", res.data);

      if (res.data && res.data.Success && res.data.Data) {
        setHotelSearches(res.data.Data);
      } else if (res.data && Array.isArray(res.data)) {
        setHotelSearches(res.data);
      } else {
        console.warn("Unexpected hotel searches response structure:", res.data);
        setHotelSearches([]);
      }
    } catch (err) {
      console.error("Failed to load hotel searches:", err);
      safeToast.error("Failed to load hotel searches");
      setHotelSearches([]);
    }
  };

  const fetchHotels = async () => {
    try {
      const res = await axiosInstance.get("/admin/AdminHotel");
      console.log("Raw hotels API response:", res.data);

      let hotelsData = [];
      if (res.data && res.data.Success && res.data.Data) {
        hotelsData = res.data.Data;
      } else if (res.data && Array.isArray(res.data)) {
        hotelsData = res.data;
      } else {
        console.warn("Unexpected hotels response structure:", res.data);
        hotelsData = [];
      }

      if (hotelsData.length === 0) {
        console.log("No hotels data found");
        setHotels([]);
        return;
      }

      const hotelsWithDetails = await Promise.all(
        hotelsData.map(async (hotel) => {
          try {
            const [rooms, amenities, policies, locations, dining, similarProps] = await Promise.all([
              axiosInstance.get(`/admin/AdminHotelRoom?hotelId=${hotel.HotelId}`).catch(() => ({ data: [] })),
              axiosInstance.get(`/admin/AdminAmenity?hotelId=${hotel.HotelId}`).catch(() => ({ data: [] })),
              axiosInstance.get(`/admin/AdminHotelPolicy?hotelId=${hotel.HotelId}`).catch(() => ({ data: [] })),
              axiosInstance.get(`/admin/AdminHotelLocation?hotelId=${hotel.HotelId}`).catch(() => ({ data: [] })),
              axiosInstance.get(`admin/AdminHotelDining?hotelId=${hotel.HotelId}`).catch(() => ({ data: [] })),
              axiosInstance.get(`/admin/AdminSimilarProperty/similar/${hotel.HotelId}`).catch(() => ({ data: [] })),
            ]);

            let hotelImages = [];
            if (hotel.Hotel_Pictures) {
              try {
                if (typeof hotel.Hotel_Pictures === "string") {
                  if (hotel.Hotel_Pictures.startsWith("[")) {
                    const parsedImages = JSON.parse(hotel.Hotel_Pictures);
                    hotelImages = Array.isArray(parsedImages) ? parsedImages : [];
                  } else if (hotel.Hotel_Pictures.includes(",")) {
                    hotelImages = hotel.Hotel_Pictures.split(",").filter((url) => url.trim() !== "");
                  } else if (hotel.Hotel_Pictures.trim() !== "" && hotel.Hotel_Pictures !== "[]") {
                    hotelImages = [hotel.Hotel_Pictures.trim()];
                  }
                } else if (Array.isArray(hotel.Hotel_Pictures)) {
                  hotelImages = hotel.Hotel_Pictures;
                }
              } catch (error) {
                console.error("Error parsing hotel images:", error);
                hotelImages = [];
              }
            }

            const normalizeArrayResponse = (response) => {
              if (!response.data) return [];
              if (response.data.Success && response.data.Data && Array.isArray(response.data.Data)) {
                return response.data.Data;
              } else if (response.data.Data && Array.isArray(response.data.Data)) {
                return response.data.Data;
              } else if (Array.isArray(response.data)) {
                return response.data;
              }
              return [];
            };

            let normalizedDining = [];
            if (dining.data) {
              if (dining.data.Success && dining.data.Data && Array.isArray(dining.data.Data)) {
                normalizedDining = dining.data.Data;
              } else if (Array.isArray(dining.data)) {
                normalizedDining = dining.data;
              } else if (Object.keys(dining.data).length > 0) {
                normalizedDining = [dining.data];
              }
            }

            let normalizedSimilarProps = [];
            if (similarProps.data) {
              let similarPropsArray = [];

              if (similarProps.data.Success && similarProps.data.Data && Array.isArray(similarProps.data.Data)) {
                similarPropsArray = similarProps.data.Data;
              } else if (Array.isArray(similarProps.data)) {
                similarPropsArray = similarProps.data;
              } else if (Object.keys(similarProps.data).length > 0) {
                similarPropsArray = [similarProps.data];
              }

              normalizedSimilarProps = similarPropsArray.map((prop) => ({
                SimilarId: prop.SimilarId || prop.PropId || prop.Id,
                HotelId: prop.HotelId,
                SimilarHotel_Name: prop.SimilarHotel_Name || prop.PropertyName || prop.Hotel_Name || "",
                Location: prop.Location || prop.City || "",
                Reviews: prop.Reviews || "",
                Rating: prop.Rating || 0,
                Price_Per_Night: prop.Price_Per_Night || prop.Price || 0,
                ImageUrl: prop.ImageUrl || "",
              }));
            }

            return {
              ...hotel,
              Id: hotel.HotelId,
              Hotel_Pictures: hotelImages,
              rooms: normalizeArrayResponse(rooms),
              amenities: normalizeArrayResponse(amenities),
              policies: normalizeArrayResponse(policies),
              locations: normalizeArrayResponse(locations),
              dining: normalizedDining,
              similarProperties: normalizedSimilarProps,
              hasDetails: {
                rooms: normalizeArrayResponse(rooms).length > 0,
                amenities: normalizeArrayResponse(amenities).length > 0,
                policies: normalizeArrayResponse(policies).length > 0,
                locations: normalizeArrayResponse(locations).length > 0,
                dining: normalizedDining.length > 0,
                similarProperties: normalizedSimilarProps.length > 0,
                images: hotelImages.length > 0,
              },
            };
          } catch (error) {
            console.error(`Error fetching details for hotel ${hotel.HotelId}:`, error);
            return {
              ...hotel,
              Id: hotel.HotelId,
              Hotel_Pictures: [],
              rooms: [],
              amenities: [],
              policies: [],
              locations: [],
              dining: [],
              similarProperties: [],
              hasDetails: {
                rooms: false,
                amenities: false,
                policies: false,
                locations: false,
                dining: false,
                similarProperties: false,
                images: false,
              },
            };
          }
        })
      );

      console.log("Hotels with details:", hotelsWithDetails);
      setHotels(hotelsWithDetails);
    } catch (err) {
      console.error("Failed to load hotels:", err);
      safeToast.error("Failed to load hotels");
      setHotels([]);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }

      const options = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      return date.toLocaleString("en-US", options);
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    let data = hotels;

    data = data.filter(
      (hotel) =>
        hotel.Hotel_Name && hotel.Hotel_Name.trim() !== "" && hotel.Nearest_Location && hotel.Nearest_Location.trim() !== ""
    );

    if (searchTerm.trim()) {
      data = data.filter(
        (h) =>
          h.Hotel_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.Nearest_Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.City?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const startIndex = (currentPage - 1) * hotelsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + hotelsPerPage);

    console.log("Filtered hotels:", paginatedData);
    setFilteredHotels(paginatedData);
  }, [searchTerm, hotels, currentPage]);

  const totalPages = Math.ceil(
    hotels.filter(
      (hotel) =>
        hotel.Hotel_Name && hotel.Hotel_Name.trim() !== "" && hotel.Nearest_Location && hotel.Nearest_Location.trim() !== ""
    ).length / hotelsPerPage
  );

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const handleAddImage = (imageUrl) => {
    if (imageUrl.trim() === "") {
      safeToast.warning("Please enter an image URL");
      return;
    }

    const hotelState = editHotel || newHotel;
    const currentImages = Array.isArray(hotelState.Hotel_Pictures) ? hotelState.Hotel_Pictures : [];

    if (currentImages.includes(imageUrl)) {
      safeToast.warning("This image URL already exists");
      return;
    }

    const updatedImages = [...currentImages, imageUrl];

    if (editHotel) {
      setEditHotel({ ...editHotel, Hotel_Pictures: updatedImages });
    } else {
      setNewHotel({ ...newHotel, Hotel_Pictures: updatedImages });
    }

    safeToast.success("Image added successfully");
  };

  const handleRemoveImage = async (index) => {
    const hotelState = editHotel || newHotel;
    const currentImages = Array.isArray(hotelState.Hotel_Pictures) ? hotelState.Hotel_Pictures : [];

    if (window.confirm("Are you sure you want to remove this image?")) {
      try {
        const updatedImages = currentImages.filter((_, i) => i !== index);

        if (editHotel) {
          setEditHotel({ ...editHotel, Hotel_Pictures: updatedImages });
        } else {
          setNewHotel({ ...newHotel, Hotel_Pictures: updatedImages });
        }

        safeToast.success("Image removed successfully! Remember to save changes.");
      } catch (error) {
        console.error("Error removing image:", error);
        safeToast.error("Failed to remove image");
      }
    }
  };

  const handleOpenImageModal = () => {
    setShowImageModal(true);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    const hotelState = editHotel || newHotel;
    const images = Array.isArray(hotelState.Hotel_Pictures) ? hotelState.Hotel_Pictures : [];
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    const hotelState = editHotel || newHotel;
    const images = Array.isArray(hotelState.Hotel_Pictures) ? hotelState.Hotel_Pictures : [];
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAddSearch = async () => {
    try {
      const res = await axiosInstance.post("/admin/AdminHotelSearch", searchDto);
      if (res.data.Success) {
        safeToast.success("Hotel search added!");
        fetchHotelSearches();
        setShowSearchModal(false);
        setSearchDto({
          Location: "",
          Checkin: "",
          Checkout: "",
          Guest_Type: "",
          Guest_Count: 1,
          Room_Count: 1,
        });
      } else {
        safeToast.error(res.data.Message || "Failed to add hotel search");
      }
    } catch (err) {
      safeToast.error("Failed to add hotel search");
    }
  };

  const handleUpdateSearch = async () => {
    try {
      const res = await axiosInstance.put(`/admin/AdminHotelSearch/${editSearch.HotelSearchId}`, searchDto);
      if (res.data.Success) {
        safeToast.success("Hotel search updated!");
        fetchHotelSearches();
        setShowSearchModal(false);
        setEditSearch(null);
      } else {
        safeToast.error(res.data.Message || "Failed to update search");
      }
    } catch (err) {
      safeToast.error("Failed to update search");
    }
  };

  const handleDeleteSearch = async (id) => {
    try {
      const res = await axiosInstance.delete(`/admin/AdminHotelSearch/${id}`);
      if (res.data.Success) {
        safeToast.success("Hotel search deleted!");
        fetchHotelSearches();
      } else {
        safeToast.error(res.data.Message || "Failed to delete search");
      }
    } catch (err) {
      safeToast.error("Failed to delete search");
    }
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/admin/AdminHotel/${id}`);

      if (response.data.Success) {
        safeToast.success("Hotel deleted successfully!");
        fetchHotels();
      } else {
        safeToast.error(response.data.Message || "Failed to delete hotel");
      }
    } catch (err) {
      console.error("Delete hotel error:", err);
      safeToast.error("Failed to delete hotel: " + (err.response?.data?.Message || err.message));
    }
  };

  const handleOpenAddHotel = (searchId) => {
    const search = hotelSearches.find((hs) => hs.HotelSearchId === searchId);
    if (!search) return safeToast.error("Hotel search not found!");

    setNewHotel({
      Hotel_Search_Id: searchId,
      Hotel_Name: "",
      Nearest_Location: "",
      City: "",
      Rating: 0,
      Hotel_Description: "",
      Price: 0,
      Reviews: "",
      FreeCancellation: false,
      BreakfastIncluded: false,
      AmenitiesDescription: "",
      Hotel_Pictures: [],
    });

    if (!editHotel) {
      setRoomData([]);
      setAmenitiesData([]);
      setLocationData([]);
      setPoliciesData([]);
      setDiningData({});
      setSimilarPropsData([]);
    }

    setShowAddHotelModal(true);
  };

  const handleSaveHotel = async () => {
    try {
      const hotelData = {
        ...newHotel,
        Hotel_Pictures: Array.isArray(newHotel.Hotel_Pictures) ? newHotel.Hotel_Pictures : [],
      };

      const res = await axiosInstance.post("/admin/AdminHotel", hotelData);

      if (res.data.Success) {
        const hotelId = res.data.Data;

        await saveRelatedData(hotelId);

        safeToast.success("Hotel added with full details!");
        setShowAddHotelModal(false);
        resetFormData();
        await fetchHotels();
      } else {
        safeToast.error(res.data.Message || "Failed to add hotel");
      }
    } catch (err) {
      console.error("Save hotel error:", err);
      safeToast.error("Failed to add hotel: " + (err.response?.data?.Message || err.message));
    }
  };

  const saveRelatedData = async (hotelId) => {
    const savePromises = [];

    if (roomData.length > 0) {
      roomData.forEach((room) => {
        savePromises.push(axiosInstance.post("/admin/AdminHotelRoom", { ...room, HotelId: hotelId }));
      });
    }

    if (amenitiesData.length > 0) {
      amenitiesData.forEach((amenity) => {
        savePromises.push(axiosInstance.post("/admin/AdminAmenity", { ...amenity, HotelId: hotelId }));
      });
    }

    if (policiesData.length > 0) {
      policiesData.forEach((policy) => {
        savePromises.push(axiosInstance.post("/admin/AdminHotelPolicy", { ...policy, HotelId: hotelId }));
      });
    }

    if (locationData.length > 0) {
      locationData.forEach((location) => {
        savePromises.push(axiosInstance.post("/admin/AdminHotelLocation", { ...location, HotelId: hotelId }));
      });
    }

    if (Object.keys(diningData).length > 0) {
      savePromises.push(axiosInstance.post("/admin/AdminHotelDining", { ...diningData, HotelId: hotelId }));
    }

    if (similarPropsData.length > 0) {
      similarPropsData.forEach((prop) => {
        savePromises.push(axiosInstance.post("/admin/AdminSimilarProperty", { ...prop, HotelId: hotelId }));
      });
    }

    await Promise.all(savePromises);
  };

  const resetFormData = () => {
    setNewHotel({
      Hotel_Search_Id: "",
      Hotel_Name: "",
      Nearest_Location: "",
      City: "",
      Rating: 0,
      Hotel_Description: "",
      Price: 0,
      Reviews: "",
      FreeCancellation: false,
      BreakfastIncluded: false,
      AmenitiesDescription: "",
      Hotel_Pictures: [],
    });
    setRoomData([]);
    setAmenitiesData([]);
    setLocationData([]);
    setPoliciesData([]);
    setDiningData({});
    setSimilarPropsData([]);
  };

  const handleUpdateHotel = async () => {
    try {
      const hotelUpdateData = {
        Hotel_Search_Id: editHotel.Hotel_Search_Id,
        Hotel_Name: editHotel.Hotel_Name,
        Nearest_Location: editHotel.Nearest_Location,
        City: editHotel.City,
        Rating: editHotel.Rating || 0,
        Hotel_Description: editHotel.Hotel_Description,
        Price: editHotel.Price || 0,
        Reviews: editHotel.Reviews,
        FreeCancellation: editHotel.FreeCancellation,
        BreakfastIncluded: editHotel.BreakfastIncluded,
        AmenitiesDescription: editHotel.AmenitiesDescription,
        Hotel_Pictures: Array.isArray(editHotel.Hotel_Pictures) ? editHotel.Hotel_Pictures : [],
      };

      const response = await axiosInstance.put(`/admin/AdminHotel/${editHotel.HotelId}`, hotelUpdateData);

      if (response.data.Success) {
        await updateRelatedData();
        safeToast.success("Hotel and details updated successfully!");
        await fetchHotels();
        handleCloseAddHotelModal();
      } else {
        safeToast.error(response.data.Message || "Failed to update hotel");
      }
    } catch (err) {
      console.error("Update error:", err);
      safeToast.error("Failed to update hotel: " + (err.response?.data?.Message || err.message));
    }
  };

  const updateRelatedData = async () => {
    const hotelId = editHotel.HotelId;

    for (const room of roomData) {
      const roomDataToSend = { ...room, HotelId: hotelId };
      if (room.RoomId) {
        await axiosInstance.put(`/admin/AdminHotelRoom/${room.RoomId}`, roomDataToSend);
      } else {
        await axiosInstance.post("/admin/AdminHotelRoom", roomDataToSend);
      }
    }

    for (const amenity of amenitiesData) {
      const amenityDataToSend = { ...amenity, HotelId: hotelId };
      if (amenity.AmenityId) {
        await axiosInstance.put(`/admin/AdminAmenity/${amenity.AmenityId}`, amenityDataToSend);
      } else {
        await axiosInstance.post("/admin/AdminAmenity", amenityDataToSend);
      }
    }

    for (const policy of policiesData) {
      const policyDataToSend = { ...policy, HotelId: hotelId };
      if (policy.PolicyId) {
        await axiosInstance.put(`/admin/AdminHotelPolicy/${policy.PolicyId}`, policyDataToSend);
      } else {
        await axiosInstance.post("/admin/AdminHotelPolicy", policyDataToSend);
      }
    }

    for (const location of locationData) {
      const locationDataToSend = { ...location, HotelId: hotelId };
      if (location.LocationId) {
        await axiosInstance.put(`/admin/AdminHotelLocation/${location.LocationId}`, locationDataToSend);
      } else {
        await axiosInstance.post("/admin/AdminHotelLocation", locationDataToSend);
      }
    }

    if (Object.keys(diningData).length > 0) {
      const diningDataToSend = { ...diningData, HotelId: hotelId };
      if (diningData.DiningId) {
        await axiosInstance.put(`/admin/AdminHotelDining/${diningData.DiningId}`, diningDataToSend);
      } else {
        await axiosInstance.post("/admin/AdminHotelDining", diningDataToSend);
      }
    }

    for (const prop of similarPropsData) {
      const propDataToSend = { ...prop, HotelId: hotelId };
      if (prop.SimilarId) {
        await axiosInstance.put(`/admin/AdminSimilarProperty/${prop.SimilarId}`, propDataToSend);
      } else {
        await axiosInstance.post("/admin/AdminSimilarProperty", propDataToSend);
      }
    }
  };

  const handleEditHotel = (hotel) => {
    console.log("Editing hotel:", hotel);

    let hotelImages = [];
    if (hotel.Hotel_Pictures) {
      if (Array.isArray(hotel.Hotel_Pictures)) {
        hotelImages = hotel.Hotel_Pictures;
      } else if (typeof hotel.Hotel_Pictures === "string") {
        try {
          if (hotel.Hotel_Pictures.startsWith("[")) {
            hotelImages = JSON.parse(hotel.Hotel_Pictures);
          } else if (hotel.Hotel_Pictures.includes(",")) {
            hotelImages = hotel.Hotel_Pictures.split(",").filter((url) => url.trim() !== "");
          }
        } catch (error) {
          console.error("Error parsing images during edit:", error);
          hotelImages = [];
        }
      }
    }

    const hotelWithProcessedImages = {
      ...hotel,
      Hotel_Pictures: hotelImages,
    };

    setEditHotel(hotelWithProcessedImages);
    setRoomData(hotel.rooms || []);
    setAmenitiesData(hotel.amenities || []);
    setPoliciesData(hotel.policies || []);
    setLocationData(hotel.locations || []);
    setDiningData(hotel.dining && hotel.dining.length > 0 ? hotel.dining[0] : {});
    setSimilarPropsData(hotel.similarProperties || []);

    setShowAddHotelModal(true);
  };

  const handleCloseAddHotelModal = () => {
    setShowAddHotelModal(false);
    setEditHotel(null);
    resetFormData();
  };

  const handleEditSearch = (search) => {
    setEditSearch(search);
    setSearchDto({
      Location: search.Location,
      Checkin: search.Checkin,
      Checkout: search.Checkout,
      Guest_Type: search.Guest_Type,
      Guest_Count: search.Guest_Count,
      Room_Count: search.Room_Count,
    });
    setShowSearchModal(true);
  };

  const handleViewDetails = async (hotel) => {
    if (!hotel || !hotel.HotelId) {
      safeToast.error("Invalid hotel data");
      return;
    }

    setIsLoadingDetails(true);
    try {
      await fetchHotels();
      const currentHotel = hotels.find((h) => h.HotelId === hotel.HotelId);

      if (currentHotel) {
        setSelectedHotelDetails(currentHotel);
      } else {
        setSelectedHotelDetails(hotel);
      }
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error loading hotel details:", error);
      safeToast.error("Failed to load hotel details");
      setSelectedHotelDetails(hotel);
      setShowDetailsModal(true);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleRemoveSimilarProperty = async (index) => {
    const propertyToRemove = similarPropsData[index];

    if (window.confirm("Are you sure you want to remove this similar property?")) {
      try {
        if (propertyToRemove.SimilarId) {
          await axiosInstance.delete(`/AdminSimilarProperty/delete/${propertyToRemove.SimilarId}`);
        }
        const updatedProps = similarPropsData.filter((_, i) => i !== index);
        setSimilarPropsData(updatedProps);
        toast.success("Similar property removed!");
      } catch (error) {
        console.error("Failed to delete similar property:", error);
        toast.error("Failed to remove similar property from database");
      }
    }
  };

  const handleRemoveRoom = async (index) => {
    const roomToRemove = roomData[index];

    if (window.confirm("Are you sure you want to remove this room?")) {
      try {
        if (roomToRemove.RoomId) {
          await axiosInstance.delete(`/admin/AdminHotelRoom/${roomToRemove.RoomId}`);
        }
        const updatedRooms = roomData.filter((_, i) => i !== index);
        setRoomData(updatedRooms);
        toast.success("Room removed!");
      } catch (error) {
        console.error("Failed to delete room:", error);
        toast.error("Failed to remove room from database");
      }
    }
  };

  const handleRemoveDining = async () => {
    if (window.confirm("Are you sure you want to remove dining information?")) {
      try {
        if (diningData.DiningId) {
          await axiosInstance.delete(`/AdminHotelDining/delete/${diningData.DiningId}`);
        }

        setDiningData({});
        toast.success("Dining information removed!");
      } catch (error) {
        console.error("Failed to delete dining information:", error);
        toast.error("Failed to remove dining information from database");
      }
    }
  };

  const handleRemoveAmenity = async (index) => {
    const amenityToRemove = amenitiesData[index];

    if (window.confirm("Are you sure you want to remove this amenity?")) {
      try {
        if (amenityToRemove.AmenityId) {
          await axiosInstance.delete(`/admin/AdminAmenity/${amenityToRemove.AmenityId}`);
        }

        const updatedAmenities = amenitiesData.filter((_, i) => i !== index);
        setAmenitiesData(updatedAmenities);
        toast.success("Amenity removed!");
      } catch (error) {
        console.error("Failed to delete amenity:", error);
        toast.error("Failed to remove amenity from database");
      }
    }
  };

  const handleRemovePolicy = async (index) => {
    const policyToRemove = policiesData[index];

    if (window.confirm("Are you sure you want to remove this policy?")) {
      try {
        if (policyToRemove.PolicyId) {
          await axiosInstance.delete(`/admin/AdminHotelpolicy/${policyToRemove.PolicyId}`);
        }

        const updatedPolicies = policiesData.filter((_, i) => i !== index);
        setPoliciesData(updatedPolicies);
        toast.success("Policy removed!");
      } catch (error) {
        console.error("Failed to delete policy:", error);
        toast.error("Failed to remove policy from database");
      }
    }
  };

  const handleRemoveLocation = async (index) => {
    const locationToRemove = locationData[index];

    if (window.confirm("Are you sure you want to remove this location?")) {
      try {
        if (locationToRemove.LocationId) {
          await axiosInstance.delete(`/admin/AdminHotelLocation/${locationToRemove.LocationId}`);
        }

        const updatedLocations = locationData.filter((_, i) => i !== index);
        setLocationData(updatedLocations);
        toast.success("Location removed!");
      } catch (error) {
        console.error("Failed to delete location:", error);
        toast.error("Failed to remove location from database");
      }
    }
  };

  const handleAddSimilarProperty = () => {
    const newProperty = {
      SimilarId: null,
      HotelId: editHotel ? editHotel.HotelId : null,
      SimilarHotel_Name: "",
      Location: "",
      Reviews: "",
      Rating: 0,
      Price_Per_Night: 0,
      ImageUrl: "",
    };

    const isDuplicate = similarPropsData.some(
      (prop) => prop.SimilarHotel_Name === newProperty.SimilarHotel_Name && prop.SimilarHotel_Name !== ""
    );

    if (!isDuplicate) {
      setSimilarPropsData([...similarPropsData, newProperty]);
    } else {
      toast.warning("Similar property with this name already exists!");
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100">
      <Sidebar />
      <div className="p-4 pt-5" style={{ marginLeft: "300px", marginTop: "-2000px" }}>
        <ToastContainer position="top-right" autoClose={2000} />
        <h1 className="text-center mb-4 fw-bold text-dark">Hotel Management</h1>

        <div className="d-flex justify-content-center gap-3 mb-4">
          <button className="btn btn-info" onClick={() => setShowSearchModal(true)}>
            + Hotel Search
          </button>
        </div>

        {hotelSearches.length > 0 && (
          <div className="table-responsive shadow rounded mb-5">
            <h3 className="mt-4 mb-3 text-center">Hotel Searches</h3>
            <table className="table table-bordered table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Guest Type</th>
                  <th>Guests</th>
                  <th>Rooms</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotelSearches.map((hs) => (
                  <tr key={hs.HotelSearchId}>
                    <td>{hs.HotelSearchId}</td>
                    <td>{hs.Location}</td>
                    <td>
                      <span className="text-primary fw-semibold">{formatDateTime(hs.Checkin)}</span>
                    </td>
                    <td>
                      <span className="text-danger fw-semibold">{formatDateTime(hs.Checkout)}</span>
                    </td>
                    <td>{hs.Guest_Type}</td>
                    <td>{hs.Guest_Count}</td>
                    <td>{hs.Room_Count}</td>
                    <td>
                      <button className="btn btn-success btn-sm me-2" onClick={() => handleOpenAddHotel(hs.HotelSearchId)}>
                        + Add Hotel
                      </button>
                      <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditSearch(hs)}>
                        Update
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSearch(hs.HotelSearchId)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">Hotels</h3>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search hotels by name, location, or city..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{ width: "300px" }}
              />
            </div>
          </div>

          {filteredHotels.length > 0 ? (
            <div className="table-responsive shadow rounded">
              <table className="table table-bordered table-striped align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Hotel ID</th>
                    <th>Search ID</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>City</th>
                    <th>Price</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHotels.map((h) => (
                    <tr key={h.HotelId}>
                      <td>{h.HotelId}</td>
                      <td>{h.Hotel_Search_Id}</td>
                      <td>{h.Hotel_Name || "No Name"}</td>
                      <td>{h.Nearest_Location || "No Location"}</td>
                      <td>{h.City || "No City"}</td>
                      <td>${h.Price || 0}</td>
                      <td>{h.Rating || 0}</td>
                      <td>
                        <button className="btn btn-info btn-sm me-2" onClick={() => handleViewDetails(h)}>
                          View Details
                        </button>
                        <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditHotel(h)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHotel(h.HotelId)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => goToPage(currentPage - 1)}>
                          Previous
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => (
                        <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                          <button className="page-link" onClick={() => goToPage(index + 1)}>
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                        <button className="page-link" onClick={() => goToPage(currentPage + 1)}>
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-info text-center">
              {searchTerm ? "No hotels found matching your search." : "No hotels available."}
            </div>
          )}
        </div>

        {showAddHotelModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editHotel ? "Edit Hotel" : "Add Hotel"}</h5>
                  <button className="btn-close" onClick={handleCloseAddHotelModal}></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Hotel Name"
                        value={editHotel ? editHotel.Hotel_Name : newHotel.Hotel_Name}
                        onChange={(e) => {
                          if (editHotel) {
                            setEditHotel({ ...editHotel, Hotel_Name: e.target.value });
                          } else {
                            setNewHotel({ ...newHotel, Hotel_Name: e.target.value });
                          }
                        }}
                      />
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Nearest Location"
                        value={editHotel ? editHotel.Nearest_Location : newHotel.Nearest_Location}
                        onChange={(e) => {
                          if (editHotel) {
                            setEditHotel({ ...editHotel, Nearest_Location: e.target.value });
                          } else {
                            setNewHotel({ ...newHotel, Nearest_Location: e.target.value });
                          }
                        }}
                      />
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="City"
                        value={editHotel ? editHotel.City : newHotel.City}
                        onChange={(e) => {
                          if (editHotel) {
                            setEditHotel({ ...editHotel, City: e.target.value });
                          } else {
                            setNewHotel({ ...newHotel, City: e.target.value });
                          }
                        }}
                      />
                      <input
                        type="number"
                        step="0.1"
                        className="form-control mb-2"
                        placeholder="Rating"
                        value={
                          editHotel
                            ? editHotel.Rating === 0
                              ? ""
                              : editHotel.Rating
                            : newHotel.Rating === 0
                            ? ""
                            : newHotel.Rating
                        }
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                          if (editHotel) {
                            setEditHotel({ ...editHotel, Rating: value });
                          } else {
                            setNewHotel({ ...newHotel, Rating: value });
                          }
                        }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="form-control mb-2"
                        placeholder="Price"
                        value={
                          editHotel
                            ? editHotel.Price === 0
                              ? ""
                              : editHotel.Price
                            : newHotel.Price === 0
                            ? ""
                            : newHotel.Price
                        }
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0;
                          if (editHotel) {
                            setEditHotel({ ...editHotel, Price: value });
                          } else {
                            setNewHotel({ ...newHotel, Price: value });
                          }
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <textarea
                        className="form-control mb-2"
                        placeholder="Hotel Description"
                        value={editHotel ? editHotel.Hotel_Description : newHotel.Hotel_Description}
                        onChange={(e) => {
                          if (editHotel) {
                            setEditHotel({ ...editHotel, Hotel_Description: e.target.value });
                          } else {
                            setNewHotel({ ...newHotel, Hotel_Description: e.target.value });
                          }
                        }}
                      />
                      <textarea
                        className="form-control mb-2"
                        placeholder="Reviews"
                        value={editHotel ? editHotel.Reviews : newHotel.Reviews}
                        onChange={(e) => {
                          if (editHotel) {
                            setEditHotel({ ...editHotel, Reviews: e.target.value });
                          } else {
                            setNewHotel({ ...newHotel, Reviews: e.target.value });
                          }
                        }}
                      />
                      <textarea
                        className="form-control mb-2"
                        placeholder="Amenities Description"
                        value={editHotel ? editHotel.AmenitiesDescription : newHotel.AmenitiesDescription}
                        onChange={(e) => {
                          if (editHotel) {
                            setEditHotel({ ...editHotel, AmenitiesDescription: e.target.value });
                          } else {
                            setNewHotel({ ...newHotel, AmenitiesDescription: e.target.value });
                          }
                        }}
                      />
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={editHotel ? editHotel.FreeCancellation : newHotel.FreeCancellation}
                          onChange={(e) => {
                            if (editHotel) {
                              setEditHotel({ ...editHotel, FreeCancellation: e.target.checked });
                            } else {
                              setNewHotel({ ...newHotel, FreeCancellation: e.target.checked });
                            }
                          }}
                        />
                        <label className="form-check-label">Free Cancellation</label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={editHotel ? editHotel.BreakfastIncluded : newHotel.BreakfastIncluded}
                          onChange={(e) => {
                            if (editHotel) {
                              setEditHotel({ ...editHotel, BreakfastIncluded: e.target.checked });
                            } else {
                              setNewHotel({ ...newHotel, BreakfastIncluded: e.target.checked });
                            }
                          }}
                        />
                        <label className="form-check-label">Breakfast Included</label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold">Hotel Images</h6>
                    <div className="d-flex align-items-center mb-2">
                      <input
                        type="text"
                        className="form-control me-2"
                        placeholder="Enter image URL"
                        id="imageUrlInput"
                        style={{ width: "300px" }}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const input = document.getElementById("imageUrlInput");
                          if (input) {
                            handleAddImage(input.value);
                            input.value = "";
                          }
                        }}
                      >
                        Add Image
                      </button>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {((editHotel ? editHotel.Hotel_Pictures : newHotel.Hotel_Pictures) || []).map((image, index) => (
                        <div key={index} className="position-relative d-inline-block">
                          <img
                            src={image}
                            alt={`Hotel ${index + 1}`}
                            className="img-thumbnail"
                            style={{ width: "100px", height: "100px", objectFit: "cover" }}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/100x100?text=Image+Error";
                            }}
                          />
                          <button
                            className="btn btn-danger btn-sm position-absolute top-0 end-0"
                            style={{ transform: "translate(50%, -50%)" }}
                            onClick={() => handleRemoveImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {((editHotel ? editHotel.Hotel_Pictures : newHotel.Hotel_Pictures) || []).length > 0 && (
                      <button className="btn btn-outline-info btn-sm" onClick={handleOpenImageModal}>
                        View Images ({((editHotel ? editHotel.Hotel_Pictures : newHotel.Hotel_Pictures) || []).length})
                      </button>
                    )}
                  </div>

                  <div className="mb-3 d-flex flex-wrap gap-2">
                    <button className="btn btn-outline-primary" onClick={() => setShowRoomOptionsModal(true)}>
                      Room Options ({roomData.length})
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => setShowAmenitiesModal(true)}>
                      Amenities ({amenitiesData.length})
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => setShowPoliciesModal(true)}>
                      Policies ({policiesData.length})
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => setShowLocationModal(true)}>
                      Location ({locationData.length})
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => setShowSimilarPropertiesModal(true)}>
                      Similar Properties ({similarPropsData.length})
                    </button>
                    <button className="btn btn-outline-primary" onClick={() => setShowDiningModal(true)}>
                      Dining {Object.keys(diningData).length > 0 ? "(1)" : "(0)"}
                    </button>
                  </div>

                  <div className="text-end">
                    <button className="btn btn-success me-2" onClick={editHotel ? handleUpdateHotel : handleSaveHotel}>
                      {editHotel ? "Update" : "Save"}
                    </button>
                    <button className="btn btn-secondary" onClick={handleCloseAddHotelModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showImageModal && (
          <div className="modal show d-block bg-dark bg-opacity-75">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Hotel Images</h5>
                  <button className="btn-close" onClick={() => setShowImageModal(false)}></button>
                </div>
                <div className="modal-body text-center">
                  <div className="mb-3">
                    <img
                      src={((editHotel ? editHotel.Hotel_Pictures : newHotel.Hotel_Pictures) || [])[currentImageIndex]}
                      alt={`Hotel Image ${currentImageIndex + 1}`}
                      className="img-fluid rounded"
                      style={{ maxHeight: "400px", objectFit: "contain" }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/500x300?text=Image+Not+Found";
                      }}
                    />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <button className="btn btn-primary" onClick={handlePrevImage}>
                      Previous
                    </button>
                    <span>
                      Image {currentImageIndex + 1} of{" "}
                      {((editHotel ? editHotel.Hotel_Pictures : newHotel.Hotel_Pictures) || []).length}
                    </span>
                    <button className="btn btn-primary" onClick={handleNextImage}>
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {showSimilarPropertiesModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Similar Properties</h5>
                  <button className="btn-close" onClick={() => setShowSimilarPropertiesModal(false)}></button>
                </div>
                <div className="modal-body">
                  {similarPropsData.map((sp, idx) => (
                    <div key={idx} className="mb-2 border p-2 rounded">
                      <input
                        className="form-control mb-1"
                        placeholder="Similar Hotel Name"
                        value={sp.SimilarHotel_Name || ""}
                        onChange={(e) => {
                          const newSP = [...similarPropsData];
                          newSP[idx].SimilarHotel_Name = e.target.value;
                          setSimilarPropsData(newSP);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Location"
                        value={sp.Location || ""}
                        onChange={(e) => {
                          const newSP = [...similarPropsData];
                          newSP[idx].Location = e.target.value;
                          setSimilarPropsData(newSP);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Reviews"
                        value={sp.Reviews || ""}
                        onChange={(e) => {
                          const newSP = [...similarPropsData];
                          newSP[idx].Reviews = e.target.value;
                          setSimilarPropsData(newSP);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        type="number"
                        step="0.1"
                        placeholder="Rating"
                        value={sp.Rating || ""}
                        onChange={(e) => {
                          const newSP = [...similarPropsData];
                          newSP[idx].Rating = parseFloat(e.target.value) || 0;
                          setSimilarPropsData(newSP);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        type="number"
                        step="0.01"
                        placeholder="Price Per Night"
                        value={sp.Price_Per_Night || ""}
                        onChange={(e) => {
                          const newSP = [...similarPropsData];
                          newSP[idx].Price_Per_Night = parseFloat(e.target.value) || 0;
                          setSimilarPropsData(newSP);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Image URL"
                        value={sp.ImageUrl || ""}
                        onChange={(e) => {
                          const newSP = [...similarPropsData];
                          newSP[idx].ImageUrl = e.target.value;
                          setSimilarPropsData(newSP);
                        }}
                      />
                      <button className="btn btn-sm btn-danger" onClick={() => handleRemoveSimilarProperty(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-sm btn-outline-primary" onClick={handleAddSimilarProperty}>
                    + Add Property
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRoomOptionsModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Room Options</h5>
                  <button className="btn-close" onClick={() => setShowRoomOptionsModal(false)}></button>
                </div>
                <div className="modal-body">
                  {roomData.map((room, idx) => (
                    <div key={idx} className="mb-3 border p-3 rounded">
                      <div className="row">
                        <div className="col-md-6">
                          <input
                            className="form-control mb-2"
                            placeholder="Room Image URL"
                            value={room.Room_Image || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Room_Image = e.target.value;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            placeholder="Room Type"
                            value={room.Room_Type || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Room_Type = e.target.value;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={room.Price || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Price = parseFloat(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            type="number"
                            placeholder="Reviews Count"
                            value={room.Reviews_Count || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Reviews_Count = parseInt(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                          <textarea
                            className="form-control mb-2"
                            placeholder="Reviews Description"
                            value={room.Reviews_Description || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Reviews_Description = e.target.value;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            placeholder="Reviewer Name"
                            value={room.Reviewer_Name || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Reviewer_Name = e.target.value;
                              setRoomData(newRooms);
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            className="form-control mb-2"
                            type="date"
                            placeholder="Review Date"
                            value={room.Review_Date || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Review_Date = e.target.value;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            placeholder="Rating (0-5)"
                            value={room.Rating || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Rating = parseFloat(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            type="number"
                            placeholder="Select Room Count"
                            value={room.Selectroom_count || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Selectroom_count = parseInt(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            type="number"
                            placeholder="Available Rooms"
                            value={room.Available_Rooms || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Available_Rooms = parseInt(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            type="number"
                            placeholder="Maximum Guest Count"
                            value={room.MaximumGuest_Count || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].MaximumGuest_Count = parseInt(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                          <input
                            className="form-control mb-2"
                            type="number"
                            placeholder="Square Feet"
                            value={room.Sqft || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Sqft = parseInt(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <input
                            className="form-control mb-2"
                            type="number"
                            placeholder="Bed Count"
                            value={room.Bed_Count || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Bed_Count = parseInt(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            className="form-control mb-2"
                            type="number"
                            placeholder="Bathroom Count"
                            value={room.Bathroom_Count || ""}
                            onChange={(e) => {
                              const newRooms = [...roomData];
                              newRooms[idx].Bathroom_Count = parseInt(e.target.value) || 0;
                              setRoomData(newRooms);
                            }}
                          />
                        </div>
                      </div>
                      <textarea
                        className="form-control mb-2"
                        placeholder="Room Facility Description"
                        value={room.Room_Facility_Description || ""}
                        onChange={(e) => {
                          const newRooms = [...roomData];
                          newRooms[idx].Room_Facility_Description = e.target.value;
                          setRoomData(newRooms);
                        }}
                      />
                      <button className="btn btn-sm btn-danger" onClick={() => handleRemoveRoom(idx)}>
                        Remove Room
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() =>
                      setRoomData([
                        ...roomData,
                        {
                          Room_Image: "",
                          Room_Type: "",
                          Price: 0,
                          Reviews_Count: 0,
                          Reviews_Description: "",
                          Reviewer_Name: "",
                          Review_Date: "",
                          Rating: 0,
                          Selectroom_count: 0,
                          Available_Rooms: 0,
                          MaximumGuest_Count: 0,
                          Sqft: 0,
                          Bed_Count: 0,
                          Bathroom_Count: 0,
                          Room_Facility_Description: "",
                        },
                      ])
                    }
                  >
                    + Add Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAmenitiesModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Amenities</h5>
                  <button className="btn-close" onClick={() => setShowAmenitiesModal(false)}></button>
                </div>
                <div className="modal-body">
                  {amenitiesData.map((a, idx) => (
                    <div key={idx} className="mb-2 border p-2 rounded">
                      <input
                        className="form-control mb-1"
                        placeholder="Amenity Name"
                        value={a.Amenity_Name || ""}
                        onChange={(e) => {
                          const newAmenities = [...amenitiesData];
                          newAmenities[idx].Amenity_Name = e.target.value;
                          setAmenitiesData(newAmenities);
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Amenities Description"
                        value={a.Amenities_Description || ""}
                        onChange={(e) => {
                          const newAmenities = [...amenitiesData];
                          newAmenities[idx].Amenities_Description = e.target.value;
                          setAmenitiesData(newAmenities);
                        }}
                      />
                      <button className="btn btn-sm btn-danger" onClick={() => handleRemoveAmenity(idx)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setAmenitiesData([...amenitiesData, {}])}
                  >
                    + Add Amenity
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPoliciesModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Policies</h5>
                  <button className="btn-close" onClick={() => setShowPoliciesModal(false)}></button>
                </div>
                <div className="modal-body">
                  {policiesData.length > 0 ? (
                    policiesData.map((p, idx) => (
                      <div key={idx} className="mb-2 border p-2 rounded">
                        <input
                          className="form-control mb-1"
                          placeholder="Check-In Time"
                          value={p.CheckInTime || ""}
                          onChange={(e) => {
                            const newPolicies = [...policiesData];
                            newPolicies[idx].CheckInTime = e.target.value;
                            setPoliciesData(newPolicies);
                          }}
                        />
                        <input
                          className="form-control mb-1"
                          placeholder="Check-Out Time"
                          value={p.CheckOutTime || ""}
                          onChange={(e) => {
                            const newPolicies = [...policiesData];
                            newPolicies[idx].CheckOutTime = e.target.value;
                            setPoliciesData(newPolicies);
                          }}
                        />
                        <textarea
                          className="form-control mb-1"
                          placeholder="Guest Policy"
                          value={p.GuestPolicy || ""}
                          onChange={(e) => {
                            const newPolicies = [...policiesData];
                            newPolicies[idx].GuestPolicy = e.target.value;
                            setPoliciesData(newPolicies);
                          }}
                        />
                        <textarea
                          className="form-control mb-1"
                          placeholder="Cancellation Policy"
                          value={p.CancellationPolicy || ""}
                          onChange={(e) => {
                            const newPolicies = [...policiesData];
                            newPolicies[idx].CancellationPolicy = e.target.value;
                            setPoliciesData(newPolicies);
                          }}
                        />
                        <textarea
                          className="form-control mb-1"
                          placeholder="ID Proof Policy"
                          value={p.IdProofPolicy || ""}
                          onChange={(e) => {
                            const newPolicies = [...policiesData];
                            newPolicies[idx].IdProofPolicy = e.target.value;
                            setPoliciesData(newPolicies);
                          }}
                        />
                        <textarea
                          className="form-control mb-1"
                          placeholder="Additional Notes"
                          value={p.AdditionalNotes || ""}
                          onChange={(e) => {
                            const newPolicies = [...policiesData];
                            newPolicies[idx].AdditionalNotes = e.target.value;
                            setPoliciesData(newPolicies);
                          }}
                        />
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemovePolicy(idx)}>
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="mb-2 border p-2 rounded">
                      <input
                        className="form-control mb-1"
                        placeholder="Check-In Time"
                        value=""
                        onChange={(e) => {
                          setPoliciesData([{ CheckInTime: e.target.value }]);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Check-Out Time"
                        value=""
                        onChange={(e) => {
                          setPoliciesData([{ ...policiesData[0], CheckOutTime: e.target.value }]);
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Guest Policy"
                        value=""
                        onChange={(e) => {
                          setPoliciesData([{ ...policiesData[0], GuestPolicy: e.target.value }]);
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Cancellation Policy"
                        value=""
                        onChange={(e) => {
                          setPoliciesData([{ ...policiesData[0], CancellationPolicy: e.target.value }]);
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="ID Proof Policy"
                        value=""
                        onChange={(e) => {
                          setPoliciesData([{ ...policiesData[0], IdProofPolicy: e.target.value }]);
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Additional Notes"
                        value=""
                        onChange={(e) => {
                          setPoliciesData([{ ...policiesData[0], AdditionalNotes: e.target.value }]);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showLocationModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Location Details</h5>
                  <button className="btn-close" onClick={() => setShowLocationModal(false)}></button>
                </div>
                <div className="modal-body">
                  {locationData.length > 0 ? (
                    locationData.map((loc, idx) => (
                      <div key={idx} className="mb-2 border p-2 rounded">
                        <input
                          className="form-control mb-1"
                          placeholder="Address"
                          value={loc.Address || ""}
                          onChange={(e) => {
                            const newLocations = [...locationData];
                            newLocations[idx].Address = e.target.value;
                            setLocationData(newLocations);
                          }}
                        />
                        <input
                          className="form-control mb-1"
                          placeholder="Nearby Landmarks"
                          value={loc.NearbyLandmarks || ""}
                          onChange={(e) => {
                            const newLocations = [...locationData];
                            newLocations[idx].NearbyLandmarks = e.target.value;
                            setLocationData(newLocations);
                          }}
                        />
                        <input
                          className="form-control mb-1"
                          placeholder="Map URL"
                          value={loc.MapUrl || ""}
                          onChange={(e) => {
                            const newLocations = [...locationData];
                            newLocations[idx].MapUrl = e.target.value;
                            setLocationData(newLocations);
                          }}
                        />
                        <input
                          className="form-control mb-1"
                          placeholder="Embed URL"
                          value={loc.EmbedUrl || ""}
                          onChange={(e) => {
                            const newLocations = [...locationData];
                            newLocations[idx].EmbedUrl = e.target.value;
                            setLocationData(newLocations);
                          }}
                        />
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoveLocation(idx)}>
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="mb-2 border p-2 rounded">
                      <input
                        className="form-control mb-1"
                        placeholder="Address"
                        value=""
                        onChange={(e) => {
                          setLocationData([{ Address: e.target.value }]);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Nearby Landmarks"
                        value=""
                        onChange={(e) => {
                          setLocationData([{ ...locationData[0], NearbyLandmarks: e.target.value }]);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Map URL"
                        value=""
                        onChange={(e) => {
                          setLocationData([{ ...locationData[0], MapUrl: e.target.value }]);
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Embed URL"
                        value=""
                        onChange={(e) => {
                          setLocationData([{ ...locationData[0], EmbedUrl: e.target.value }]);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showDiningModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Dining Information</h5>
                  <button className="btn-close" onClick={() => setShowDiningModal(false)}></button>
                </div>
                <div className="modal-body">
                  {Object.keys(diningData).length > 0 ? (
                    <div className="mb-2 border p-2 rounded">
                      <input
                        className="form-control mb-1"
                        placeholder="Dining Experience"
                        value={diningData.DiningExperience || ""}
                        onChange={(e) => {
                          setDiningData({ ...diningData, DiningExperience: e.target.value });
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Meal Options (optional)"
                        value={diningData.MealOptions || ""}
                        onChange={(e) => {
                          setDiningData({ ...diningData, MealOptions: e.target.value });
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Restaurant Hours"
                        value={diningData.RestaurantHours || ""}
                        onChange={(e) => {
                          setDiningData({ ...diningData, RestaurantHours: e.target.value });
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Restaurant Description"
                        value={diningData.RestaurantDescription || ""}
                        onChange={(e) => {
                          setDiningData({ ...diningData, RestaurantDescription: e.target.value });
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Special Features (optional)"
                        value={diningData.SpecialFeatures || ""}
                        onChange={(e) => {
                          setDiningData({ ...diningData, SpecialFeatures: e.target.value });
                        }}
                      />
                      <button className="btn btn-sm btn-danger" onClick={handleRemoveDining}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="mb-2 border p-2 rounded">
                      <input
                        className="form-control mb-1"
                        placeholder="Dining Experience"
                        value=""
                        onChange={(e) => {
                          setDiningData({ DiningExperience: e.target.value });
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Meal Options (optional)"
                        value=""
                        onChange={(e) => {
                          setDiningData({ ...diningData, MealOptions: e.target.value });
                        }}
                      />
                      <input
                        className="form-control mb-1"
                        placeholder="Restaurant Hours"
                        value=""
                        onChange={(e) => {
                          setDiningData({ ...diningData, RestaurantHours: e.target.value });
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Restaurant Description"
                        value=""
                        onChange={(e) => {
                          setDiningData({ ...diningData, RestaurantDescription: e.target.value });
                        }}
                      />
                      <textarea
                        className="form-control mb-1"
                        placeholder="Special Features (optional)"
                        value=""
                        onChange={(e) => {
                          setDiningData({ ...diningData, SpecialFeatures: e.target.value });
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showSearchModal && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editSearch ? "Update Hotel Search" : "Add Hotel Search"}</h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setShowSearchModal(false);
                      setEditSearch(null);
                      setSearchDto({
                        Location: "",
                        Checkin: "",
                        Checkout: "",
                        Guest_Type: "",
                        Guest_Count: 1,
                        Room_Count: 1,
                      });
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Location"
                    value={searchDto.Location}
                    onChange={(e) => setSearchDto({ ...searchDto, Location: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    placeholder="Check-In Date & Time"
                    value={searchDto.Checkin}
                    onChange={(e) => setSearchDto({ ...searchDto, Checkin: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    placeholder="Check-Out Date & Time"
                    value={searchDto.Checkout}
                    onChange={(e) => setSearchDto({ ...searchDto, Checkout: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Guest Type"
                    value={searchDto.Guest_Type}
                    onChange={(e) => setSearchDto({ ...searchDto, Guest_Type: e.target.value })}
                  />
                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Guest Count"
                    value={searchDto.Guest_Count}
                    onChange={(e) => setSearchDto({ ...searchDto, Guest_Count: parseInt(e.target.value) })}
                  />
                  <input
                    type="number"
                    className="form-control mb-2"
                    placeholder="Room Count"
                    value={searchDto.Room_Count}
                    onChange={(e) => setSearchDto({ ...searchDto, Room_Count: parseInt(e.target.value) })}
                  />

                  <div className="text-end">
                    <button className="btn btn-success me-2" onClick={editSearch ? handleUpdateSearch : handleAddSearch}>
                      {editSearch ? "Update" : "Save"}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowSearchModal(false);
                        setEditSearch(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDetailsModal && selectedHotelDetails && (
          <div className="modal show d-block bg-dark bg-opacity-50">
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header d-flex justify-content-between align-items-center">
                  <h5 className="modal-title m-0">Hotel Details: {selectedHotelDetails?.Hotel_Name || "Unknown Hotel"}</h5>
                  <button
                    className="btn-close"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedHotelDetails(null);
                    }}
                  ></button>
                </div>

                <div className="modal-body">
                  {isLoadingDetails ? (
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading hotel details...</p>
                    </div>
                  ) : (
                    <div className="row">
                      {selectedHotelDetails.Hotel_Pictures && selectedHotelDetails.Hotel_Pictures.length > 0 && (
                        <div className="col-12 mb-4">
                          <h6 className="fw-bold text-primary">
                            Hotel Images ({selectedHotelDetails.Hotel_Pictures.length})
                          </h6>
                          <div className="d-flex flex-wrap gap-2">
                            {selectedHotelDetails.Hotel_Pictures.map((image, index) => (
                              <div key={index} className="position-relative">
                                <img
                                  src={image}
                                  alt={`Hotel ${index + 1}`}
                                  className="img-thumbnail"
                                  style={{
                                    width: "150px",
                                    height: "150px",
                                    objectFit: "cover",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => {
                                    setCurrentImageIndex(index);
                                    setShowImageModal(true);
                                  }}
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/150x150?text=Image+Error";
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <small className="text-muted mt-1 d-block">Click on any image to view larger version</small>
                        </div>
                      )}

                      <div className="col-12 mb-4">
                        <h6 className="fw-bold text-primary">Basic Information</h6>
                        <div className="row">
                          <div className="col-md-6">
                            <p>
                              <strong>Hotel ID:</strong> {selectedHotelDetails.HotelId}
                            </p>
                            <p>
                              <strong>Location:</strong> {selectedHotelDetails.Nearest_Location}
                            </p>
                            <p>
                              <strong>City:</strong> {selectedHotelDetails.City}
                            </p>
                            <p>
                              <strong>Price:</strong> ${selectedHotelDetails.Price}
                            </p>
                          </div>
                          <div className="col-md-6">
                            <p>
                              <strong>Rating:</strong> {selectedHotelDetails.Rating}
                            </p>
                            <p>
                              <strong>Free Cancellation:</strong> {selectedHotelDetails.FreeCancellation ? "Yes" : "No"}
                            </p>
                            <p>
                              <strong>Breakfast Included:</strong> {selectedHotelDetails.BreakfastIncluded ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>
                        <p>
                          <strong>Description:</strong> {selectedHotelDetails.Hotel_Description}
                        </p>
                      </div>

                      {selectedHotelDetails.rooms?.filter((room) => room.HotelId === selectedHotelDetails.HotelId).length >
                        0 && (
                        <div className="col-12 mb-4">
                          <h6 className="fw-bold text-success">
                            Room Options (
                            {
                              selectedHotelDetails.rooms.filter((room) => room.HotelId === selectedHotelDetails.HotelId)
                                .length
                            }
                            )
                          </h6>
                          <div className="row">
                            {selectedHotelDetails.rooms
                              .filter((room) => room.HotelId === selectedHotelDetails.HotelId)
                              .map((room, idx) => (
                                <div key={room.RoomId || idx} className="col-md-6 mb-3">
                                  <div className="card">
                                    {room.Room_Image && (
                                      <img
                                        src={room.Room_Image}
                                        alt={room.Room_Type}
                                        className="card-img-top"
                                        style={{ height: "200px", objectFit: "cover" }}
                                        onError={(e) => {
                                          e.target.src = "https://via.placeholder.com/300x200?text=Room+Image";
                                        }}
                                      />
                                    )}
                                    <div className="card-body">
                                      <h6 className="card-title">{room.Room_Type}</h6>
                                      <p className="card-text">
                                        <strong>Price:</strong> ${room.Price}
                                        <br />
                                        <strong>Rating:</strong> {room.Rating} ⭐ ({room.Reviews_Count} reviews)
                                        <br />
                                        <strong>Guests:</strong> {room.MaximumGuest_Count} | <strong>Beds:</strong>{" "}
                                        {room.Bed_Count}
                                        <br />
                                        <strong>Bathrooms:</strong> {room.Bathroom_Count} | <strong>Size:</strong>{" "}
                                        {room.Sqft} sqft
                                        <br />
                                        <strong>Available:</strong> {room.Available_Rooms} rooms
                                      </p>
                                      {room.Reviews_Description && (
                                        <p className="card-text">
                                          <small className="text-muted">
                                            "{room.Reviews_Description}" - {room.Reviewer_Name}
                                          </small>
                                        </p>
                                      )}
                                      {room.Room_Facility_Description && (
                                        <p className="card-text">
                                          <small>
                                            <strong>Facilities:</strong> {room.Room_Facility_Description}
                                          </small>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {selectedHotelDetails.amenities?.filter((amenity) => amenity.HotelId === selectedHotelDetails.HotelId)
                        .length > 0 && (
                        <div className="col-md-6 mb-4">
                          <h6 className="fw-bold text-info">
                            Amenities (
                            {
                              selectedHotelDetails.amenities.filter(
                                (amenity) => amenity.HotelId === selectedHotelDetails.HotelId
                              ).length
                            }
                            )
                          </h6>
                          {selectedHotelDetails.amenities
                            .filter((amenity) => amenity.HotelId === selectedHotelDetails.HotelId)
                            .map((amenity, idx) => (
                              <div key={amenity.AmenityId || idx} className="mb-2">
                                <p className="mb-1">
                                  <strong>{amenity.Amenity_Name}</strong>
                                </p>
                                {amenity.Amenities_Description && (
                                  <small className="text-muted">{amenity.Amenities_Description}</small>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {selectedHotelDetails.policies?.filter((policy) => policy.HotelId === selectedHotelDetails.HotelId)
                        .length > 0 && (
                        <div className="col-md-6 mb-4">
                          <h6 className="fw-bold text-warning">
                            Policies (
                            {
                              selectedHotelDetails.policies.filter(
                                (policy) => policy.HotelId === selectedHotelDetails.HotelId
                              ).length
                            }
                            )
                          </h6>
                          {selectedHotelDetails.policies
                            .filter((policy) => policy.HotelId === selectedHotelDetails.HotelId)
                            .map((policy, idx) => (
                              <div key={policy.PolicyId || idx} className="mb-2">
                                <p className="mb-1">
                                  <strong>Check-in:</strong> {policy.CheckInTime} | <strong>Check-out:</strong>{" "}
                                  {policy.CheckOutTime}
                                </p>
                                {policy.GuestPolicy && (
                                  <small className="text-muted d-block">
                                    <strong>Guest Policy:</strong> {policy.GuestPolicy}
                                  </small>
                                )}
                                {policy.CancellationPolicy && (
                                  <small className="text-muted d-block">
                                    <strong>Cancellation:</strong> {policy.CancellationPolicy}
                                  </small>
                                )}
                                {policy.IdProofPolicy && (
                                  <small className="text-muted d-block">
                                    <strong>ID Proof:</strong> {policy.IdProofPolicy}
                                  </small>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {selectedHotelDetails.locations?.filter(
                        (location) => location.HotelId === selectedHotelDetails.HotelId
                      ).length > 0 && (
                        <div className="col-md-6 mb-4">
                          <h6 className="fw-bold text-primary">
                            Location Details (
                            {
                              selectedHotelDetails.locations.filter(
                                (location) => location.HotelId === selectedHotelDetails.HotelId
                              ).length
                            }
                            )
                          </h6>
                          {selectedHotelDetails.locations
                            .filter((location) => location.HotelId === selectedHotelDetails.HotelId)
                            .map((location, idx) => (
                              <div key={location.LocationId || idx} className="mb-2">
                                <p className="mb-1">
                                  <strong>Address:</strong> {location.Address}
                                </p>
                                {location.NearbyLandmarks && (
                                  <small className="text-muted">
                                    <strong>Landmarks:</strong> {location.NearbyLandmarks}
                                  </small>
                                )}
                                {location.MapUrl && (
                                  <small className="text-muted d-block">
                                    <strong>Map URL:</strong> {location.MapUrl}
                                  </small>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {selectedHotelDetails.dining &&
                        (() => {
                          const hotelDining = (
                            Array.isArray(selectedHotelDetails.dining)
                              ? selectedHotelDetails.dining
                              : [selectedHotelDetails.dining]
                          ).filter(
                            (dine) =>
                              dine &&
                              dine.HotelId &&
                              dine.HotelId === selectedHotelDetails.HotelId &&
                              Object.keys(dine).length > 1
                          );

                          return hotelDining.length > 0 ? (
                            <div className="col-md-12 mb-4">
                              <h6 className="fw-bold text-secondary">Dining Information ({hotelDining.length})</h6>
                              {hotelDining.map((dine, idx) => (
                                <div key={dine.DiningId || idx} className="mb-3 p-2 border rounded">
                                  {dine.DiningExperience && (
                                    <p className="mb-1">
                                      <strong>Experience:</strong> {dine.DiningExperience}
                                    </p>
                                  )}
                                  {dine.MealOptions && (
                                    <p className="mb-1">
                                      <strong>Meal Options:</strong> {dine.MealOptions}
                                    </p>
                                  )}
                                  {dine.RestaurantHours && (
                                    <p className="mb-1">
                                      <strong>Hours:</strong> {dine.RestaurantHours}
                                    </p>
                                  )}
                                  {dine.RestaurantDescription && (
                                    <p className="mb-1">
                                      <strong>Description:</strong> {dine.RestaurantDescription}
                                    </p>
                                  )}
                                  {dine.SpecialFeatures && (
                                    <small className="text-muted">
                                      <strong>Special Features:</strong> {dine.SpecialFeatures}
                                    </small>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                      {selectedHotelDetails.similarProperties?.filter(
                        (prop) => prop.HotelId === selectedHotelDetails.HotelId
                      ).length > 0 && (
                        <div className="col-12 mb-4">
                          <h6 className="fw-bold text-dark">
                            Similar Properties (
                            {
                              selectedHotelDetails.similarProperties.filter(
                                (prop) => prop.HotelId === selectedHotelDetails.HotelId
                              ).length
                            }
                            )
                          </h6>
                          <div className="row">
                            {selectedHotelDetails.similarProperties
                              .filter((prop) => prop.HotelId === selectedHotelDetails.HotelId)
                              .map((prop, idx) => (
                                <div key={prop.SimilarId || idx} className="col-md-6 mb-2">
                                  <div className="card card-body">
                                    <p className="mb-1">
                                      <strong>{prop.SimilarHotel_Name}</strong>
                                    </p>
                                    <small>
                                      Location: {prop.Location} | Rating: {prop.Rating} | ${prop.Price_Per_Night}/night
                                    </small>
                                    {prop.Reviews && <small className="text-muted mt-1">Reviews: {prop.Reviews}</small>}
                                    {prop.ImageUrl && (
                                      <img
                                        src={prop.ImageUrl}
                                        alt={prop.SimilarHotel_Name}
                                        className="img-thumbnail mt-2"
                                        style={{ width: "100%", height: "100px", objectFit: "cover" }}
                                        onError={(e) => {
                                          e.target.src = "https://via.placeholder.com/150x100?text=Image+Error";
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showImageModal && selectedHotelDetails && selectedHotelDetails.Hotel_Pictures && (
          <div className="modal show d-block bg-dark bg-opacity-75">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Hotel Images - {selectedHotelDetails.Hotel_Name}</h5>
                  <button className="btn-close" onClick={() => setShowImageModal(false)}></button>
                </div>
                <div className="modal-body text-center">
                  <div className="mb-3">
                    <img
                      src={selectedHotelDetails.Hotel_Pictures[currentImageIndex]}
                      alt={`Hotel Image ${currentImageIndex + 1}`}
                      className="img-fluid rounded"
                      style={{ maxHeight: "400px", objectFit: "contain" }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/500x300?text=Image+Not+Found";
                      }}
                    />
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        setCurrentImageIndex(
                          (prev) =>
                            (prev - 1 + selectedHotelDetails.Hotel_Pictures.length) %
                            selectedHotelDetails.Hotel_Pictures.length
                        )
                      }
                    >
                      Previous
                    </button>
                    <span>
                      Image {currentImageIndex + 1} of {selectedHotelDetails.Hotel_Pictures.length}
                    </span>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev + 1) % selectedHotelDetails.Hotel_Pictures.length)
                      }
                    >
                      Next
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="d-flex flex-wrap justify-content-center gap-2">
                      {selectedHotelDetails.Hotel_Pictures.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className={`img-thumbnail ${currentImageIndex === index ? "border border-primary" : ""}`}
                          style={{ width: "60px", height: "60px", objectFit: "cover", cursor: "pointer" }}
                          onClick={() => setCurrentImageIndex(index)}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/60x60?text=Error";
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotel;
