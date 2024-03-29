import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/APIError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
// import {generateAccessToken} from "../models/user.model.js"



const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        // console.log(accessToken)
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
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

 const exisedUser =await User.findOne({
    $or:[{ userName },{ email }]
  })
//   console.log(exisedUser)

  if(exisedUser){
    throw new ApiError(409,"User with email or userName already exists");
  }

 const avatarLocalPath=req.files?.avatar[0]?.path;
//  console.log(req.files);
//  const coverImageLocalPath=req.files?.coverImage[0]?.path

 let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
coverImageLocalPath=req.files.coverImage[0].path
}

 if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required");

}
   const avatar=await uploadOnCloudinary(avatarLocalPath); 
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

const loginUser= asyncHandler(async(req,res)=>{
    
   //req.body
   //userName or email
   //find the user 
   //password check
   //access and refersh token
   //send cookie 
   const {email,userName,password}=req.body;
//    console.log(email);
   if(!(email  || userName )){
    throw new ApiError(400,"email and username is required")
   }
  const user=await User.findOne({
    $or: [{userName},{email}]
  })
  if(!user){
    throw new ApiError(404,"User dose not exist")
  }

  const isPasswordValid=await user.isPasswordCorrect(password);

  if(!isPasswordValid)
{
    throw ApiError(401,"password is not a valod password");
}
   const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id);

   const loggedInUser=await User.findById(user._id).
   select("-password -refreshToken");

   const options={
    httpOnly: true,
    secure: true
   }

   return res.status(200).cookie("accessToken",accessToken,options).
   cookie("refershToken",refreshToken,options).
   json(
    new ApiResponse(
     200,
     {
        user:loggedInUser, accessToken,refreshToken
     },
     "user logged in successully"
    )
   )
    
})

const logoutUser=asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(
    req.user._id,
    {
        $unset:{
            refershToken: 1 // this remove the field from document
        }
    },
    {
        new: true
    }
  )
  
  const options={
    httpOnly: true,
    secure: true
   }
   return res.status(200).
   clearCookie("accessToken",options)
   .clearCookie("refershToken",options)
   .json(new ApiResponse(200,{},"User logged out"))
})

const refershAccessToken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookie.refershToken || req.body.refershToken
    if(!incomingRefreshToken){
        throw new ApiError(400,"unauthorized request")
    }

try {
        const decodedToken= jwt.verify(
            incomingRefreshToken,
            process.env.process.env.REFRESH_TOKEN
        )
       const user =await User.findById(decodedToken?._id)
       if(!user){
        throw new ApiError(400,"invalid refresh token");
    }
    
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used")
    }
    
     const options={
        httpOnly:true,
        secure: true
     }
       const {accessToken,newRefreshToken}=await generateAccessAndRefereshTokens(user._id)
    
       return res.status(200).
       cookie("accessToken",accessToken,options).
       cookie("refreshToken",newRefreshToken, options)
       .json(
        new ApiResponse(
            200,
            {accessToken,refershToken: newRefreshToken},
            "Access token refreshed"
        )
       )
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
}
})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}= req.body

  const user=await User.findById(req.user?._id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }
  user.password= newPassword;
  await user.save({validateBeforeSave: false})

  return res.status(200)
  .json(new ApiResponse(200,{},"password change successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(200,req.user,"current user fectch successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user =await User.findByIdAndUpdate(
        req.user?._id,
        { 
          $set:{
            fullName,
            email
          }

        },
        {new: true}
    ).select("-password")
    res.status(200)
    .json(new ApiResponse(200,"Account Details update successfully"))
});

const updateUserAvatar= asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar files is missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"url not found")
    }

   const user=await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                avatar:avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,"Avatar update successfully")
    )
})

const updateUserCoverImage= asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage files is missing")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"url not found")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                coverImage:coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,"coverImage upload successfully")
    )
})


const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {userName}=req.params;

    if(!userName?.trim()){
        throw new ApiError(400,"username is missing")
    }
    const channel=await User.aggregate([
        {
            $match:{
                userName:userName?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subcriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers" 
            }
        },
        {
            $lookup:{
                from:"subcriptions",
                localField:"_id",
                foreignField:" subscriber",
                as:"subscribedTo" 
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then: true,
                    else: false
                }    
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])
    console.log(channel);
    if(!channel?.length){
        throw new ApiError(404,"channel does not exists")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,"User channel fetched successfully")
    )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
     const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owenr",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
     ])

     return res.status(200)
     .json(
        new ApiResponse(200,
            user[0].watchHistory,
            "watch history fetch successfully")
     )
})

export {registeUser,
    loginUser,
     logoutUser,
     refershAccessToken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage,
     getUserChannelProfile,
     getWatchHistory
};