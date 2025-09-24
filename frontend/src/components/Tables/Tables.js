import React from 'react'
import Row from 'react-bootstrap/Row';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Paginations from '../pagination/Paginations';
import { BASE_URL } from '../../services/helper';
import { NavLink } from 'react-router-dom';
import { statuschangefunc } from "../../services/Apis"
import { ToastContainer, toast } from "react-toastify"
import "./table.css"

const Tables = ({ userdata, deleteUser, userGet, handlePrevious, handleNext, page, pageCount, setPage, loading, hasMore, loadMore, totalItems, limit }) => {

  const handleChange = async (id, status) => {
    const response = await statuschangefunc(id, status);

    if (response.status === 200) {
      userGet();
      toast.success("Status Updated")
    } else {
      toast.error("error ")
    }
  }

  return (
    <>
      <div className="container">
        <Row>
          <div className="col mt-0">
            <Card className='shadow'>
              <Table className='align-items-center' responsive="sm">
                <thead className='thead-dark'>
                  <tr className='table-dark'>
                    <th>ID</th>
                    <th>FullName</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>&nbsp;&nbsp;&nbsp;Status</th>
                    <th>Profile</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    userdata.length > 0 ? userdata.map((element, index) => {
                      return (
                          <tr key={`${element._id || 'temp'}-${index}`}>
                            <td>{index + 1 + (page - 1)*4}</td> 
                            <td>{element.fname + element.lname}</td>
                            <td>{element.email}</td>
                            <td>{element.gender === "Male" ? "M" : "F"}</td>
                            <td className='d-flex align-items-center'>
                              <Dropdown className='text-center'>
                                <Dropdown.Toggle className='dropdown_btn' id="dropdown-basic">
                                  <Badge bg={element.status === "Active" ? "primary" : "danger"}>
                                    {element.status} <i className="fa-solid fa-angle-down"></i>
                                  </Badge>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => handleChange(element._id, "Active")}>Active</Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleChange(element._id, "InActive")}>InActive</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                            <td className='img_parent'>
                              <img src={`${BASE_URL}/uploads/${element.profile}`} alt="img" />
                            </td>
                            <td>
                              <Dropdown>
                                <Dropdown.Toggle variant='light' className='action' id="dropdown-basic">
                                  <i className="fa-solid fa-ellipsis-vertical"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <NavLink to={`/userprofile/${element._id}`} className="dropdown-item text-decoration-none">
                                    <i className="fa-solid fa-eye" style={{ color: "green" }}></i> <span>View</span>
                                  </NavLink>
                                  <NavLink to={`/edit/${element._id}`} className="dropdown-item text-decoration-none">
                                    <i className="fa-solid fa-pen-to-square" style={{ color: "blue" }}></i> <span>Edit</span>
                                  </NavLink>
                                  <div className="dropdown-item" onClick={() => deleteUser(element._id, `${element.fname} ${element.lname}`)} style={{ cursor: "pointer" }}>
                                    <i className="fa-solid fa-trash" style={{ color: "red" }}></i> <span>Delete</span>
                                  </div>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                          </tr>
                      )
                    }) : 
                    <tr>
                      <td colSpan="8" className='no_data text-center'>NO Data Found</td>
                    </tr>
                  }


                </tbody>
              </Table>
              {/* Infinite Scroll Load More Button */}
              {hasMore && (
                <div className="text-center mt-3">
                  <Button 
                    variant="outline-primary" 
                    onClick={loadMore}
                    disabled={loading}
                    className="load-more-btn"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-arrow-down me-2"></i>
                        Load More Customers
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Traditional Pagination (fallback) */}
              {!hasMore && pageCount > 1 && (
                <Paginations
                  handlePrevious={handlePrevious}
                  handleNext={handleNext}
                  page={page}
                  pageCount={pageCount}
                  setPage={setPage}
                />
              )}

              {/* Results Summary */}
              <div className="text-center mt-3 text-muted">
                Showing {userdata.length} of {totalItems} customers
                {pageCount > 1 && ` (Page ${page} of ${pageCount})`}
              </div>
            </Card>
          </div>
        </Row>
        <ToastContainer />
      </div>
    </>
  )
}

export default Tables