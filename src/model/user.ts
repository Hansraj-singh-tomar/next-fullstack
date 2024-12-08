import mongoose, { Document, Schema } from "mongoose";

export interface Message extends Document { 
    content: string;
    createdAt: Date;
}

const MessageSchema: Schema<Message> = new Schema({
    content: {
        type: String,
        required: true
    }, 
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}) 


export interface User extends Document { 
    username: string;
    password: string;
    email: string;
    verifyCode: string; // otp
    verifyCodeExpiration: Date;
    isVerified: boolean;
    isAcceptingMessages: boolean;
    messages: Message[];   
}

const UserSchema: Schema<User> = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        unique: true
    }, 
    password: {
        type: String,
        required: [true, "Password is required"],
        unique: true
    }, 
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [
            /.+\@.+\..+/,
            "Please enter a valid email address"
        ]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifyCode: {
        type: String,
        required: [true, "Verification code is required"]
    }, 
    verifyCodeExpiration: {
        type: Date,
        required: [true, "Verification code expiration is required"]
    }, 
    isAcceptingMessages: {
        type: Boolean,
        default: true
    }, 
    messages: [MessageSchema],
})

//! Note - Nextjs me edge time par chije run hoti hai,
// but jab node/express se dedicated server banate hai toh,
// hame pta hai ki vo server ek baar ban to vo chalte hi rehta hai.
// but nextjs me essa nhi hota, nextjs ko nhi pta ki ye appplication
// first time bootup ho rhi hai, ya isse bhi pehle kai bar ho chuki hai


//! first we check user model pehle se bna hai ya nhi or nhi ho to create kar do
const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema);

export default UserModel;