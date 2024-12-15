import {getServerSession} from "next-auth/next";
import {authOptions} from "../auth/[...nextauth]/route";
import UserModel from "@/model/user";
import dbConnect from "@/lib/dbConnect";
import {User} from "next-auth";
import mongoose from "mongoose";

export async function GET(req: Request) { 
    await dbConnect();

    const session = await getServerSession(authOptions);
    const _user:User = session?.user;

    if (!session || !_user) {
        return Response.json({success: false, message: "Not authenticated"}, {status: 401});
    }

    // const userId = _user._id; // we are getting id in string type, so we need to convert it into string type
    const userId = new mongoose.Types.ObjectId(_user._id); // now it will change it into an number //! while using aggrgation it's create a problem,

    try {
        const user = await UserModel.aggregate([
            { $match: { _id: userId } },
            { $unwind: '$messages' },
            { $sort: { 'messages.createdAt': -1 } },
            { $group: { _id: '$_id', messages: { $push: '$messages' } } },
        ]).exec();

        if(!user || user.length === 0) {
            return Response.json({success: false, message: "User not found"}, {status: 404});
        }

        return Response.json({success: true, data: user[0].messages}, {status: 200});
    } catch (error) {
        console.log("Error getting messages", error);
        
        return Response.json({success: false, message: "Internal server error"}, {status: 500});
    }
}