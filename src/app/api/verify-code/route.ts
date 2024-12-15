import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";


// URL: http://localhost:3000/api/verify-code

export async function POST(request: Request) { 
    await dbConnect();

    try {
        const { username, otp } = await request.json(); 
        
        // url se jab chije aati hai to hame chijo ko decode kar lena chahiye
        const decodedUsername = decodeURIComponent(username); // username = "one%20two%20three"
        const user = await UserModel.findOne({ username: decodedUsername });

        if (!user) {
          return Response.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }

        // Check if the code is correct and not expired
        const isCodeValid = user.verifyCode === otp;
        const isCodeNotExpired = new Date(user.verifyCodeExpiration) > new Date(); // true/false

        if (isCodeValid && isCodeNotExpired) {
          // Update the user's verification status
          user.isVerified = true;
          await user.save();

          return Response.json(
            { success: true, message: 'Account verified successfully' },
            { status: 200 }
          );
        } else if (!isCodeNotExpired) {
          // Code has expired
          return Response.json(
            {
              success: false,
              message:
                'Verification code has expired. Please sign up again to get a new code.',
            },
            { status: 400 }
          );
        } else {
          // Code is incorrect
          return Response.json(
            { success: false, message: 'Incorrect verification code' },
            { status: 400 }
          );
        }

    } catch (error) {
        console.log("Error verifying user", error);
        return Response.json({success: false, message: "Error verifying user"}, {status: 500});        
    }
}
