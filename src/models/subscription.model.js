import mongoose,{Schema } from "mongoose";

const subscriptionSchema= new Schema({
  subscriber:{
    type: Schema.Types.ObjectId,// one who is subscribing
    ref:"User"
  },
  chennel:{
    type: Schema.type.ObjectId,// one to whom 'subscriber' is subscribing
    ref:"User"
  },
  
},{timestamps: true})

export  const Subscription=mongoose.model("Subcription",subscriptionSchema)