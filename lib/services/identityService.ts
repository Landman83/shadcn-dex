"use client"

import { Magic } from 'magic-sdk';
import { ethers } from 'ethers';
import { 
  createIdentity, 
  hasIdentity, 
  getIdentityAddress 
} from '../contracts/identityFactory';
import { 
  addClaim, 
  getClaimIdsByTopic, 
  getClaim 
} from '../contracts/identity';
import { CLAIM_TOPICS, isClaimValid } from '../contracts/claimIssuer';
import showToast from '../utils/showToast';

// Helper to get Magic provider
const getMagicProvider = (magic: Magic | null) => {
  if (!magic || !magic.rpcProvider) {
    throw new Error('Magic SDK not initialized');
  }
  
  // Convert Magic provider to ethers provider
  return new ethers.BrowserProvider(magic.rpcProvider as any);
};

// Helper to get Admin provider/signer for operations that need special permissions
const getAdminSigner = async (magic: Magic | null) => {
  if (!magic || !magic.rpcProvider) {
    throw new Error('Magic SDK not initialized');
  }
  
  // First get the provider from Magic
  const provider = new ethers.BrowserProvider(magic.rpcProvider as any);
  
  // Get the private key from .env.local
  const privateKey = process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('Admin private key not configured');
  }
  
  // Create a wallet with the private key
  const adminWallet = new ethers.Wallet(privateKey);
  
  // Connect the wallet to the provider
  return adminWallet.connect(provider);
};

// Ensure user has an identity, create one if not
export const ensureUserIdentity = async (magic: Magic | null, userAddress: string) => {
  try {
    console.log("Starting ensureUserIdentity for address:", userAddress);
    
    if (!magic) {
      console.error("Magic SDK not initialized");
      throw new Error('Magic SDK not initialized');
    }
    
    if (!userAddress) {
      console.error("User address is empty or undefined");
      throw new Error('User address is required');
    }
    
    console.log("Getting provider from Magic");
    const provider = getMagicProvider(magic);
    
    // Check if user already has an identity
    console.log("Checking if user has an existing identity");
    const hasExistingIdentity = await hasIdentity(provider, userAddress);
    console.log("Has existing identity:", hasExistingIdentity);
    
    if (!hasExistingIdentity) {
      // Create a new identity for the user
      console.log("Creating new identity for user using admin account");
      showToast({
        message: 'Creating your on-chain identity...',
        type: 'info'
      });
      
      try {
        // Get the admin signer
        console.log("Getting admin signer");
        const adminSigner = await getAdminSigner(magic);
        console.log("Admin signer address:", await adminSigner.getAddress());
        
        // Create identity using the admin signer
        const result = await createIdentity(adminSigner, userAddress);
        console.log("Identity creation result:", result);
        
        if (result.success) {
          showToast({
            message: 'Identity created successfully!',
            type: 'success'
          });
          return result.identityAddress;
        } else {
          console.error("Failed to create identity:", result.error);
          showToast({
            message: 'Failed to create identity: ' + (result.error?.message || 'Unknown error'),
            type: 'error'
          });
          
          // Show more detailed error info in the console for debugging
          if (result.error instanceof Error) {
            console.error("Error details:", {
              message: result.error.message,
              name: result.error.name,
              stack: result.error.stack
            });
          }
          
          return null;
        }
      } catch (createError) {
        console.error("Error in identity creation:", createError);
        
        // Provide better error information for debugging
        if (createError instanceof Error) {
          console.error("Error details:", {
            message: createError.message,
            name: createError.name,
            stack: createError.stack
          });
          
          // Check for common error types and give better user feedback
          if (createError.message.includes('private key')) {
            showToast({
              message: 'Admin account configuration error. Please contact support.',
              type: 'error'
            });
          } else if (createError.message.includes('gas')) {
            showToast({
              message: 'Transaction error: Insufficient gas or network issue.',
              type: 'error'
            });
          } else {
            showToast({
              message: 'Error creating identity: ' + createError.message,
              type: 'error'
            });
          }
        } else {
          showToast({
            message: 'Unknown error creating identity',
            type: 'error'
          });
        }
        
        return null;
      }
    } else {
      // User already has an identity, fetch its address
      console.log("Fetching existing identity address");
      const identityAddress = await getIdentityAddress(provider, userAddress);
      console.log("Fetched identity address:", identityAddress);
      return identityAddress;
    }
  } catch (error) {
    console.error("Error ensuring user identity:", error);
    showToast({
      message: 'Error with identity creation: ' + (error as Error).message,
      type: 'error'
    });
    return null;
  }
};

// Check if user has a specific claim (e.g., KYC)
export const checkUserClaim = async (
  magic: Magic | null, 
  identityAddress: string, 
  claimTopic: number
) => {
  try {
    if (!magic || !identityAddress) {
      return false;
    }
    
    console.log(`Checking claims for identity ${identityAddress} with topic ${claimTopic}`);
    
    // For testing/demo purposes, we'll use a simplified mock approach
    // In production, you would check the actual claims on-chain
    
    // Demo approach: Store KYC status in localStorage during testing
    const kycStatusKey = `kyc_status_${identityAddress}`;
    const storedStatus = localStorage.getItem(kycStatusKey);
    
    if (storedStatus === 'verified') {
      console.log("Found verified KYC status in local storage");
      return true;
    }
    
    // Try to get claims from the contract
    try {
      const provider = getMagicProvider(magic);
      
      // Get all claims for the specified topic
      console.log("Attempting to get claims by topic from contract");
      const claimIds = await getClaimIdsByTopic(provider, identityAddress, claimTopic);
      
      if (claimIds && claimIds.length > 0) {
        console.log(`Found ${claimIds.length} claims with topic ${claimTopic}`);
        return true;
      }
    } catch (error) {
      console.error("Error accessing claims from contract:", error);
      // Continue with mock implementation if contract call fails
    }
    
    console.log("No valid claims found");
    return false;
  } catch (error) {
    console.error("Error checking user claim:", error);
    return false;
  }
};

// Check if user has completed KYC
export const hasKycClaim = async (magic: Magic | null, identityAddress: string) => {
  return await checkUserClaim(magic, identityAddress, CLAIM_TOPICS.KYC);
};

// Request KYC verification (this would typically involve a backend call)
export const requestKycVerification = async (userAddress: string, identityAddress: string) => {
  try {
    // In a real implementation, this would call your backend API
    // which would then interact with the claim issuer contract
    
    console.log(`Requesting KYC verification for user ${userAddress} with identity ${identityAddress}`);
    
    // For demonstration, we'll just show a toast and use localStorage to "mock" the KYC process
    showToast({
      message: 'KYC verification requested. You will be notified when approved.',
      type: 'info'
    });
    
    // For testing purposes only: store the KYC status in localStorage
    const kycStatusKey = `kyc_status_${identityAddress}`;
    
    // Simulate a pending KYC request
    localStorage.setItem(kycStatusKey, 'pending');
    
    // Simulate a delayed approval (after 5 seconds)
    setTimeout(() => {
      console.log(`Approving KYC for identity ${identityAddress}`);
      localStorage.setItem(kycStatusKey, 'verified');
      
      // Show a toast to notify the user
      showToast({
        message: 'Your KYC verification has been approved!',
        type: 'success'
      });
    }, 5000);
    
    return true;
  } catch (error) {
    console.error("Error requesting KYC verification:", error);
    showToast({
      message: 'Error requesting KYC verification',
      type: 'error'
    });
    return false;
  }
};