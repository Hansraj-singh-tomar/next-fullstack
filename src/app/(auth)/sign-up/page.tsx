"use client"

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from 'next/link';
import { useDebounceCallback } from 'usehooks-ts';
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { signUpSchema } from "@/schemas/signUpSchema";

import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from "lucide-react";

const SignUpForm = () => {
    const [username, setUsername] = useState("");
    const [usernameMessage, setUsernameMessage] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const debounced = useDebounceCallback(setUsername, 300);
    
    const { toast } = useToast();
    const router = useRouter();
    
    const register = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
        },
    });

    useEffect(() => {
        const checkUsernameUnique = async () => {
            if (username) {
                setIsCheckingUsername(true);
                setUsernameMessage(''); // Reset message
                try {
                    const response = await axios.get<ApiResponse>(`/api/check-username-unique?username=${username}`);
                    setUsernameMessage(response?.data?.message);
                } catch (error) {
                    const axiosError = error as AxiosError<ApiResponse>;
                    setUsernameMessage(
                        axiosError.response?.data.message ?? 'Error checking username'
                    );
                } finally {
                    setIsCheckingUsername(false);
                }
            }
        };
        checkUsernameUnique();
    }, [username])

    const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
        setIsSubmitting(true);
        try {
            const response = await axios.post<ApiResponse>('/api/sign-up', data);

            toast({
                title: 'Success',
                description: response.data.message,
            });

            router.replace(`/verify/${username}`);

            setIsSubmitting(false);
        } catch (error) {
            console.error('Error during sign-up:', error);

            const axiosError = error as AxiosError<ApiResponse>;

            // Default error message
            const errorMessage = axiosError.response?.data.message;
            // ('There was a problem with your sign-up. Please try again.');

            toast({
                title: 'Sign Up Failed',
                description: errorMessage,
                variant: 'destructive',
            });

            setIsSubmitting(false);
        }
    };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 my-2 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight lg:text-3xl mb-6">
            Join True Feedback
          </h1>
          <p className="mb-4">Sign up to start your anonymous adventure</p>
        </div>
        <Form {...register}>
          <form onSubmit={register.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="username"
              control={register.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <Input
                    {...field}
                    onChange={(e) => { //! This is ourOwn field that is why we are using this onChange method, otherwise it handle itself
                      field.onChange(e);
                      debounced(e.target.value);
                    }}
                  />
                  {isCheckingUsername && <Loader2 className="animate-spin" />}
                  {!isCheckingUsername && usernameMessage && (
                    <p
                      className={`text-sm ${
                        usernameMessage === 'Username is unique'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {usernameMessage}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={register.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input {...field} name="email" placeholder="email" />
                  <p className='text-muted text-gray-800 text-sm'>We will send you a verification code</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={register.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...field} name="password" placeholder="password" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className='w-full' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </Form>
        <div className="text-center mt-4">
          <p>
            Already a member?{' '}
            <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUpForm;