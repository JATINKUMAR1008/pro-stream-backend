import { ApiResponse } from "./ApiResponse.js";
export const SendErrResponse = (err,res) =>{
    return res
      .status(err.status || 500)
      .json(
        new ApiResponse(
          err.status || 500,
          err.message || "Internal server error"
        )
      );
}