import { asyncHandler } from "../../utils/asyncHandler.js";

export const  loadNotfound =  asyncHandler((req,res)=>{

  const {message , alertType} = req.query;

  res.render("notFound", {
    fullname : req.session?.user?.fullname,
    message,
    alertType
  });
});
