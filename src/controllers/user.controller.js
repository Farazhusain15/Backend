import { asyncHandler } from "../utils/asyncHandler.js";

const registeUser= asyncHandler(async(req,res)=>{
res.status(200).json({
    message:"ok"
})
})
const loginUser=asyncHandler(async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})

export {registeUser,loginUser};