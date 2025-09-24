const users = require("../models/usersSchema");
const moment = require("moment");
const fs = require("fs");
const { promisify } = require("util");
const BASE_URL = process.env.BASE_URL;
const { logger, AppError } = require("../middleware/errorHandler");

// Error handling utility
const handleError = (res, error, message = "An error occurred", operation = "Unknown") => {
    // Enhanced error logging
    logger.error(`CRUD Operation Error: ${operation}`, {
        message: error.message,
        stack: error.stack,
        operation: operation,
        errorType: error.name || 'Unknown',
        timestamp: new Date().toISOString()
    });
    
    console.error(`Error: ${message}`, error);
    res.status(500).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
};

// Success response utility
const sendSuccess = (res, data, message = "Operation successful", operation = "Unknown") => {
    // Log successful operations
    logger.info(`CRUD Operation Success: ${operation}`, {
        message: message,
        operation: operation,
        timestamp: new Date().toISOString(),
        dataCount: Array.isArray(data) ? data.length : (data ? 1 : 0)
    });
    
    res.status(200).json({
        success: true,
        message: message,
        data: data
    });
};

// register user with enhanced validation
const userpost = async (req, res) => {
    try {
        const file = req.file?.filename;
        const { 
            fname, lname, email, mobile, gender, location, status, 
            dateOfBirth, addresses 
        } = req.body;

        // Enhanced validation
        if (!fname || !lname || !email || !mobile || !gender || !status || !file) {
            return res.status(400).json({
                success: false,
                message: "Required fields: First name, Last name, Email, Mobile, Gender, Status, and Profile picture are required"
            });
        }

        // Check for existing user by email or mobile
        const existingUser = await users.findOne({
            $or: [{ email: email.toLowerCase() }, { mobile: mobile }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email.toLowerCase() 
                    ? "User with this email already exists" 
                    : "User with this mobile number already exists"
            });
        }

        // Parse addresses if provided
        let parsedAddresses = [];
        if (addresses) {
            try {
                parsedAddresses = typeof addresses === 'string' ? JSON.parse(addresses) : addresses;
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid address format"
                });
            }
        }

        // Create user data
        const userData = new users({
            fname: fname.trim(),
            lname: lname.trim(),
            email: email.toLowerCase().trim(),
            mobile: mobile.trim(),
            gender,
            status,
            profile: file,
            location: location?.trim() || '',
            dateOfBirth: dateOfBirth || null,
            addresses: parsedAddresses,
            createdBy: req.user?.id || 'system'
        });

        await userData.save();
        
        sendSuccess(res, userData, "Customer created successfully", "CREATE_CUSTOMER");
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }
        handleError(res, error, "Failed to create customer", "CREATE_CUSTOMER");
    }
};


