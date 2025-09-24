import axios from "axios";

export const commonrequest = async(methods,url,body,header)=>{
    let config = {
        method:methods,
        url,
        data:body
    }

    // Only set headers if explicitly provided
    if(header){
        config.headers = header;
    } else {
        // Set default content type only for non-FormData requests
        if(!(body instanceof FormData)){
            config.headers = {
                "Content-Type":"application/json"
            }
        }
    }

    //axios instance
    return axios(config).then((data)=>{
        return data
    }).catch((error)=>{
        return error
    })
}
