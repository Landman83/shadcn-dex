"use client"

import { useState, useEffect } from "react";
import { useMagic } from "./useMagic";
import { 
  ensureUserIdentity, 
  hasKycClaim,
  requestKycVerification 
} from "@/lib/services/identityService";
import showToast from "@/lib/utils/showToast";

export function useIdentity() {
  const [loading, setLoading] = useState(true);
  const [identityAddress, setIdentityAddress] = useState<string | null>(null);
  const [hasKyc, setHasKyc] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const { magic } = useMagic();

  // Get the user's blockchain address
  const getUserAddress = async () => {
    if (!magic || !magic.user) return null;
    
    try {
      // Get user metadata from Magic
      const metadata = await magic.user.getInfo();
      return metadata.publicAddress;
    } catch (error) {
      console.error("Error getting user address:", error);
      return null;
    }
  };

  // Initialize identity and check KYC status
  const initIdentity = async () => {
    setLoading(true);
    
    try {
      // Check if Magic SDK is initialized and user is logged in
      if (magic && magic.user && await magic.user.isLoggedIn()) {
        // Get user's blockchain address
        const address = await getUserAddress();
        setUserAddress(address);
        
        if (address) {
          // Ensure user has an on-chain identity
          const identityAddr = await ensureUserIdentity(magic, address);
          setIdentityAddress(identityAddr);
          
          // Check if the user has KYC
          if (identityAddr) {
            const kycStatus = await hasKycClaim(magic, identityAddr);
            setHasKyc(kycStatus);
          }
        }
      }
    } catch (error) {
      console.error("Error initializing identity:", error);
      showToast({
        message: 'Error initializing identity',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Request KYC verification
  const requestKyc = async () => {
    if (!userAddress || !identityAddress) {
      showToast({
        message: 'Cannot request KYC. Identity not initialized.',
        type: 'error'
      });
      return false;
    }
    
    return await requestKycVerification(userAddress, identityAddress);
  };

  // Refresh KYC status
  const refreshKycStatus = async () => {
    if (!magic || !identityAddress) return false;
    
    try {
      // First check localStorage (for our mock implementation)
      const kycStatusKey = `kyc_status_${identityAddress}`;
      const storedStatus = localStorage.getItem(kycStatusKey);
      
      if (storedStatus === 'verified') {
        console.log("KYC is verified in localStorage");
        setHasKyc(true);
        return true;
      }
      
      // If nothing in localStorage, try the contract
      try {
        const kycStatus = await hasKycClaim(magic, identityAddress);
        setHasKyc(kycStatus);
        return kycStatus;
      } catch (contractError) {
        console.error("Error checking KYC with contract:", contractError);
        // Continue with localStorage only
        return storedStatus === 'verified';
      }
    } catch (error) {
      console.error("Error refreshing KYC status:", error);
      return false;
    }
  };

  // Initialize on component mount and when magic changes
  useEffect(() => {
    initIdentity();
  }, [magic]);

  return { 
    loading, 
    identityAddress, 
    hasKyc, 
    userAddress,
    requestKyc,
    refreshKycStatus
  };
}