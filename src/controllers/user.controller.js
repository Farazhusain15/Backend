import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/APIResponse.js";
const registeUser= asyncHandler(async(req,res)=>{
//get user details from frontend
//validation - not empty
//check if user alraedy exists: userName,email
//check for images,check for avatar
//upload them to cloudinary,avatar
//create user object- create entry in db
//remove password and  refresh token field from response
//check for user creation
// return res
const {fullName,email,userName,password}=req.body;
if(
    [fullName,email,userName,password].some((field)=>
    field ?.trim()==="")
){
   throw new ApiError(400,"All fields are required")
}

 const exisedUser =User.findOne({
    $or:[{ userName },{ email }]
  })

  if(exisedUser){
    throw new ApiError(409,"User with email or userName already exists");
  }

 const avatarLocalPath=req.files?.avatar[0]?.path;
 const coverImageLocalPath=req.files?.coverImage[0].path

 if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required");
}
 const avatar=uploadOnCloudinary(avatarLocalPath); 
   const coverImage =await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400,"Avatar file is required");
   }

  const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    userName:userName.toLowerCase()
   })

   const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser){
    throw new ApiError(500,"Something want wrong while registering the user")
   }
   return res.status(201).json(
    new ApiResponse(200,createdUser,"user register successfully")
   )
})

const loginUser=asyncHandler(async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })
})

export {registeUser,loginUser};