// Enhanced users get with advanced search and filtering
const userget = async (req, res) => {
    try {
        const {
            search = "",
            gender = "",
            status = "",
            sort = "new",
            page = 1,
            limit = 10,
            city = "",
            state = "",
            pincode = "",
            addressType = "",
            isSingleAddress = "",
            sortBy = "datecreated",
            sortOrder = "desc"
        } = req.query;

        const ITEM_PER_PAGE = parseInt(limit);
        const currentPage = parseInt(page);

        // Build query object
        const query = {};

        // Text search across multiple fields
        if (search) {
            query.$or = [
                { fname: { $regex: search, $options: "i" } },
                { lname: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { mobile: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by gender
        if (gender && gender !== "All") {
            query.gender = gender;
        }

        // Filter by status
        if (status && status !== "All") {
            query.status = status;
        }

        // Filter by address location
        if (city || state || pincode) {
            query['addresses'] = { $exists: true, $ne: [] };
            if (city) {
                query['addresses.city'] = { $regex: city, $options: "i" };
            }
            if (state) {
                query['addresses.state'] = { $regex: state, $options: "i" };
            }
            if (pincode) {
                query['addresses.pincode'] = pincode;
            }
        }

        // Filter by address type
        if (addressType && addressType !== "All") {
            query['addresses.addressType'] = addressType;
        }

        // Filter by single/multiple address
        if (isSingleAddress !== "") {
            if (isSingleAddress === "true") {
                query.$expr = { $eq: [{ $size: '$addresses' }, 1] };
            } else if (isSingleAddress === "false") {
                query.$expr = { $gt: [{ $size: '$addresses' }, 1] };
            }
        }

        // Calculate pagination
        const skip = (currentPage - 1) * ITEM_PER_PAGE;
        const count = await users.countDocuments(query);

        // Build sort object
        const sortObj = {};
        if (sortBy === "name") {
            sortObj.fname = sortOrder === "desc" ? -1 : 1;
        } else if (sortBy === "email") {
            sortObj.email = sortOrder === "desc" ? -1 : 1;
        } else {
            sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;
        }

        // Execute query with pagination
        const usersdata = await users.find(query)
            .sort(sortObj)
            .limit(ITEM_PER_PAGE)
            .skip(skip)
            .select('-__v'); // Exclude version field

        const pageCount = Math.ceil(count / ITEM_PER_PAGE);

        sendSuccess(res, {
            users: usersdata,
            pagination: {
                currentPage,
                totalPages: pageCount,
                totalItems: count,
                itemsPerPage: ITEM_PER_PAGE,
                hasNextPage: currentPage < pageCount,
                hasPrevPage: currentPage > 1
            },
            filters: {
                search,
                gender,
                status,
                city,
                state,
                pincode,
                addressType,
                isSingleAddress
            }
        }, "Users retrieved successfully");

    } catch (error) {
        handleError(res, error, "Failed to retrieve users", "GET_USERS");
    }
};

// Enhanced single user get
const singleuserget = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const userdata = await users.findById(id).select('-__v');
        
        if (!userdata) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        sendSuccess(res, userdata, "User details retrieved successfully");
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        handleError(res, error, "Failed to retrieve user details", "GET_SINGLE_USER");
    }
}

// user edit with enhanced validation
const useredit = async (req, res) => {
    try {
        const { id } = req.params;
        const { fname, lname, email, mobile, gender, location, status } = req.body;
        const file = req.file ? req.file.filename : req.body.user_profile;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Check if user exists
        const existingUser = await users.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check for email/mobile conflicts with other users
        if (email || mobile) {
            const conflictUser = await users.findOne({
                _id: { $ne: id },
                $or: [
                    ...(email ? [{ email: email.toLowerCase() }] : []),
                    ...(mobile ? [{ mobile }] : [])
                ]
            });

            if (conflictUser) {
                return res.status(409).json({
                    success: false,
                    message: conflictUser.email === email?.toLowerCase() 
                        ? "Email already exists for another user" 
                        : "Mobile number already exists for another user"
                });
            }
        }

        const updateData = {
            ...(fname && { fname: fname.trim() }),
            ...(lname && { lname: lname.trim() }),
            ...(email && { email: email.toLowerCase().trim() }),
            ...(mobile && { mobile: mobile.trim() }),
            ...(gender && { gender }),
            ...(location !== undefined && { location: location?.trim() || '' }),
            ...(status && { status }),
            ...(file && { profile: file }),
            updatedBy: req.user?.id || 'system'
        };

        const updateuser = await users.findByIdAndUpdate(
            id, 
            updateData,
            { 
                new: true,
                runValidators: true
            }
        );

        sendSuccess(res, updateuser, "User updated successfully");
    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        handleError(res, error, "Failed to update user", "UPDATE_USER");
    }
}

// delete user with enhanced validation
const userdelete = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const deletuser = await users.findByIdAndDelete(id);
        
        if (!deletuser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        sendSuccess(res, deletuser, "User deleted successfully");
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        handleError(res, error, "Failed to delete user", "DELETE_USER");
    }
}

// change status with enhanced validation
const userstatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        if (!data || !['Active', 'InActive'].includes(data)) {
            return res.status(400).json({
                success: false,
                message: "Valid status (Active/InActive) is required"
            });
        }

        const userstatusupdate = await users.findByIdAndUpdate(
            id, 
            { 
                status: data,
                updatedBy: req.user?.id || 'system'
            }, 
            { 
                new: true,
                runValidators: true
            }
        );

        if (!userstatusupdate) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        sendSuccess(res, userstatusupdate, `User status updated to ${data}`);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }
        handleError(res, error, "Failed to update user status", "UPDATE_USER_STATUS");
    }
}


