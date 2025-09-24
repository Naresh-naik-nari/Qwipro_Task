import React, { useContext, useEffect, useState } from 'react'
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tables from '../../components/Tables/Tables';
import Spiner from "../../components/Spiner/Spiner"
import { useNavigate } from "react-router-dom"
import { addData , dltdata, updateData} from '../../components/context/ContextProvider';
import {usergetfunc,deletfunc} from "../../services/Apis";
import Alert from 'react-bootstrap/Alert';
import "./home.css"
import { toast } from 'react-toastify';


const Home = () => {

  const [userdata,setUserData] = useState([]);
  const [showspin,setShowSpin] = useState(true);
  const [search,setSearch] = useState("");
  const [gender,setGender] = useState("All");
  const [status,setStatus] = useState("All");
  const [sort,setSort] = useState("new");
  const [page,setPage] = useState(1);
  const [pageCount,setPageCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Advanced search filters
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressType, setAddressType] = useState("All");
  const [isSingleAddress, setIsSingleAddress] = useState("");
  const [sortBy, setSortBy] = useState("datecreated");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Show/hide advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { useradd, setUseradd } = useContext(addData);
  
  const {update,setUpdate} = useContext(updateData);
  const {deletedata, setDLtdata} = useContext(dltdata);

  const navigate = useNavigate();

  const adduser = () => {
    navigate("/register")
  }

  // get user with advanced filtering
  const userGet = async(resetData = false)=>{
    setLoading(true);
    
    try {
      const response = await usergetfunc(
        search, gender, status, sort, page, limit, 
        city, state, pincode, addressType, isSingleAddress, sortBy, sortOrder
      );
      
      if(response.status === 200){
        const data = response.data.data || response.data;
        const newUsers = data.users || data.usersdata || [];
        
        if (resetData) {
          setUserData(newUsers);
        } else {
          setUserData(prev => [...prev, ...newUsers]);
        }
        
        setPageCount(data.pagination?.totalPages || data.Pagination?.pageCount || 0);
        setTotalItems(data.pagination?.totalItems || data.Pagination?.count || 0);
        setHasMore(page < (data.pagination?.totalPages || data.Pagination?.pageCount || 0));
      } else {
        console.log("error for get user data");
        toast.error("Failed to load customer data");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("An error occurred while loading customer data");
    } finally {
      setLoading(false);
    }
  }

  // user delete with confirmation
  const deleteUser = async(id, customerName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete customer "${customerName}"?\n\nThis action cannot be undone and will permanently remove all customer data including addresses.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await deletfunc(id);
      if(response.status === 200){
        userGet();
        setDLtdata(response.data);
        toast.success(`Customer "${customerName}" deleted successfully!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error(response.data?.message || "Failed to delete customer");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting the customer");
    }
  }


  // Clear all filters
  const clearAllFilters = () => {
    setSearch("");
    setGender("All");
    setStatus("All");
    setSort("new");
    setCity("");
    setState("");
    setPincode("");
    setAddressType("All");
    setIsSingleAddress("");
    setSortBy("datecreated");
    setSortOrder("desc");
    setPage(1);
    setShowAdvancedFilters(false);
  };

  // Handle search by location
  const handleLocationSearch = () => {
    if (!city && !state && !pincode) {
      toast.warning("Please enter at least one location parameter");
      return;
    }
    setPage(1);
    userGet(true);
  };

  // Handle search input with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setPage(1);
      userGet(true);
    }, 500);
  };

  // Load more data for infinite scroll
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    if (page > 1) {
      userGet(false);
    }
  }, [page]);

  // pagination
  // handle prev btn
  const handlePrevious = ()=>{
    setPage(()=>{
      if(page === 1) return page;
      return page - 1
    })
  }

  // handle next btn
  const handleNext = ()=>{
    setPage(()=>{
      if(page === pageCount) return page;
      return page + 1
    })
  }

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  useEffect(()=>{
    userGet(true);
    setTimeout(()=>{
        setShowSpin(false)
    },1200)
  },[search,gender,status,sort,limit,city,state,pincode,addressType,isSingleAddress,sortBy,sortOrder])

  return (
    <>
    {
      useradd && typeof useradd === 'object' && useradd.fname ?  <Alert variant="success" onClose={() => setUseradd("")} dismissible>{useradd.fname.toUpperCase()} Successfully Added</Alert>:""
    }

    {
      update && typeof update === 'object' && update.fname ? <Alert variant="primary" onClose={() => setUpdate("")} dismissible>{update.fname.toUpperCase()} Successfully Updated</Alert>:""
    }

    {
      deletedata && typeof deletedata === 'object' && deletedata.fname ? <Alert variant="danger" onClose={() => setDLtdata("")} dismissible>{deletedata.fname.toUpperCase()} Successfully Deleted</Alert>:""
    }

      <div className="container">
        <div className="main_div">
          {/* search add btn */}
          <div className="search_add mt-4 d-flex justify-content-between flex-wrap">
            <div className="search col-lg-4">
              <Form className="d-flex">
                <Form.Control
                  type="search"
                  placeholder="Search by name, email, mobile..."
                  className="me-2"
                  aria-label="Search"
                  value={search}
                  onChange={handleSearchChange}
                />
                <Button variant="success" className='search_btn'>
                  <i className="fa-solid fa-search"></i>
                </Button>
              </Form>
            </div>
            <div className="add_btn d-flex gap-2">
              <Button 
                variant="outline-info" 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <i className="fa-solid fa-filter"></i>&nbsp; Advanced Filters
              </Button>
              <Button variant="outline-warning" onClick={clearAllFilters}>
                <i className="fa-solid fa-times"></i>&nbsp; Clear Filters
              </Button>
              <Button variant="primary" onClick={adduser}> 
                <i className="fa-solid fa-plus"></i>&nbsp; Add Customer
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Card className="mt-3">
              <Card.Header>
                <h5><i className="fa-solid fa-filter"></i> Advanced Search & Filters</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pincode</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        maxLength="6"
                      />
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address Type</Form.Label>
                      <Form.Select
                        value={addressType}
                        onChange={(e) => setAddressType(e.target.value)}
                      >
                        <option value="All">All Types</option>
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="billing">Billing</option>
                        <option value="shipping">Shipping</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address Count</Form.Label>
                      <Form.Select
                        value={isSingleAddress}
                        onChange={(e) => setIsSingleAddress(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="true">Single Address Only</option>
                        <option value="false">Multiple Addresses</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sort By</Form.Label>
                      <Form.Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="datecreated">Date Created</option>
                        <option value="dateUpdated">Last Updated</option>
                        <option value="fname">First Name</option>
                        <option value="lname">Last Name</option>
                        <option value="email">Email</option>
                        <option value="mobile">Mobile Number</option>
                        <option value="gender">Gender</option>
                        <option value="status">Status</option>
                        <option value="location">Location</option>
                        <option value="dateOfBirth">Date of Birth</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Sort Order</Form.Label>
                      <Form.Select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={3} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Items Per Page</Form.Label>
                      <Form.Select
                        value={limit}
                        onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center">
                  <Button variant="primary" onClick={handleLocationSearch} className="me-2">
                    <i className="fa-solid fa-search"></i> Search by Location
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAdvancedFilters(false)}>
                    <i className="fa-solid fa-eye-slash"></i> Hide Filters
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
          {/* export,gender,status */}

          <div className="filter_div mt-5 d-flex justify-content-between flex-wrap">
            <div className="filter_gender">
              <div className="filter">
                <h3>Filter By Gender</h3>
                <div className="gender d-flex justify-content-between">
                  <Form.Check
                    type={"radio"}
                    label={`All`}
                    name="gender"
                    value={"All"}
                    onChange={(e)=>setGender(e.target.value)}
                    defaultChecked
                  />
                  <Form.Check
                    type={"radio"}
                    label={`Male`}
                    name="gender"
                    value={"Male"}
                    onChange={(e)=>setGender(e.target.value)}
                  />
                  <Form.Check
                    type={"radio"}
                    label={`Female`}
                    name="gender"
                    value={"Female"}
                    onChange={(e)=>setGender(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* short by value */}
            {/* <div className="filter_newold">
              <h3>Short By Value</h3>
              <Dropdown className='text-center'>
                <Dropdown.Toggle className='dropdown_btn' id="dropdown-basic">
                  <i className="fa-solid fa-sort"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={()=>setSort("new")}>New</Dropdown.Item>
                  <Dropdown.Item onClick={()=>setSort("old")}>Old</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div> */}

            {/* filter by status */}
            <div className="filter_status">
              <div className="status">
                <h3>Filter By Status</h3>
                <div className="status_radio d-flex justify-content-between flex-wrap">
                  <Form.Check
                    type={"radio"}
                    label={`All`}
                    name="status"
                    value={"All"}
                    onChange={(e)=>setStatus(e.target.value)}
                    defaultChecked
                  />
                  <Form.Check
                    type={"radio"}
                    label={`Active`}
                    name="status"
                    value={"Active"}
                    onChange={(e)=>setStatus(e.target.value)}
                  />
                  <Form.Check
                    type={"radio"}
                    label={`InActive`}
                    name="status"
                    value={"InActive"}
                    onChange={(e)=>setStatus(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Results Summary */}
        {!showspin && (
          <div className="mt-3 mb-3">
            <Card>
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div>
                    <strong>Showing {userdata.length} of {totalItems} customers</strong>
                    {pageCount > 1 && (
                      <span className="text-muted ms-2">
                        (Page {page} of {pageCount})
                      </span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Items per page:</span>
                    <Form.Select
                      size="sm"
                      style={{width: 'auto'}}
                      value={limit}
                      onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </Form.Select>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}

        {
          showspin ? <Spiner /> : <Tables
                                    userdata={userdata}
                                    deleteUser={deleteUser}
                                    userGet={userGet}
                                    handlePrevious={handlePrevious}
                                    handleNext={handleNext}
                                    page={page}
                                    pageCount={pageCount}
                                    setPage={setPage}
                                    totalItems={totalItems}
                                    limit={limit}
                                    loading={loading}
                                    hasMore={hasMore}
                                    loadMore={loadMore}
                                  />
        }

      </div>
    </>
  )
}

export default Home