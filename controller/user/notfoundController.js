const  loadNotfound = (req,res)=>{
   
        let message = req.query.message 
        let alertType = req.query.alertType
        res.render("notfound", {
            fullname : req.session?.user?.fullname,
            message,
            alertType
        })
   
}

export default {loadNotfound}