"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useMagic } from "@/hooks/useMagic"
import { saveUserInfo } from "@/lib/utils/common"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import showToast from "@/lib/utils/showToast"
import { RPCError, RPCErrorCode } from "magic-sdk"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const router = useRouter()
  const { magic } = useMagic()

  useEffect(() => {
    // Check if user is already logged in (token exists in localStorage)
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      router.push("/portfolio")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
      setEmailError(true)
      return
    }

    try {
      setIsLoading(true)
      setEmailError(false)
      
      if (!magic) {
        throw new Error('Magic SDK not initialized')
      }

      // Login with Magic Link (Email OTP)
      const token = await magic.auth.loginWithEmailOTP({ email })
      
      // Get user metadata
      const metadata = await magic.user.getInfo()

      if (!token || !metadata?.publicAddress) {
        throw new Error('Magic login failed')
      }

      // Save user info and token
      setToken(token as string)
      saveUserInfo(token as string, 'EMAIL', metadata.publicAddress)
      
      // Redirect to dashboard after successful login
      router.push("/portfolio")
    } catch (e) {
      console.error("Login error:", e)
      
      if (e instanceof RPCError) {
        switch (e.code) {
          case RPCErrorCode.MagicLinkFailedVerification:
          case RPCErrorCode.MagicLinkExpired:
          case RPCErrorCode.MagicLinkRateLimited:
          case RPCErrorCode.UserAlreadyLoggedIn:
            showToast({ message: e.message, type: 'error' })
            break
          default:
            showToast({
              message: 'Something went wrong. Please try again',
              type: 'error',
            })
        }
      } else {
        showToast({
          message: 'Something went wrong. Please try again',
          type: 'error',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-black">
      <ToastContainer />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => {
                    if (emailError) setEmailError(false);
                    setEmail(e.target.value);
                  }}
                  className={emailError ? "border-red-500" : ""}
                />
                {emailError && <p className="text-red-500 text-sm">Enter a valid email</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login with Email"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}