// ========== ADDRESS MANAGEMENT ENDPOINTS ==========

// Add address to user
const addAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const addressData = req.body;

        const user = await users.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await user.addAddress(addressData);
        
        sendSuccess(res, user, "Address added successfully");
    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Address validation failed",
                errors: validationErrors
            });
        }
        handleError(res, error, "Failed to add address", "ADD_ADDRESS");
    }
};

// Update address
const updateAddress = async (req, res) => {
    try {
        const { id, addressId } = req.params;
        const addressData = req.body;

        const user = await users.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await user.updateAddress(addressId, addressData);
        
        sendSuccess(res, user, "Address updated successfully");
    } catch (error) {
        if (error.message === 'Address not found') {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }
        handleError(res, error, "Failed to update address", "UPDATE_ADDRESS");
    }
};

// Delete address
const deleteAddress = async (req, res) => {
    try {
        const { id, addressId } = req.params;

        const user = await users.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await user.deleteAddress(addressId);
        
        sendSuccess(res, user, "Address deleted successfully");
    } catch (error) {
        handleError(res, error, "Failed to delete address", "DELETE_ADDRESS");
    }
};

// Set default address
const setDefaultAddress = async (req, res) => {
    try {
        const { id, addressId } = req.params;

        const user = await users.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await user.setDefaultAddress(addressId);
        
        sendSuccess(res, user, "Default address updated successfully");
    } catch (error) {
        handleError(res, error, "Failed to set default address", "SET_DEFAULT_ADDRESS");
    }
};

// Get customers with multiple addresses
const getMultipleAddressCustomers = async (req, res) => {
    try {
        const customers = await users.getMultipleAddressCustomers();
        sendSuccess(res, customers, "Multiple address customers retrieved successfully");
    } catch (error) {
        handleError(res, error, "Failed to retrieve multiple address customers", "GET_MULTIPLE_ADDRESS_CUSTOMERS");
    }
};

// Get customers with single address
const getSingleAddressCustomers = async (req, res) => {
    try {
        const customers = await users.getSingleAddressCustomers();
        sendSuccess(res, customers, "Single address customers retrieved successfully");
    } catch (error) {
        handleError(res, error, "Failed to retrieve single address customers", "GET_SINGLE_ADDRESS_CUSTOMERS");
    }
};

// Search by location (city, state, pincode)
const searchByLocation = async (req, res) => {
    try {
        const { city, state, pincode } = req.query;
        
        if (!city && !state && !pincode) {
            return res.status(400).json({
                success: false,
                message: "At least one location parameter (city, state, pincode) is required"
            });
        }

        const customers = await users.searchByLocation({ city, state, pincode });
        sendSuccess(res, customers, "Location search completed successfully");
    } catch (error) {
        handleError(res, error, "Failed to search by location", "SEARCH_BY_LOCATION");
    }
};

// Clear all filters (returns all users)
const clearFilters = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const ITEM_PER_PAGE = parseInt(limit);
        const currentPage = parseInt(page);
        const skip = (currentPage - 1) * ITEM_PER_PAGE;

        const count = await users.countDocuments();
        const usersdata = await users.find()
            .sort({ datecreated: -1 })
            .limit(ITEM_PER_PAGE)
            .skip(skip)
            .select('-__v');

        const pageCount = Math.ceil(count / ITEM_PER_PAGE);

        sendSuccess(res, {
            users: usersdata,
            pagination: {
                currentPage,
                totalPages: pageCount,
                totalItems: count,
                itemsPerPage: ITEM_PER_PAGE,
                hasNextPage: currentPage < pageCount,
                hasPrevPage: currentPage > 1
            }
        }, "All users retrieved successfully");
    } catch (error) {
        handleError(res, error, "Failed to retrieve users", "GET_USERS");
    }
};

module.exports = {
    userpost,
    userget,
    singleuserget,
    useredit,
    userdelete,
    userstatus,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getMultipleAddressCustomers,
    getSingleAddressCustomers,
    searchByLocation,
    clearFilters
};