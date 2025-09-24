const express = require("express");
const router = new express.Router();
const controllers = require("../Controllers/usersControllers");
const upload = require("../multerconfig/storageConfig");

// ========== BASIC CRUD ROUTES ==========
router.post("/user/register", upload.single("user_profile"), controllers.userpost);
router.get("/user/details", controllers.userget);
router.get("/user/:id", controllers.singleuserget);
router.put("/user/edit/:id", upload.single("user_profile"), controllers.useredit);
router.delete("/user/delete/:id", controllers.userdelete);
router.put("/user/status/:id", controllers.userstatus);

// ========== ADDRESS MANAGEMENT ROUTES ==========
router.post("/user/:id/address", controllers.addAddress);
router.put("/user/:id/address/:addressId", controllers.updateAddress);
router.delete("/user/:id/address/:addressId", controllers.deleteAddress);
router.put("/user/:id/address/:addressId/default", controllers.setDefaultAddress);

// ========== SEARCH AND FILTER ROUTES ==========
router.get("/user/search/location", controllers.searchByLocation);
router.get("/user/multiple-addresses", controllers.getMultipleAddressCustomers);
router.get("/user/single-addresses", controllers.getSingleAddressCustomers);
router.get("/user/clear-filters", controllers.clearFilters);

module.exports = router;