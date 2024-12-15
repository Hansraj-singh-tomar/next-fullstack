import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";

const UsernameQuerySchema = z.object({
    username: usernameValidation,
});

// URl: http://localhost:3000/api/check-username-unique?username=abcde

export async function GET(request: Request) { 
    //TODO - Use this in all other routes
    //? this is a get request and some one has used post for that we are adding some checks here
    //? But it has depricated from the nextjs
    // if (request.method !== "GET") {
    //     return Response.json({success: false, message: "Method not allowed, only GET method is allowed"}, {status: 405});
    // }

    await dbConnect(); 

    try {
        const { searchParams } = new URL(request.url); //! localhost:3000/api/check-username-unique?username=abcde?phone=android
        const queryParams = searchParams.get("username");
        
        //! validate with zod
        const result = UsernameQuerySchema.safeParse({username: queryParams}); // we have to pass the whole object like this otherwise it will not work
        // console.log(result); //! { success: true, data: { username: 'one' } }
        
        if (!result.success) {
            const usernameErrors = result.error.format()?.username?._errors || [];
            return Response.json({success: false, message: usernameErrors?.length > 0 ? usernameErrors.join(",") : "Invalid query parameters"}, {status: 400});
        }

        const { username } = result.data;

        const existingVerifiedUser = await UserModel.findOne({
            username,
            isVerified: true,
        });

        if (existingVerifiedUser) {
            return Response.json(
                {
                success: false,
                message: 'Username is already taken',
                },
                { status: 200 }
            );
        }

        return Response.json(
            {
                success: true,
                message: 'Username is unique',
            },
            { status: 200 }
        );
        
    } catch (error) {
        console.log("Error checking username unique", error);
        return Response.json({success: false, message: "Failed to check username unique"}, {status: 500});
    }
}

