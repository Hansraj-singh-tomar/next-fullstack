import { resend } from "@/lib/resend";
import EmailTemplate from "../../emailTemplate/EmailTemplate";
import { ApiResponse } from "@/types/ApiResponse";

export async function sendVerificationEmail(
    email: string,
    username: string,
    otp: string
): Promise<ApiResponse> {
  try {
    await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: email,
        subject: 'Verification Code',
        react: EmailTemplate({ username, otp }),
    });

    return {success: false, message: "Verification email send successfully"};
  } catch (error) {
    console.log("Error sending verification email", error);
    return {success: false, message: "Failed to send verification email"};
  }
}