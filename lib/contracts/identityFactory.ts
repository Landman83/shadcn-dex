"use client"

import { ethers } from 'ethers';
import IDFactoryABIFile from '../abis/IDFactory.json';

// Define the IDFactory ABI based on the actual deployed contract
const IDFactoryABI = [
  // Factory functions for creating and managing identities
  "function createIdentity(address _wallet, string memory _salt) external returns (address)",
  "function getIdentity(address _wallet) external view returns (address)",
  "function isSaltTaken(string calldata _salt) external view returns (bool)",
  "function owner() external view returns (address)"
];

export const getIdentityFactory = (provider: any) => {
  let factoryAddress = process.env.NEXT_PUBLIC_IDENTITY_FACTORY_ADDRESS || '';
  
  if (!factoryAddress) {
    throw new Error('Identity Factory address not configured');
  }
  
  // Make sure the address has 0x prefix
  if (!factoryAddress.startsWith('0x')) {
    factoryAddress = '0x' + factoryAddress;
  }
  
  return new ethers.Contract(
    factoryAddress,
    IDFactoryABI,
    provider
  );
};

export const createIdentity = async (providerOrSigner: any, userAddress: string) => {
  try {
    console.log(`Attempting to create identity for user ${userAddress} on Polygon Amoy`);
    
    // Check if providerOrSigner is a Wallet (admin signer)
    let adminSigner;
    if (providerOrSigner instanceof ethers.Wallet) {
      adminSigner = providerOrSigner;
      console.log("Using provided admin wallet signer:", await adminSigner.getAddress());
    } else {
      // If not, try to get a signer from the provider
      try {
        adminSigner = await providerOrSigner.getSigner();
        console.log("Got signer from provider:", await adminSigner.getAddress());
      } catch (signerError) {
        console.error("No signer available from provider:", signerError);
        throw new Error('Admin signer is required to create identities');
      }
    }
    
    // Get the factory contract with the admin signer
    const factory = getIdentityFactory(adminSigner);
    const factoryAddress = await factory.getAddress();
    console.log(`Using identity factory at ${factoryAddress}`);
    
    // Verify that the admin account is the owner of the contract
    try {
      const contractOwner = await factory.owner();
      const signerAddress = await adminSigner.getAddress();
      
      console.log(`Contract owner: ${contractOwner}`);
      console.log(`Admin signer: ${signerAddress}`);
      
      if (contractOwner.toLowerCase() !== signerAddress.toLowerCase()) {
        console.error(`Admin account ${signerAddress} is not the owner of the factory contract. Owner is ${contractOwner}`);
        throw new Error('Admin account is not the owner of the factory contract');
      } else {
        console.log("Admin account confirmed as contract owner - authorized to create identities");
      }
    } catch (ownerError) {
      console.warn("Couldn't verify contract ownership:", ownerError);
      // Continue anyway, the transaction will revert if not owner
    }
    
    // Generate a unique salt first since we need it for gas estimation
    let salt = `${userAddress.slice(2, 10)}_${Date.now()}`;
    console.log(`Generated salt: ${salt}`);
    
    // Check if salt is already taken
    try {
      const isSaltTaken = await factory.isSaltTaken(salt);
      if (isSaltTaken) {
        console.log(`Salt ${salt} is already taken, generating a new one`);
        // If taken, modify the salt slightly
        const newSalt = `${salt}_${Math.floor(Math.random() * 1000)}`;
        console.log(`New salt: ${newSalt}`);
        salt = newSalt;
      }
    } catch (saltCheckError) {
      console.warn("Couldn't check if salt is taken:", saltCheckError);
      // Continue anyway - the transaction will revert if the salt is taken
    }
    
    // Estimate gas to see if the transaction would succeed
    try {
      console.log(`Estimating gas for createIdentity(${userAddress}, "${salt}")`);
      const gasEstimate = await factory.createIdentity.estimateGas(userAddress, salt);
      console.log(`Gas estimate: ${gasEstimate}`);
    } catch (gasError) {
      console.warn("Gas estimation failed - transaction may fail:", gasError);
      // Continue anyway - sometimes gas estimation fails but transaction succeeds
    }
    
    // Send the transaction with higher gas limit to be safe
    console.log(`Calling createIdentity(${userAddress}, "${salt}") from ${await adminSigner.getAddress()}`);
    const tx = await factory.createIdentity(userAddress, salt, {
      gasLimit: 1000000 // Set a high gas limit to be safe
    });
    console.log("Transaction sent:", tx.hash);
    
    // Wait for the transaction to be confirmed
    console.log("Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);
    
    // After creation, fetch the identity address for the user
    console.log("Fetching identity address after creation");
    const provider = adminSigner.provider;
    const identityAddress = await getIdentityAddress(provider, userAddress);
    
    if (!identityAddress) {
      throw new Error("Created identity but couldn't retrieve its address");
    }
    
    console.log(`Identity created at address: ${identityAddress}`);
    
    return {
      success: true,
      identityAddress,
      txHash: tx.hash
    };
  } catch (error) {
    console.error("Error creating identity:", error);
    
    // For this demo, if identity creation fails, check if the user already has an identity
    // This is a fallback in case the hasIdentity check failed earlier
    try {
      console.log("Checking if user already has an identity despite creation failure");
      const provider = providerOrSigner instanceof ethers.Wallet ? 
        providerOrSigner.provider : providerOrSigner;
        
      const maybeIdentity = await getIdentityAddress(provider, userAddress);
      if (maybeIdentity && maybeIdentity !== ethers.ZeroAddress) {
        console.log("User already has an identity, retrieving it:", maybeIdentity);
        return {
          success: true,
          identityAddress: maybeIdentity,
          txHash: "",
          note: "Used existing identity"
        };
      }
    } catch (fallbackError) {
      console.error("Fallback check also failed:", fallbackError);
    }
    
    return {
      success: false,
      error
    };
  }
};

export const hasIdentity = async (provider: any, userAddress: string) => {
  try {
    console.log(`Checking if user ${userAddress} has an identity on Polygon Amoy`);
    const factory = getIdentityFactory(provider);
    
    console.log(`Using factory contract at ${await factory.getAddress()}`);
    
    // Try a low-level call first to avoid decoding issues
    try {
      const data = factory.interface.encodeFunctionData("getIdentity", [userAddress]);
      console.log("Encoded function data:", data);
      
      const rawResult = await provider.call({
        to: await factory.getAddress(),
        data
      });
      console.log("Raw result from getIdentity:", rawResult);
      
      if (rawResult && rawResult !== '0x') {
        // Try to decode the result manually
        const decodedResult = factory.interface.decodeFunctionResult("getIdentity", rawResult);
        console.log("Decoded result:", decodedResult);
        
        const identityAddress = decodedResult[0]; // First return value
        console.log("Identity address from decode:", identityAddress);
        
        return identityAddress && identityAddress !== ethers.ZeroAddress;
      }
      
      return false; // No result means no identity
    } catch (lowLevelError) {
      console.warn("Low-level call failed, trying standard method:", lowLevelError);
      
      // Fall back to standard method
      const identityAddress = await factory.getIdentity(userAddress);
      console.log("Identity address from standard call:", identityAddress);
      
      return identityAddress && identityAddress !== ethers.ZeroAddress;
    }
  } catch (error) {
    console.error("Error checking if user has identity:", error);
    // If we get an error, assume the user doesn't have an identity yet
    return false;
  }
};

export const getIdentityAddress = async (provider: any, userAddress: string) => {
  try {
    console.log(`Getting identity address for user ${userAddress}`);
    const factory = getIdentityFactory(provider);
    
    // Try a low-level call first to avoid decoding issues
    try {
      const data = factory.interface.encodeFunctionData("getIdentity", [userAddress]);
      
      const rawResult = await provider.call({
        to: await factory.getAddress(),
        data
      });
      console.log("Raw result from getIdentity for address:", rawResult);
      
      if (rawResult && rawResult !== '0x') {
        // Try to decode the result manually
        const decodedResult = factory.interface.decodeFunctionResult("getIdentity", rawResult);
        const identityAddress = decodedResult[0]; // First return value
        console.log(`Found identity address: ${identityAddress}`);
        return identityAddress;
      }
      
      console.log("No identity found using low-level call");
      return null;
    } catch (lowLevelError) {
      console.warn("Low-level call failed, trying standard method:", lowLevelError);
      
      // Fall back to standard method
      const identityAddress = await factory.getIdentity(userAddress);
      console.log(`Found identity address via standard call: ${identityAddress}`);
      return identityAddress;
    }
  } catch (error) {
    console.error("Error getting identity address:", error);
    return null;
  }
};