import {commonrequest} from "./ApiCall"
import {BASE_URL} from "./helper"

// ========== BASIC CRUD OPERATIONS ==========

export const registerfunc = async(data,header)=>{
    return await commonrequest("POST",`${BASE_URL}/api/user/register`,data,header);
}

export const usergetfunc = async(search,gender,status,sort,page,limit=10,city,state,pincode,addressType,isSingleAddress,sortBy,sortOrder)=>{
    const params = new URLSearchParams({
        search: search || "",
        gender: gender || "",
        status: status || "",
        sort: sort || "new",
        page: page || 1,
        limit: limit || 10,
        city: city || "",
        state: state || "",
        pincode: pincode || "",
        addressType: addressType || "",
        isSingleAddress: isSingleAddress || "",
        sortBy: sortBy || "datecreated",
        sortOrder: sortOrder || "desc"
    });
    return await commonrequest("GET",`${BASE_URL}/api/user/details?${params}`,"");
}

export const singleUsergetfunc = async(id)=>{
    return await commonrequest("GET",`${BASE_URL}/api/user/${id}`,"");
}

export const editfunc = async(id,data,header)=>{
    return await commonrequest("PUT",`${BASE_URL}/api/user/edit/${id}`,data,header);
}

export const deletfunc = async(id)=>{
    return await commonrequest("DELETE",`${BASE_URL}/api/user/delete/${id}`,{});
}

export const statuschangefunc = async(id,data)=>{
    return await commonrequest("PUT",`${BASE_URL}/api/user/status/${id}`,{data})
}


// ========== ADDRESS MANAGEMENT OPERATIONS ==========

export const addAddressfunc = async(userId, addressData)=>{
    return await commonrequest("POST",`${BASE_URL}/api/user/${userId}/address`,addressData);
}

export const updateAddressfunc = async(userId, addressId, addressData)=>{
    return await commonrequest("PUT",`${BASE_URL}/api/user/${userId}/address/${addressId}`,addressData);
}

export const deleteAddressfunc = async(userId, addressId)=>{
    return await commonrequest("DELETE",`${BASE_URL}/api/user/${userId}/address/${addressId}`,{});
}

export const setDefaultAddressfunc = async(userId, addressId)=>{
    return await commonrequest("PUT",`${BASE_URL}/api/user/${userId}/address/${addressId}/default`,{});
}

// ========== SEARCH AND FILTER OPERATIONS ==========

export const searchByLocationfunc = async(city, state, pincode)=>{
    const params = new URLSearchParams({
        city: city || "",
        state: state || "",
        pincode: pincode || ""
    });
    return await commonrequest("GET",`${BASE_URL}/api/user/search/location?${params}`,"");
}

export const getMultipleAddressCustomersfunc = async()=>{
    return await commonrequest("GET",`${BASE_URL}/api/user/multiple-addresses`,"");
}

export const getSingleAddressCustomersfunc = async()=>{
    return await commonrequest("GET",`${BASE_URL}/api/user/single-addresses`,"");
}

export const clearFiltersfunc = async(page=1, limit=10)=>{
    return await commonrequest("GET",`${BASE_URL}/api/user/clear-filters?page=${page}&limit=${limit}`,"");
}

// ========== HEALTH CHECK ==========

export const healthCheckfunc = async()=>{
    return await commonrequest("GET",`${BASE_URL}/health`,"");
}