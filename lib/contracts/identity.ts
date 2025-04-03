"use client"

import { ethers } from 'ethers';
import ClaimIssuerABIFile from '../abis/ClaimIssuer.json'; // We'll use this for the Identity interface too

// For local development, we'll define a proper Identity ABI
// This matches the structure of the Identity contract you shared
const IdentityABI = [
  // Key management
  "function getKey(bytes32 _key) external view returns(uint256[] memory purposes, uint256 keyType, bytes32 key)",
  "function getKeyPurposes(bytes32 _key) external view returns(uint256[] memory _purposes)",
  "function getKeysByPurpose(uint256 _purpose) external view returns(bytes32[] memory keys)",
  "function addKey(bytes32 _key, uint256 _purpose, uint256 _type) public returns (bool success)",
  "function removeKey(bytes32 _key, uint256 _purpose) public returns (bool success)",
  
  // Claims
  "function getClaimIdsByTopic(uint256 _topic) external view returns(bytes32[] memory claimIds)",
  "function addClaim(uint256 _topic, uint256 _scheme, address issuer, bytes memory _signature, bytes memory _data, string memory _uri) external returns (bytes32 claimRequestId)",
  "function getClaim(bytes32 _claimId) external view returns(uint256 topic, uint256 scheme, address issuer, bytes memory signature, bytes memory data, string memory uri)",
  "function isClaimValid(address _identity, uint256 claimTopic, bytes memory sig, bytes memory data) public view returns (bool claimValid)"
];

// The Identity contract is similar to ClaimIssuer in terms of interface
export const getIdentityContract = (provider: any, identityAddress: string) => {
  if (!identityAddress) {
    throw new Error('Identity address is required');
  }
  
  // Make sure the address has 0x prefix
  if (!identityAddress.startsWith('0x')) {
    identityAddress = '0x' + identityAddress;
  }
  
  return new ethers.Contract(
    identityAddress,
    IdentityABI, // Using the properly defined Identity ABI
    provider
  );
};

export const addClaim = async (
  provider: any,
  identityAddress: string,
  topic: number,
  scheme: number,
  issuer: string,
  signature: string,
  data: string,
  uri: string
) => {
  try {
    const identity = getIdentityContract(provider, identityAddress);
    const tx = await identity.addClaim(
      topic,
      scheme,
      issuer,
      signature,
      data,
      uri
    );
    await tx.wait();
    return { success: true, txHash: tx.hash };
  } catch (error) {
    console.error("Error adding claim:", error);
    return { success: false, error };
  }
};

export const getClaimIdsByTopic = async (provider: any, identityAddress: string, topic: number) => {
  try {
    const identity = getIdentityContract(provider, identityAddress);
    
    try {
      // First try the standard call
      const result = await identity.getClaimIdsByTopic(topic);
      return result;
    } catch (decodeError) {
      console.log("Decoding error with getClaimIdsByTopic, using fallback:", decodeError);
      
      // Handle the decoding error by using a lower-level call
      // This will bypass the ethers.js result decoding
      const rawResult = await provider.call({
        to: identityAddress,
        data: identity.interface.encodeFunctionData("getClaimIdsByTopic", [topic])
      });
      
      // If we get a non-empty result, try to parse it manually
      if (rawResult && rawResult !== '0x') {
        try {
          // Attempt to decode the raw result
          return identity.interface.decodeFunctionResult("getClaimIdsByTopic", rawResult);
        } catch (parseError) {
          console.error("Error parsing raw result:", parseError);
          // Fall back to empty array
          return [];
        }
      }
      
      // If we got here, there was no data, return empty array
      return [];
    }
  } catch (error) {
    console.error("Error getting claim IDs:", error);
    return [];
  }
};

export const getClaim = async (provider: any, identityAddress: string, claimId: string) => {
  try {
    const identity = getIdentityContract(provider, identityAddress);
    const claim = await identity.getClaim(claimId);
    return {
      topic: claim.topic.toNumber(),
      scheme: claim.scheme.toNumber(),
      issuer: claim.issuer,
      signature: claim.signature,
      data: claim.data,
      uri: claim.uri
    };
  } catch (error) {
    console.error("Error getting claim:", error);
    return null;
  }
};