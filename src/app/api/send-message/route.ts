import UserModel from "@/model/user";
import dbConnect from "@/lib/dbConnect";
import { Message } from "@/model/user";

export async function POST(req: Request) { 
    await dbConnect(); 

    const { username, content } = await req.json();

    try {
        const user = await UserModel.findOne({ username }).exec();

        if (!user) { 
            return Response.json({success: false, message: "User not found"}, {status: 404});
        }

        // check if the user is accepting messages or not
        if (!user.isAcceptingMessages) { 
            return Response.json({success: false, message: "User is not accepting messages"}, {status: 403});
        }

        const newMessage = { content, createdAt: new Date() };
        
        // Push the new message to the user's messages array
        user.messages.push(newMessage as Message);
        await user.save();

        return Response.json({success: true, message: "Message sent successfully"}, {status: 201});
    } catch (error) {
        console.log("Error adding message", error);
        return Response.json({success: false, message: "Internal server error"}, {status: 500});
    }
}