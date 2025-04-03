"use client"

import { useIdentity } from "@/hooks/useIdentity"
import { Button } from "./button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card"
import { Badge } from "./badge"
import { Loader2, CheckCircle2, XCircle, Unlock, AlertTriangle } from "lucide-react"
import { ensureUserIdentity } from "@/lib/services/identityService"
import { useMagic } from "@/hooks/useMagic"
import { useState, useEffect } from "react"
import { Label } from "./label"

export function IdentityStatus() {
  const { loading, identityAddress, hasKyc, requestKyc, refreshKycStatus, userAddress } = useIdentity()
  const { magic } = useMagic()
  const [initializingIdentity, setInitializingIdentity] = useState(false)
  const [kycStatus, setKycStatus] = useState<string>('not-verified')
  const [kycRequestPending, setKycRequestPending] = useState(false)
  const [identityAddressState, setIdentityAddressState] = useState<string>("")

  // Check if there's a pending KYC request and poll for updates
  useEffect(() => {
    if (!identityAddress) return;
    
    // Check if KYC is pending in localStorage
    const kycStatusKey = `kyc_status_${identityAddress}`;
    const storedStatus = localStorage.getItem(kycStatusKey);
    
    if (storedStatus === 'pending') {
      setKycRequestPending(true);
      
      // Set up a polling interval to check for KYC updates
      const interval = setInterval(async () => {
        console.log("Polling for KYC status updates...");
        const currentStatus = localStorage.getItem(kycStatusKey);
        
        if (currentStatus === 'verified') {
          setKycRequestPending(false);
          await refreshKycStatus();
          clearInterval(interval);
        }
      }, 2000);
      
      // Clean up interval on unmount
      return () => clearInterval(interval);
    } else if (storedStatus === 'verified') {
      // Make sure our component state reflects the verified status
      refreshKycStatus();
    }
  }, [identityAddress, refreshKycStatus]);

  const handleRequestKyc = async () => {
    setKycRequestPending(true);
    await requestKyc();
    
    // Set up polling to check for updates
    const pollInterval = setInterval(async () => {
      const updated = await refreshKycStatus();
      if (updated) {
        setKycRequestPending(false);
        clearInterval(pollInterval);
      }
    }, 2000);
    
    // Clean up after 30 seconds if verification hasn't completed
    setTimeout(() => {
      clearInterval(pollInterval);
      setKycRequestPending(false);
    }, 30000);
  }

  const handleInitializeIdentity = async () => {
    if (!magic || !userAddress) return
    
    setInitializingIdentity(true)
    try {
      await ensureUserIdentity(magic, userAddress)
      // Refresh the page to see the new identity
      window.location.reload()
    } catch (error) {
      console.error("Error initializing identity:", error)
    } finally {
      setInitializingIdentity(false)
    }
  }

  if (loading || initializingIdentity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identity Status</CardTitle>
          <CardDescription>
            {initializingIdentity ? 'Initializing your blockchain identity' : 'Checking your blockchain identity'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // If no identity address is found, show initialization option
  if (!identityAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identity Status</CardTitle>
          <CardDescription>Your on-chain identity needs to be initialized</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-500/20 p-4 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Identity Not Initialized</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your on-chain identity needs to be created before you can use platform features.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleInitializeIdentity} className="w-full">
            <Unlock className="h-4 w-4 mr-2" /> Initialize Identity
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label>Identity Address:</Label>
            <div className="mt-1 p-2 bg-black/20 rounded text-sm font-mono">
              {identityAddress || "Not created"}
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-1">KYC Status:</div>
            <div className="flex items-center space-x-2">
              {hasKyc ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified
                </Badge>
              ) : kycRequestPending ? (
                <Badge className="bg-blue-500">
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Pending
                </Badge>
              ) : (
                <Badge className="bg-amber-500">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Not Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {!hasKyc && !kycRequestPending && (
          <Button onClick={handleRequestKyc} className="w-full">
            <Unlock className="h-4 w-4 mr-2" /> Request KYC Verification
          </Button>
        )}
        {kycRequestPending && (
          <Button disabled className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verification in Progress...
          </Button>
        )}
        {hasKyc && (
          <Button variant="secondary" onClick={refreshKycStatus} className="w-full">
            Refresh KYC Status
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// Update the hook to use useIdentity
export function useIdentityAddress() {
  const { identityAddress } = useIdentity()
  return identityAddress || ""
}