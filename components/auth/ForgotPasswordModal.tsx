"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, KeyRound, Lock } from "lucide-react"

interface ForgotPasswordModalProps {
    isOpen: boolean
    onClose: () => void
    role: "customer" | "vendor" | "delivery"
}

export default function ForgotPasswordModal({ isOpen, onClose, role }: ForgotPasswordModalProps) {
    const [step, setStep] = useState(1)
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleRequestOtp = async () => {
        if (!email || !email.includes("@")) {
            toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const res = await api.auth.forgotPassword(email, role)
            if (res.success) {
                if (res.mode === "mock") {
                    toast({
                        title: "Notice: Mock Mode",
                        description: "API Key not detected. The OTP has been logged to the server console.",
                        variant: "destructive"
                    })
                } else {
                    toast({
                        title: "OTP Sent",
                        description: res.message,
                        duration: 10000
                    })
                }
                setStep(2)
            } else {
                toast({ title: "Error", description: res.message || "Failed to send OTP", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            toast({ title: "Invalid OTP", description: "Please enter the 6-digit verification code.", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const res = await api.auth.verifyOtp(email, role, otp)
            if (res.success) {
                setStep(3)
            } else {
                toast({ title: "Invalid OTP", description: res.message || "The code you entered is incorrect.", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Verification failed", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            toast({ title: "Weak Password", description: "Password must be at least 6 characters long.", variant: "destructive" })
            return
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" })
            return
        }

        setIsLoading(true)
        try {
            const res = await api.auth.resetPassword({ email, role, otp, newPassword })
            if (res.success) {
                toast({ title: "Success", description: "Password updated successfully. You can now login." })
                onClose()
                // Reset state
                setStep(1)
                setEmail("")
                setOtp("")
                setNewPassword("")
            } else {
                toast({ title: "Error", description: res.message || "Password reset failed", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-gray-900">
                        <KeyRound className="w-5 h-5 text-orange-500" />
                        Reset Password
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        {step === 1 && "Enter your registered email address to receive a verification code on your phone."}
                        {step === 2 && "Enter the 6-digit code sent to your registered phone number."}
                        {step === 3 && "Create a new strong password for your account."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="pl-9 text-gray-900"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col items-center justify-center space-y-6 py-2">
                            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                            <Button
                                variant="link"
                                className="text-orange-600 p-0 h-auto"
                                onClick={handleRequestOtp}
                                disabled={isLoading}
                            >
                                Resend code
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="Min 6 characters"
                                        className="pl-9"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Repeat password"
                                        className="pl-9"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step === 1 && (
                        <Button onClick={handleRequestOtp} className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Send OTP
                        </Button>
                    )}
                    {step === 2 && (
                        <Button onClick={handleVerifyOtp} className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Verify Code
                        </Button>
                    )}
                    {step === 3 && (
                        <Button onClick={handleResetPassword} className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Password
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
