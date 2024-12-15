//! This whole code is for authenticationm which is being used from next-auth

import {NextAuthOptions} from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any): Promise<any> {
                await dbConnect();

                try {
                    const user = await UserModel.findOne({
                        $or: [
                            {email: credentials.identifier.email},
                            {username: credentials.identifier.username}
                        ]
                    })

                    // if user doesn't exist then we have to throw the error
                    if (!user) {
                        throw new Error("No user found with this email")
                    }
                
                    // checking user is verified or not 
                    if (!user.isVerified) {
                        throw new Error("Please verify your account before login")
                    }

                    // now we compare password, then it will give us boolean value
                    const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)

                    if (isPasswordCorrect) {
                        return user; //! ye return hokar providers means authOptions ke pass ja rha hai
                    } else {
                        throw new Error("Incorrect credentials")   
                    }

                } catch (error: any) {
                    throw new Error(error) 
                }
            },
        }),
    ],
    pages: {
        signIn: "/sign-in",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    //! nextAuth session based strategy par chalta hai 
    callbacks: {
        async jwt({ token, user }) { //! ye user hamne upar return kiya tha vhi hai
            if (user) {
                token._id = user._id?.toString();
                token.isVerified = user.isVerified;
                token.isAcceptingMessages = user.isAcceptingMessages;
                token.username = user.username;
            }
            return token
        },
        async session({ session, token }) { //! iss token ke andar sirf user id hai, we can add more things inside it
            //? jisse hame jyada db query na karna pade, jitni ho sake utni information add kar saku inside it.
            
            if (token) { // token me hamne sari value ko insert kar diya hai to hame user ka use karne ki jarurat hi nhi hai 
                session.user._id = token._id;
                session.user.isVerified = token.isVerified;
                session.user.isAcceptingMessages = token.isAcceptingMessages;
                session.user.username = token.username;
            }
            return session
        }
    }
}