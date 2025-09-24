const mongoose = require("mongoose");
const validator = require("validator");

// Address sub-schema
const addressSchema = new mongoose.Schema({
    addressType: {
        type: String,
        enum: ['home', 'work', 'billing', 'shipping'],
        default: 'home'
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[1-9][0-9]{5}$/.test(v);
            },
            message: 'Pincode must be 6 digits and not start with 0'
        }
    },
    country: {
        type: String,
        default: 'India',
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const usersSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lname: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(value) {
                return validator.isEmail(value);
            },
            message: 'Please provide a valid email address'
        }
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: 'Please provide a valid 10-digit mobile number starting with 6-9'
        }
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other']
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['Active', 'InActive'],
        default: 'Active'
    },
    profile: {
        type: String,
        required: [true, 'Profile picture is required']
    },
    // Multiple addresses support
    addresses: [addressSchema],
    // Legacy location field for backward compatibility
    location: {
        type: String,
        trim: true
    },
    // Additional fields for enhanced customer management
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(value) {
                return !value || value < new Date();
            },
            message: 'Date of birth cannot be in the future'
        }
    },
    isSingleAddress: {
        type: Boolean,
        default: false
    },
    // Audit fields
    datecreated: {
        type: Date,
        default: Date.now
    },
    dateUpdated: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: String,
        default: 'system'
    },
    updatedBy: {
        type: String,
        default: 'system'
    }
});

// Indexes for better performance
usersSchema.index({ email: 1 }, { unique: true });
usersSchema.index({ mobile: 1 }, { unique: true });
usersSchema.index({ fname: 1, lname: 1 });
usersSchema.index({ status: 1 });
usersSchema.index({ datecreated: -1 });
usersSchema.index({ 'addresses.city': 1 });
usersSchema.index({ 'addresses.state': 1 });
usersSchema.index({ 'addresses.pincode': 1 });
usersSchema.index({ isSingleAddress: 1 });

// Pre-save middleware to update dateUpdated
usersSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.dateUpdated = new Date();
    }
    next();
});

// Pre-save middleware to handle single address flag
usersSchema.pre('save', function(next) {
    if (this.addresses && this.addresses.length === 1) {
        this.isSingleAddress = true;
    } else if (this.addresses && this.addresses.length > 1) {
        this.isSingleAddress = false;
    }
    next();
});

// Virtual for full name
usersSchema.virtual('fullName').get(function() {
    return `${this.fname} ${this.lname}`;
});

// Virtual for default address
usersSchema.virtual('defaultAddress').get(function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Method to add address
usersSchema.methods.addAddress = function(addressData) {
    // If this is the first address, make it default
    if (this.addresses.length === 0) {
        addressData.isDefault = true;
    }
    this.addresses.push(addressData);
    return this.save();
};

// Method to update address
usersSchema.methods.updateAddress = function(addressId, addressData) {
    const address = this.addresses.id(addressId);
    if (address) {
        Object.assign(address, addressData);
        return this.save();
    }
    throw new Error('Address not found');
};

// Method to delete address
usersSchema.methods.deleteAddress = function(addressId) {
    this.addresses.pull(addressId);
    // If we deleted the default address and there are other addresses, make the first one default
    if (this.addresses.length > 0 && !this.addresses.some(addr => addr.isDefault)) {
        this.addresses[0].isDefault = true;
    }
    return this.save();
};

// Method to set default address
usersSchema.methods.setDefaultAddress = function(addressId) {
    this.addresses.forEach(addr => {
        addr.isDefault = addr._id.toString() === addressId.toString();
    });
    return this.save();
};

// Static method to search by location
usersSchema.statics.searchByLocation = function(searchParams) {
    const { city, state, pincode } = searchParams;
    const query = {};
    
    if (city) {
        query['addresses.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
        query['addresses.state'] = { $regex: state, $options: 'i' };
    }
    if (pincode) {
        query['addresses.pincode'] = pincode;
    }
    
    return this.find(query).populate('addresses');
};

// Static method to get customers with multiple addresses
usersSchema.statics.getMultipleAddressCustomers = function() {
    return this.find({
        $expr: { $gt: [{ $size: '$addresses' }, 1] }
    });
};

// Static method to get customers with single address
usersSchema.statics.getSingleAddressCustomers = function() {
    return this.find({
        $expr: { $eq: [{ $size: '$addresses' }, 1] }
    });
};

// model
const users = new mongoose.model("users", usersSchema);

module.exports = users;