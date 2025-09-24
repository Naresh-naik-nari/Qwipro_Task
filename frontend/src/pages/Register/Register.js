import React, { useContext, useEffect, useState } from 'react'
import Card from "react-bootstrap/Card"
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Select from 'react-select';
import Spiner from "../../components/Spiner/Spiner"
import {registerfunc} from "../../services/Apis"
import { ToastContainer, toast } from "react-toastify"
import {useNavigate} from "react-router-dom"
import 'react-toastify/dist/ReactToastify.css';
import "./register.css"
import { addData } from '../../components/context/ContextProvider';

const Register = () => {

  const [inputdata, setInputData] = useState({
    fname: "",
    lname: "",
    email: "",
    mobile: "",
    gender: "",
    location: "",
    dateOfBirth: ""
  });

  const [status, setStatus] = useState("Active");
  const [image, setImage] = useState("");
  const [preview, setPreview] = useState("");
  const [showspin, setShowSpin] = useState(true);
  const [addresses, setAddresses] = useState([{
    addressType: "home",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: true
  }]);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const { useradd, setUseradd } = useContext(addData);

  // status options
  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'InActive', label: 'InActive' },
  ];

  // address type options
  const addressTypeOptions = [
    { value: 'home', label: 'Home' },
    { value: 'work', label: 'Work' },
    { value: 'billing', label: 'Billing' },
    { value: 'shipping', label: 'Shipping' },
  ];

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  };

  const validateForm = () => {
    const newErrors = {};

    // Basic field validation
    if (!inputdata.fname.trim()) {
      newErrors.fname = "First name is required";
    } else if (inputdata.fname.trim().length < 2) {
      newErrors.fname = "First name must be at least 2 characters";
    }

    if (!inputdata.lname.trim()) {
      newErrors.lname = "Last name is required";
    } else if (inputdata.lname.trim().length < 2) {
      newErrors.lname = "Last name must be at least 2 characters";
    }

    if (!inputdata.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(inputdata.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!inputdata.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!validateMobile(inputdata.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number starting with 6-9";
    }

    if (!inputdata.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!image) {
      newErrors.profile = "Profile picture is required";
    }

    // Address validation
    addresses.forEach((address, index) => {
      if (!address.addressLine1.trim()) {
        newErrors[`address_${index}_line1`] = "Address line 1 is required";
      }
      if (!address.city.trim()) {
        newErrors[`address_${index}_city`] = "City is required";
      }
      if (!address.state.trim()) {
        newErrors[`address_${index}_state`] = "State is required";
      }
      if (!address.pincode.trim()) {
        newErrors[`address_${index}_pincode`] = "Pincode is required";
      } else if (!validatePincode(address.pincode)) {
        newErrors[`address_${index}_pincode`] = "Please enter a valid 6-digit pincode";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // setInput Value
  const setInputValue = (e) => {
    const { name, value } = e.target;
    setInputData({ ...inputdata, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  }

  // status set
  const setStatusValue = (e) => {
    setStatus(e.value)
  }

  // profile set
  const setProfile = (e) => {
    setImage(e.target.files[0]);
    if (errors.profile) {
      setErrors({ ...errors, profile: "" });
    }
  }

  // Address management functions
  const addAddress = () => {
    setAddresses([...addresses, {
      addressType: "home",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false
    }]);
  };

  const removeAddress = (index) => {
    if (addresses.length > 1) {
      const newAddresses = addresses.filter((_, i) => i !== index);
      // If we removed the default address, make the first one default
      if (addresses[index].isDefault && newAddresses.length > 0) {
        newAddresses[0].isDefault = true;
      }
      setAddresses(newAddresses);
    }
  };

  const updateAddress = (index, field, value) => {
    const newAddresses = [...addresses];
    newAddresses[index][field] = value;
    setAddresses(newAddresses);
    
    // Clear error when user starts typing
    const errorKey = `address_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors({ ...errors, [errorKey]: "" });
    }
  };

  const setDefaultAddress = (index) => {
    const newAddresses = addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index
    }));
    setAddresses(newAddresses);
  };

  //submit userdata
  const submitUserData = async(e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    // Show loading state
    setShowSpin(true);

    try {
      const { fname, lname, email, mobile, gender, location, dateOfBirth } = inputdata;

      const data = new FormData();
      data.append("fname", fname.trim());
      data.append("lname", lname.trim());
      data.append("email", email.trim());
      data.append("mobile", mobile.trim());
      data.append("gender", gender);
      data.append("status", status);
      data.append("user_profile", image);
      data.append("location", location?.trim() || "");
      data.append("dateOfBirth", dateOfBirth || "");
      data.append("addresses", JSON.stringify(addresses));

      const config = {
        "Content-Type": "multipart/form-data"
      };

      const response = await registerfunc(data, config);
      
      if (response.status === 200) {
        // Reset form
        setInputData({
          fname: "",
          lname: "",
          email: "",
          mobile: "",
          gender: "",
          location: "",
          dateOfBirth: ""
        });
        setStatus("Active");
        setImage("");
        setAddresses([{
          addressType: "home",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          isDefault: true
        }]);
        setErrors({});
        setUseradd(response.data.data);
        
        // Enhanced success message
        toast.success(`Customer "${fname} ${lname}" created successfully! Redirecting to dashboard...`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Delay navigation to show success message
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        // Enhanced error handling
        const errorMessage = response.data?.message || response.data?.error || "Failed to create customer";
        const validationErrors = response.data?.errors;
        
        if (validationErrors && Array.isArray(validationErrors)) {
          toast.error(`Validation failed: ${validationErrors.join(", ")}`);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Enhanced error logging
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || "Server error occurred";
        toast.error(`Server Error: ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        toast.error("Network error: Unable to connect to server");
      } else {
        // Something else happened
        toast.error("An unexpected error occurred while creating the customer");
      }
    } finally {
      setShowSpin(false);
    }
  }

  useEffect(() => {
    if (image) {
      setPreview(URL.createObjectURL(image))
    }

    setTimeout(() => {
      setShowSpin(false)
    }, 1200)
  }, [image])


  return (
    <>
      {
        showspin ? <Spiner /> : <div className="container">
          <h2 className='text-center mt-1'>Register Your Details</h2>
          <Card className='shadow mt-3 p-3'>
            <div className="profile_div text-center">
              <img src={preview ? preview : "/man.png"} alt="img" />
            </div>

            <Form onSubmit={submitUserData}>
              <Row>
                {/* Basic Information */}
                <Col lg={12}>
                  <h4 className="mb-3">Basic Information</h4>
                </Col>
                
                <Form.Group className="mb-3 col-lg-6" controlId="fname">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name='fname' 
                    value={inputdata.fname} 
                    onChange={setInputValue} 
                    placeholder='Enter First Name'
                    isInvalid={!!errors.fname}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fname}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="lname">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name='lname' 
                    value={inputdata.lname} 
                    onChange={setInputValue} 
                    placeholder='Enter Last Name'
                    isInvalid={!!errors.lname}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lname}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="email">
                  <Form.Label>Email Address *</Form.Label>
                  <Form.Control 
                    type="email" 
                    name='email' 
                    value={inputdata.email} 
                    onChange={setInputValue} 
                    placeholder='Enter Email'
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="mobile">
                  <Form.Label>Mobile Number *</Form.Label>
                  <Form.Control 
                    type="text" 
                    name='mobile' 
                    value={inputdata.mobile} 
                    onChange={setInputValue} 
                    placeholder='Enter Mobile Number'
                    maxLength="10"
                    isInvalid={!!errors.mobile}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.mobile}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="dateOfBirth">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control 
                    type="date" 
                    name='dateOfBirth' 
                    value={inputdata.dateOfBirth} 
                    onChange={setInputValue}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="location">
                  <Form.Label>Location</Form.Label>
                  <Form.Control 
                    type="text" 
                    name='location' 
                    value={inputdata.location} 
                    onChange={setInputValue} 
                    placeholder='Enter Your Location'
                  />
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="gender">
                  <Form.Label>Gender *</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="Male"
                      name="gender"
                      value="Male"
                      onChange={setInputValue}
                      checked={inputdata.gender === "Male"}
                    />
                    <Form.Check
                      type="radio"
                      label="Female"
                      name="gender"
                      value="Female"
                      onChange={setInputValue}
                      checked={inputdata.gender === "Female"}
                    />
                    <Form.Check
                      type="radio"
                      label="Other"
                      name="gender"
                      value="Other"
                      onChange={setInputValue}
                      checked={inputdata.gender === "Other"}
                    />
                  </div>
                  {errors.gender && <div className="text-danger small">{errors.gender}</div>}
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="status">
                  <Form.Label>Status *</Form.Label>
                  <Select 
                    options={statusOptions} 
                    onChange={setStatusValue}
                    value={statusOptions.find(option => option.value === status)}
                    placeholder="Select Status"
                  />
                </Form.Group>

                <Form.Group className="mb-3 col-lg-6" controlId="profile">
                  <Form.Label>Profile Picture *</Form.Label>
                  <Form.Control 
                    type="file" 
                    name='user_profile' 
                    onChange={setProfile}
                    accept="image/*"
                    isInvalid={!!errors.profile}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.profile}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Address Section */}
                <Col lg={12}>
                  <hr className="my-4" />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4>Address Information</h4>
                    <Button variant="outline-primary" size="sm" onClick={addAddress}>
                      <i className="fa-solid fa-plus"></i> Add Address
                    </Button>
                  </div>
                </Col>

                {addresses.map((address, index) => (
                  <Col lg={12} key={index}>
                    <Card className="mb-3">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <span>Address {index + 1}</span>
                        <div>
                          {addresses.length > 1 && (
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => removeAddress(index)}
                              className="me-2"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </Button>
                          )}
                          <Form.Check
                            type="radio"
                            label="Default"
                            name="defaultAddress"
                            checked={address.isDefault}
                            onChange={() => setDefaultAddress(index)}
                            disabled={addresses.length === 1}
                          />
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Form.Group className="mb-3 col-lg-6" controlId={`addressType_${index}`}>
                            <Form.Label>Address Type</Form.Label>
                            <Select 
                              options={addressTypeOptions}
                              value={addressTypeOptions.find(option => option.value === address.addressType)}
                              onChange={(selectedOption) => updateAddress(index, 'addressType', selectedOption.value)}
                            />
                          </Form.Group>

                          <Form.Group className="mb-3 col-lg-6" controlId={`addressLine1_${index}`}>
                            <Form.Label>Address Line 1 *</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={address.addressLine1} 
                              onChange={(e) => updateAddress(index, 'addressLine1', e.target.value)}
                              placeholder='Enter Address Line 1'
                              isInvalid={!!errors[`address_${index}_line1`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors[`address_${index}_line1`]}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-3 col-lg-6" controlId={`addressLine2_${index}`}>
                            <Form.Label>Address Line 2</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={address.addressLine2} 
                              onChange={(e) => updateAddress(index, 'addressLine2', e.target.value)}
                              placeholder='Enter Address Line 2'
                            />
                          </Form.Group>

                          <Form.Group className="mb-3 col-lg-6" controlId={`city_${index}`}>
                            <Form.Label>City *</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={address.city} 
                              onChange={(e) => updateAddress(index, 'city', e.target.value)}
                              placeholder='Enter City'
                              isInvalid={!!errors[`address_${index}_city`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors[`address_${index}_city`]}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-3 col-lg-6" controlId={`state_${index}`}>
                            <Form.Label>State *</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={address.state} 
                              onChange={(e) => updateAddress(index, 'state', e.target.value)}
                              placeholder='Enter State'
                              isInvalid={!!errors[`address_${index}_state`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors[`address_${index}_state`]}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-3 col-lg-6" controlId={`pincode_${index}`}>
                            <Form.Label>Pincode *</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={address.pincode} 
                              onChange={(e) => updateAddress(index, 'pincode', e.target.value)}
                              placeholder='Enter Pincode'
                              maxLength="6"
                              isInvalid={!!errors[`address_${index}_pincode`]}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors[`address_${index}_pincode`]}
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-3 col-lg-6" controlId={`country_${index}`}>
                            <Form.Label>Country</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={address.country} 
                              onChange={(e) => updateAddress(index, 'country', e.target.value)}
                              placeholder='Enter Country'
                            />
                          </Form.Group>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}

                <Col lg={12} className="text-center">
                  <Button variant="primary" type="submit" size="lg" className="me-3">
                    <i className="fa-solid fa-user-plus"></i> Create Customer
                  </Button>
                  <Button variant="secondary" type="button" size="lg" onClick={() => navigate("/")}>
                    Cancel
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card>
          <ToastContainer position="top-center" />
        </div>
      }

    </>
  )
}

export default Register