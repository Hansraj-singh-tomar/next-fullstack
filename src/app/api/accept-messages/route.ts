import {getServerSession} from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import UserModel from "@/model/user";
import dbConnect from "@/lib/dbConnect";
import { User } from "next-auth";

export async function POST(req: Request) { 
    await dbConnect(); // connect to the database

    //! checking if the user is logged in or not
    const session = await getServerSession(authOptions); 
    // console.log(session); // this will give us the user
    
    const user:User = session?.user;
    
    if (!session || !user) {
        return Response.json({success: false, message: "User not logged in, Not authenticated"}, {status: 401});
    }

    const userId = user._id; // this _id is a string type value, bcz we change it into an string in options.ts file 
    const { acceptMessages } = await req.json(); //! it just a flag - true/false

    try { 
        // await UserModel.updateOne({_id: userId}, {isAcceptingMessages: acceptMessages});
        
        const updatedUser = await UserModel.findByIdAndUpdate(userId, { isAcceptingMessages: acceptMessages }, { new: true }); //! return me jo value milegi vo updated value milegi
        
        if(!updatedUser) {
            // user not found
            return Response.json(
                {
                    success: false,
                    message: "Unable to find user to update message acceptance status",
                },
                {status: 404}
            )
        }

        // successfully updated message acceptance status
        return Response.json({success: true, message: "Message acceptance status updated successfully", data: updatedUser}, {status: 200});
    } catch (error) { 
        console.log("failed to update user status to accept messages", error);
        return Response.json({success: false, message: "Failed to update user status to accept messages"}, {status: 500});
    }
}

export async function GET(req: Request) {
  // Connect to the database
  await dbConnect();

  // Get the user session
  const session = await getServerSession(authOptions);
  const user = session?.user;

  // Check if the user is authenticated
  if (!session || !user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    // Retrieve the user from the database using the ID
    const foundUser = await UserModel.findById(user._id);

    if (!foundUser) {
      // User not found
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return the user's message acceptance status
    return Response.json(
      {
        success: true,
        isAcceptingMessages: foundUser.isAcceptingMessages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving message acceptance status:', error);
    return Response.json(
      { success: false, message: 'Error retrieving message acceptance status' },
      { status: 500 }
    );
  }
}