import {NextAuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/user';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async authorize(credentials: any): Promise<any> {
          console.log('Starting authorization...');
          console.log('Credentials:', credentials);
            
          if (!credentials?.identifier || !credentials?.password) {
              console.error('Missing credentials');
              throw new Error('Missing credentials');
          }

          await dbConnect();

          console.log('Database connected');

          try {
                const user = await UserModel.findOne({
                    $or: [
                    { email: credentials?.identifier },
                    { username: credentials?.identifier },
                    ],
                });

                console.log('User found:', user);

                if (!user) {
                    throw new Error('No user found with this email');
                }

                if (!user.isVerified) {
                    throw new Error('Please verify your account before logging in');
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password
                );
                if (isPasswordCorrect) {
                    return user;
                } else {
                    throw new Error('Incorrect password');
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
              console.error('Error in authorize function:', err);
              throw new Error(err);
          }
        },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback - User:', user);
     console.log('JWT Callback - Token:', token);
      if (user) {
        token._id = user._id?.toString(); // Convert ObjectId to string
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - Token:', token);
      console.log('Session Callback - Session:', session);
      if (token) {
        session.user._id = token?._id;
        session.user.isVerified = token?.isVerified;
        session.user.isAcceptingMessages = token?.isAcceptingMessages;
        session.user.username = token?.username;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/sign-in',
  },
  debug: true,
};

