"use client"

import { ethers } from 'ethers';
import ClaimIssuerABIFile from '../abis/ClaimIssuer.json';

// Extract the actual ABI from the file
const ClaimIssuerABI = ClaimIssuerABIFile.abi;

export const getClaimIssuer = (provider: any) => {
  let issuerAddress = process.env.NEXT_PUBLIC_CLAIM_ISSUER_ADDRESS || '';
  
  if (!issuerAddress) {
    throw new Error('Claim Issuer address not configured');
  }
  
  // Make sure the address has 0x prefix
  if (!issuerAddress.startsWith('0x')) {
    issuerAddress = '0x' + issuerAddress;
  }
  
  return new ethers.Contract(
    issuerAddress,
    ClaimIssuerABI,
    provider
  );
};

export const isClaimValid = async (
  provider: any, 
  identityAddress: string, 
  claimTopic: number, 
  signature: string, 
  data: string
) => {
  try {
    const claimIssuer = getClaimIssuer(provider);
    return await claimIssuer.isClaimValid(
      identityAddress,
      claimTopic,
      signature,
      data
    );
  } catch (error) {
    console.error("Error checking claim validity:", error);
    return false;
  }
};

export const CLAIM_TOPICS = {
  KYC: 1,  // Example - adjust based on your actual claim topics
  ACCREDITED: 2
};