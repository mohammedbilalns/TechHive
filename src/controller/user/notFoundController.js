import { asyncHandler } from "../../utils/asyncHandler.js";
import { USER_VIEW_PATHS } from "../../constants/viewPaths.js";

export const  loadNotfound =  asyncHandler((req,res)=>{

  const {message , alertType} = req.query;

  res.render(USER_VIEW_PATHS.NotFound, {
    fullname : req.session?.user?.fullname,
    message,
    alertType
  });
});
