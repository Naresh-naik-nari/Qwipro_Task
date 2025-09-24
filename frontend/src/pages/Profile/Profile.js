import React,{useState,useEffect} from 'react'
import Card from "react-bootstrap/Card"
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Badge from 'react-bootstrap/Badge'
import Nav from 'react-bootstrap/Nav'
import Tab from 'react-bootstrap/Tab'
import { useParams, useNavigate } from 'react-router-dom'
import Spiner from "../../components/Spiner/Spiner"
import {singleUsergetfunc, addAddressfunc, updateAddressfunc, deleteAddressfunc, setDefaultAddressfunc} from "../../services/Apis"
import { BASE_URL } from '../../services/helper'
import moment from "moment"
import { toast } from 'react-toastify'
import "./profile.css"

const Profile = () => {

  const [userprofile,setUserProfile] = useState({});
  const [showspin, setShowSpin] = useState(true);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [newAddress, setNewAddress] = useState({
    addressType: "home",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    isDefault: false
  });

  const {id} = useParams();
  const navigate = useNavigate();

  const userProfileGet = async()=>{
    const response = await singleUsergetfunc(id);
    
    if(response.status === 200){
      setUserProfile(response.data.data || response.data)
    }else{
      console.log("error");
      toast.error("Failed to load customer profile");
    }
  }

  const handleAddAddress = async () => {
    try {
      const response = await addAddressfunc(id, newAddress);
      if (response.status === 200) {
        toast.success(`New ${newAddress.addressType} address added successfully!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setNewAddress({
          addressType: "home",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          isDefault: false
        });
        setShowAddAddress(false);
        userProfileGet();
      } else {
        toast.error(response.data?.message || "Failed to add address");
      }
    } catch (error) {
      console.error("Add address error:", error);
      toast.error("An error occurred while adding the address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?\n\nThis action cannot be undone.")) {
      try {
        const response = await deleteAddressfunc(id, addressId);
        if (response.status === 200) {
          toast.success("Address deleted successfully!", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          userProfileGet();
        } else {
          toast.error(response.data?.message || "Failed to delete address");
        }
      } catch (error) {
        console.error("Delete address error:", error);
        toast.error("An error occurred while deleting the address");
      }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await setDefaultAddressfunc(id, addressId);
      if (response.status === 200) {
        toast.success("Default address updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        userProfileGet();
      } else {
        toast.error(response.data?.message || "Failed to update default address");
      }
    } catch (error) {
      console.error("Set default address error:", error);
      toast.error("An error occurred while updating the default address");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setNewAddress({...address});
    setShowAddAddress(true);
  };

  const handleUpdateAddress = async () => {
    try {
      const response = await updateAddressfunc(id, editingAddress._id, newAddress);
      if (response.status === 200) {
        toast.success("Address updated successfully");
        setEditingAddress(null);
        setNewAddress({
          addressType: "home",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          isDefault: false
        });
        setShowAddAddress(false);
        userProfileGet();
      } else {
        toast.error("Failed to update address");
      }
    } catch (error) {
      toast.error("Error updating address");
    }
  };

  useEffect(() => {
    userProfileGet();
    setTimeout(() => {
      setShowSpin(false)
    }, 1200)
  }, [id])
  return (
    <>
      {
        showspin ? <Spiner /> : <div className="container">
          {/* Profile Header */}
          <div className="row mb-4">
            <div className="col-12">
              <Card className="shadow">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={3} className="text-center">
                      <img src={`${BASE_URL}/uploads/${userprofile.profile}`} alt="Profile" className="profile-img mb-3" />
                    </Col>
                    <Col md={6}>
                      <h2 className="mb-2">{userprofile.fname} {userprofile.lname}</h2>
                      <p className="text-muted mb-2">{userprofile.email}</p>
                      <p className="text-muted mb-2">{userprofile.mobile}</p>
                      <Badge bg={userprofile.status === 'Active' ? 'success' : 'danger'} className="me-2">
                        {userprofile.status}
                      </Badge>
                      {userprofile.isSingleAddress && <Badge bg="info">Single Address</Badge>}
                    </Col>
                    <Col md={3} className="text-end">
                      <Button variant="primary" onClick={() => navigate(`/edit/${id}`)} className="me-2">
                        <i className="fa-solid fa-edit"></i> Edit Profile
                      </Button>
                      <Button variant="outline-secondary" onClick={() => navigate("/")}>
                        <i className="fa-solid fa-arrow-left"></i> Back
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="row">
            <div className="col-12">
              <Card className="shadow h-100">
                <Card.Header>
                  <Tab.Container id="profile-tabs" activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav variant="tabs" className="nav-fill">
                      <Nav.Item>
                        <Nav.Link eventKey="personal">
                          <i className="fa-solid fa-user me-2"></i>Personal Information
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="addresses">
                          <i className="fa-solid fa-map-marker-alt me-2"></i>
                          Addresses ({userprofile.addresses?.length || 0})
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="activity">
                          <i className="fa-solid fa-chart-line me-2"></i>Activity
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Tab.Container>
                </Card.Header>
                <Card.Body>
                  <Tab.Container id="profile-tabs" activeKey={activeTab} onSelect={setActiveTab}>
                    <Tab.Content>
                      {/* Personal Information Tab */}
                      <Tab.Pane eventKey="personal">
                        <Row>
                          <Col md={6}>
                            <h5 className="mb-3"><i className="fa-solid fa-user me-2"></i>Basic Information</h5>
                            <div className="profile-details">
                              <p><strong>First Name:</strong> {userprofile.fname}</p>
                              <p><strong>Last Name:</strong> {userprofile.lname}</p>
                              <p><strong>Email:</strong> {userprofile.email}</p>
                              <p><strong>Mobile:</strong> {userprofile.mobile}</p>
                              <p><strong>Gender:</strong> {userprofile.gender}</p>
                              <p><strong>Status:</strong> <Badge bg={userprofile.status === 'Active' ? 'success' : 'danger'}>{userprofile.status}</Badge></p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <h5 className="mb-3"><i className="fa-solid fa-calendar me-2"></i>Additional Information</h5>
                            <div className="profile-details">
                              {userprofile.location && <p><strong>Location:</strong> {userprofile.location}</p>}
                              {userprofile.dateOfBirth && <p><strong>Date of Birth:</strong> {moment(userprofile.dateOfBirth).format("DD-MM-YYYY")}</p>}
                              <p><strong>Created:</strong> {moment(userprofile.datecreated).format("DD-MM-YYYY HH:mm")}</p>
                              {userprofile.dateUpdated && <p><strong>Last Updated:</strong> {moment(userprofile.dateUpdated).format("DD-MM-YYYY HH:mm")}</p>}
                              <p><strong>Address Count:</strong> {userprofile.addresses?.length || 0}</p>
                              <p><strong>Single Address:</strong> {userprofile.isSingleAddress ? 'Yes' : 'No'}</p>
                            </div>
                          </Col>
                        </Row>
                      </Tab.Pane>

                      {/* Addresses Tab */}
                      <Tab.Pane eventKey="addresses">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5><i className="fa-solid fa-map-marker-alt me-2"></i>Address Management</h5>
                          <div>
                            <Badge bg="info" className="me-2">
                              {userprofile.addresses?.length || 0} Address{(userprofile.addresses?.length || 0) !== 1 ? 'es' : ''}
                            </Badge>
                            {userprofile.isSingleAddress && <Badge bg="secondary">Single Address</Badge>}
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="ms-2"
                              onClick={() => setShowAddAddress(true)}
                            >
                              <i className="fa-solid fa-plus"></i> Add Address
                            </Button>
                          </div>
                        </div>
                        
                        {userprofile.addresses && userprofile.addresses.length > 0 ? (
                          <Row>
                            {userprofile.addresses.map((address, index) => (
                              <Col lg={6} key={address._id || index} className="mb-3">
                                <Card className={`h-100 ${address.isDefault ? 'border-primary' : ''}`}>
                                  <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <strong>Address {index + 1}</strong>
                                      {address.isDefault && <Badge bg="primary" className="ms-2">Default</Badge>}
                                    </div>
                                    <div>
                                      <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        className="me-1"
                                        onClick={() => handleEditAddress(address)}
                                      >
                                        <i className="fa-solid fa-edit"></i>
                                      </Button>
                                      {!address.isDefault && (
                                        <Button 
                                          variant="outline-success" 
                                          size="sm" 
                                          className="me-1"
                                          onClick={() => handleSetDefaultAddress(address._id)}
                                        >
                                          <i className="fa-solid fa-star"></i>
                                        </Button>
                                      )}
                                      {userprofile.addresses.length > 1 && (
                                        <Button 
                                          variant="outline-danger" 
                                          size="sm"
                                          onClick={() => handleDeleteAddress(address._id)}
                                        >
                                          <i className="fa-solid fa-trash"></i>
                                        </Button>
                                      )}
                                    </div>
                                  </Card.Header>
                                  <Card.Body>
                                    <div className="address-details">
                                      <p><strong>Type:</strong> <Badge bg="secondary">{address.addressType}</Badge></p>
                                      <p><strong>Address:</strong> {address.addressLine1}</p>
                                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                                      <p><strong>City:</strong> {address.city}</p>
                                      <p><strong>State:</strong> {address.state}</p>
                                      <p><strong>Pincode:</strong> {address.pincode}</p>
                                      <p><strong>Country:</strong> {address.country}</p>
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        ) : (
                          <div className="text-center py-5">
                            <i className="fa-solid fa-map-marker-alt fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">No addresses found</h5>
                            <p className="text-muted">Add an address to get started</p>
                            <Button variant="primary" onClick={() => setShowAddAddress(true)}>
                              <i className="fa-solid fa-plus"></i> Add First Address
                            </Button>
                          </div>
                        )}
                      </Tab.Pane>

                      {/* Activity Tab */}
                      <Tab.Pane eventKey="activity">
                        <h5 className="mb-3"><i className="fa-solid fa-chart-line me-2"></i>Customer Activity</h5>
                        <Row>
                          <Col md={6}>
                            <Card className="mb-3">
                              <Card.Header>
                                <h6><i className="fa-solid fa-info-circle me-2"></i>Account Information</h6>
                              </Card.Header>
                              <Card.Body>
                                <p><strong>Account Status:</strong> <Badge bg={userprofile.status === 'Active' ? 'success' : 'danger'}>{userprofile.status}</Badge></p>
                                <p><strong>Member Since:</strong> {moment(userprofile.datecreated).format("MMMM DD, YYYY")}</p>
                                {userprofile.dateUpdated && <p><strong>Last Updated:</strong> {moment(userprofile.dateUpdated).format("MMMM DD, YYYY")}</p>}
                                <p><strong>Profile Picture:</strong> {userprofile.profile ? 'Uploaded' : 'Not uploaded'}</p>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={6}>
                            <Card className="mb-3">
                              <Card.Header>
                                <h6><i className="fa-solid fa-map-marker-alt me-2"></i>Address Summary</h6>
                              </Card.Header>
                              <Card.Body>
                                <p><strong>Total Addresses:</strong> {userprofile.addresses?.length || 0}</p>
                                <p><strong>Address Types:</strong> {userprofile.addresses?.map(addr => addr.addressType).join(', ') || 'None'}</p>
                                <p><strong>Single Address Customer:</strong> {userprofile.isSingleAddress ? 'Yes' : 'No'}</p>
                                <p><strong>Default Address:</strong> {userprofile.addresses?.find(addr => addr.isDefault)?.addressType || 'None'}</p>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </Card.Body>
              </Card>
            </div>
          </div>

          {/* Add/Edit Address Modal */}
          {showAddAddress && (
            <div className="modal-overlay">
              <Card className="modal-content">
                <Card.Header>
                  <h5>{editingAddress ? 'Edit Address' : 'Add New Address'}</h5>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => {
                      setShowAddAddress(false);
                      setEditingAddress(null);
                      setNewAddress({
                        addressType: "home",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        pincode: "",
                        country: "India",
                        isDefault: false
                      });
                    }}
                  >
                    <i className="fa-solid fa-times"></i>
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label className="form-label">Address Type</label>
                        <select 
                          className="form-select"
                          value={newAddress.addressType}
                          onChange={(e) => setNewAddress({...newAddress, addressType: e.target.value})}
                        >
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="billing">Billing</option>
                          <option value="shipping">Shipping</option>
                        </select>
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label className="form-label">Address Line 1 *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={newAddress.addressLine1}
                          onChange={(e) => setNewAddress({...newAddress, addressLine1: e.target.value})}
                          placeholder="Enter address line 1"
                        />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label className="form-label">Address Line 2</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={newAddress.addressLine2}
                          onChange={(e) => setNewAddress({...newAddress, addressLine2: e.target.value})}
                          placeholder="Enter address line 2"
                        />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label className="form-label">City *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                          placeholder="Enter city"
                        />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label className="form-label">State *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                          placeholder="Enter state"
                        />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label className="form-label">Pincode *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                          placeholder="Enter pincode"
                          maxLength="6"
                        />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({...newAddress, country: e.target.value})}
                          placeholder="Enter country"
                        />
                      </div>
                    </Col>
                    <Col lg={6}>
                      <div className="mb-3">
                        <div className="form-check">
                          <input 
                            className="form-check-input"
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                          />
                          <label className="form-check-label">
                            Set as default address
                          </label>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer>
                  <Button 
                    variant="primary" 
                    onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                    disabled={!newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode}
                  >
                    {editingAddress ? 'Update Address' : 'Add Address'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="ms-2"
                    onClick={() => {
                      setShowAddAddress(false);
                      setEditingAddress(null);
                      setNewAddress({
                        addressType: "home",
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        pincode: "",
                        country: "India",
                        isDefault: false
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          )}
        </div>
      }
    </>
  )
}

export default Profile