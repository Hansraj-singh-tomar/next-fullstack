import dbConnect from "@/lib/dbConnect"; //! for every route you need to connect to db
import UserModel from "@/model/user";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) { 
    await dbConnect();

    try {
        const {username, password, email} = await request.json();  //! await is cumpulsary
        const existingUserVerifiedByUsername = await UserModel.findOne({ username, isVerified: true });
        
        if (existingUserVerifiedByUsername) {
            return Response.json(
                {
                    success: false,
                    message: "Username already exists"
                }, { status: 400 }
            )
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 100000 + 0 - 900000 ke bich me random number generate hoga
        
        const existingUserByEmail = await UserModel.findOne({ email });

        if (existingUserByEmail) {
            if(existingUserByEmail.isVerified) {   
                return Response.json(
                    {
                        success: false,
                        message: "User already exists with this email"
                    }, { status: 400 }
                )
            } else {
                // existing user have with this email but not verified
                const hashedPassword = await bcrypt.hash(password, 10);
                existingUserByEmail.password = hashedPassword;
                existingUserByEmail.verifyCode = otp;
                existingUserByEmail.verifyCodeExpiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration
                await existingUserByEmail.save();
            }
        } else {
            // user registering first time 
            const hashedPassword = await bcrypt.hash(password, 10);
            const expiryDate = new Date(); //! for verifyCodeExpiration
            expiryDate.setHours(expiryDate.getHours() + 1);

            const newUser = new UserModel({
                username,
                password: hashedPassword,
                email,
                verifyCode: otp,
                verifyCodeExpiration: expiryDate,
                isVerified: false,
                isAcceptingMessages: true,
                messages: []
            });
            await newUser.save(); 
        }
        
        // send verification email
        const emailResponse = await sendVerificationEmail(email, username, otp);

        if (!emailResponse.success) {
            return Response.json(
                {
                    success: false,
                    message: emailResponse.message
                }, { status: 500 }
            )
        }

        return Response.json(
            {
                success: true,
                message: "User registered successfully, Please verify your email"
            }, { status: 200 }
        )
            

    } catch (error) {
        console.log("Catch section Error while registering user", error);
        return Response.json(
            {
                success: false,
                message: "Failed to register user"
            },
            { status: 500 }
        );
    }
}