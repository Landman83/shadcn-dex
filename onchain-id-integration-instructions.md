# Expert Instructions for Integrating OnChain-ID with Magic.link in Next.js

## Context and Architecture Overview
You'll be integrating a decentralized identity system (OnChain-ID) with Magic.link authentication in a Next.js application. This will:
1. Allow users to authenticate with Magic.link (email/social)
2. Automatically deploy an Identity contract for each new user
3. Issue an accreditation claim to their Identity contract
4. Store the relationship between user accounts and their on-chain identity

## Step 1: Project Setup and Dependencies

Begin by installing the necessary dependencies:

```bash
npm install ethers@5.7.2 magic-sdk @magic-sdk/admin
```

Set up the required environment variables in `.env.local`:

```
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=your_magic_publishable_key
MAGIC_SECRET_KEY=your_magic_secret_key
CLAIM_ISSUER_ADDRESS=your_deployed_claim_issuer_address
CLAIM_ISSUER_PRIVATE_KEY=private_key_for_claim_issuer
ETHEREUM_RPC_URL=your_ethereum_rpc_url
```

## Step 2: Contract ABIs Setup

Create a directory for your contract ABIs:

```bash
mkdir -p src/abis
```

Create Identity ABI file at `src/abis/Identity.json` - extract the ABI from the OnChain-ID repository.
Create ClaimIssuer ABI file at `src/abis/ClaimIssuer.json` - extract the ABI from the OnChain-ID repository.

## Step 3: Magic.link Integration

Create a Magic.link client in `src/lib/magic.ts`:

```typescript
import { Magic } from 'magic-sdk';

const createMagic = () => {
  if (typeof window === 'undefined') return null;
  return new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY as string);
};

export const magic = createMagic();
```

Create a Magic.link admin client in `src/lib/magic-admin.ts`:

```typescript
import { Magic } from '@magic-sdk/admin';

export const magicAdmin = new Magic(process.env.MAGIC_SECRET_KEY as string);
```

## Step 4: Identity Service Implementation

Create an identity service at `src/services/identityService.ts`:

```typescript
import { ethers } from 'ethers';
import IdentityABI from '../abis/Identity.json';
import ClaimIssuerABI from '../abis/ClaimIssuer.json';

export async function deployIdentityForUser(userAddress: string) {
  // Load environment variables
  const CLAIM_ISSUER_ADDRESS = process.env.CLAIM_ISSUER_ADDRESS;
  const CLAIM_ISSUER_PRIVATE_KEY = process.env.CLAIM_ISSUER_PRIVATE_KEY;
  const RPC_URL = process.env.ETHEREUM_RPC_URL;
  
  if (!CLAIM_ISSUER_ADDRESS || !CLAIM_ISSUER_PRIVATE_KEY || !RPC_URL) {
    throw new Error('Missing required environment variables');
  }
  
  // Create provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(CLAIM_ISSUER_PRIVATE_KEY, provider);
  
  console.log(`Deploying identity for user address: ${userAddress}`);
  
  // Deploy identity contract
  const IdentityFactory = new ethers.ContractFactory(
    IdentityABI.abi,
    IdentityABI.bytecode,
    wallet
  );
  
  const identity = await IdentityFactory.deploy(userAddress, false);
  await identity.deployed();
  
  console.log(`Identity deployed at address: ${identity.address}`);
  
  // Now add accreditation claim
  const identityContract = new ethers.Contract(
    identity.address,
    IdentityABI.abi,
    wallet
  );
  
  // Create claim data
  const claimTopic = 1; // Accreditation topic
  const claimData = "0x"; // Any data for the claim
  
  // Create and sign claim
  const dataHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes'],
      [identity.address, claimTopic, claimData]
    )
  );
  
  // Sign the claim as the claim issuer
  const messageHashBytes = ethers.utils.arrayify(dataHash);
  const signature = await wallet.signMessage(messageHashBytes);
  
  console.log(`Adding accreditation claim to identity: ${identity.address}`);
  
  // Add claim to identity
  const tx = await identityContract.addClaim(
    claimTopic,
    1, // scheme
    CLAIM_ISSUER_ADDRESS,
    signature,
    claimData,
    "https://example.com/accreditation"
  );
  
  await tx.wait();
  
  console.log(`Accreditation claim added, transaction hash: ${tx.hash}`);
  
  return identity.address;
}

export async function verifyUserAccreditation(identityAddress: string) {
  const RPC_URL = process.env.ETHEREUM_RPC_URL;
  const CLAIM_ISSUER_ADDRESS = process.env.CLAIM_ISSUER_ADDRESS;
  
  if (!RPC_URL || !CLAIM_ISSUER_ADDRESS) {
    throw new Error('Missing required environment variables');
  }
  
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const identityContract = new ethers.Contract(
    identityAddress,
    IdentityABI.abi,
    provider
  );
  
  // Get claims of topic 1 (accreditation)
  const claimIds = await identityContract.getClaimIdsByTopic(1);
  
  // Check if any claim exists with our issuer
  for (const claimId of claimIds) {
    const claim = await identityContract.getClaim(claimId);
    if (claim.issuer.toLowerCase() === CLAIM_ISSUER_ADDRESS.toLowerCase()) {
      return true;
    }
  }
  
  return false;
}
```

## Step 5: Database Integration

Create a database service at `src/services/databaseService.ts` (using Prisma as an example):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUser(email: string, userAddress: string, identityAddress: string) {
  return prisma.user.create({
    data: {
      email,
      ethAddress: userAddress,
      identityAddress,
      isAccredited: true
    }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  });
}

export async function getUserByAddress(address: string) {
  return prisma.user.findUnique({
    where: { ethAddress: address }
  });
}
```

## Step 6: Authentication API Routes

Create the register API route at `src/pages/api/auth/register.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { magicAdmin } from '../../../lib/magic-admin';
import { deployIdentityForUser } from '../../../services/identityService';
import { createUser, getUserByEmail } from '../../../services/databaseService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, DIDToken } = req.body;
    
    if (!email || !DIDToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate Magic.link token
    try {
      magicAdmin.token.validate(DIDToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid DID token' });
    }
    
    // Get user metadata from Magic
    const metadata = await magicAdmin.users.getMetadataByToken(DIDToken);
    const userAddress = metadata.publicAddress;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'Could not retrieve user address' });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Deploy identity and add accreditation claim
    const identityAddress = await deployIdentityForUser(userAddress);
    
    // Create user in database
    await createUser(email, userAddress, identityAddress);
    
    return res.status(200).json({
      success: true,
      identityAddress
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to register user'
    });
  }
}
```

Create the login API route at `src/pages/api/auth/login.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { magicAdmin } from '../../../lib/magic-admin';
import { getUserByEmail } from '../../../services/databaseService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, DIDToken } = req.body;
    
    if (!email || !DIDToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate Magic.link token
    try {
      magicAdmin.token.validate(DIDToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid DID token' });
    }
    
    // Get user from database
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Set authentication cookie/session (implement based on your auth system)
    // Example with iron-session:
    // req.session.user = {
    //   id: user.id,
    //   email: user.email,
    //   identityAddress: user.identityAddress
    // };
    // await req.session.save();
    
    return res.status(200).json({
      success: true,
      user: {
        email: user.email,
        identityAddress: user.identityAddress,
        isAccredited: user.isAccredited
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to log in'
    });
  }
}
```

## Step 7: Frontend Registration Component

Create a registration component at `src/components/RegisterForm.tsx`:

```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { magic } from '../lib/magic';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Authenticate with Magic.link
      const didToken = await magic.auth.loginWithMagicLink({ email });
      
      // Get user metadata
      const metadata = await magic.user.getMetadata();
      
      console.log('Magic.link authentication successful', metadata);
      
      // Register user with our backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          DIDToken: didToken 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Registration successful, identity address:', data.identityAddress);
        // Registration successful, redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create an Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-sm font-medium">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
```

## Step 8: Frontend Login Component

Create a login component at `src/components/LoginForm.tsx`:

```tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { magic } from '../lib/magic';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Authenticate with Magic.link
      const didToken = await magic.auth.loginWithMagicLink({ email });
      
      // Login with our backend
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          DIDToken: didToken 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Login successful, redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Log In</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-sm font-medium">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
```

## Step 9: Create Authentication Pages

Create a registration page at `src/pages/register.tsx`:

```tsx
import RegisterForm from '../components/RegisterForm';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <RegisterForm />
    </div>
  );
}
```

Create a login page at `src/pages/login.tsx`:

```tsx
import LoginForm from '../components/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <LoginForm />
    </div>
  );
}
```

## Step 10: Protected Dashboard Page

Create a protected dashboard at `src/pages/dashboard.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { magic } from '../lib/magic';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const isLoggedIn = await magic.user.isLoggedIn();
        
        if (isLoggedIn) {
          const userData = await magic.user.getMetadata();
          
          // Fetch additional user data from your backend if needed
          const response = await fetch('/api/user/me');
          const data = await response.json();
          
          if (data.success) {
            setUser({
              ...userData,
              ...data.user
            });
          } else {
            throw new Error('Failed to get user data');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);
  
  const handleLogout = async () => {
    try {
      await magic.user.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">Your Identity Details</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Ethereum Address:</strong> {user?.publicAddress}</p>
          <p><strong>Identity Address:</strong> {user?.identityAddress}</p>
          <p><strong>Accreditation Status:</strong> {user?.isAccredited ? 'Accredited' : 'Not Accredited'}</p>
        </div>
        
        {/* Add your dashboard content here */}
      </div>
    </div>
  );
}
```

## Step 11: User API Route

Create a user API route at `src/pages/api/user/me.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { magicAdmin } from '../../../lib/magic-admin';
import { getUserByEmail } from '../../../services/databaseService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get DID token from Authorization header
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    const DIDToken = authorization.substring(7);
    
    // Validate Magic.link token
    try {
      const metadata = await magicAdmin.users.getMetadataByToken(DIDToken);
      
      // Get user from database
      const user = await getUserByEmail(metadata.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.status(200).json({
        success: true,
        user: {
          email: user.email,
          identityAddress: user.identityAddress,
          isAccredited: user.isAccredited
        }
      });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid DID token' });
    }
  } catch (error) {
    console.error('User data error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to get user data'
    });
  }
}
```

## Step 12: Testing and Deployment

1. Test locally using:
```bash
npm run dev
```

2. Initialize the ClaimIssuer contract before deployment (if not already done):
   - Deploy the ClaimIssuer contract to your target network
   - Store the address and private key in your environment variables
   - Ensure the ClaimIssuer has enough funds to deploy Identity contracts and issue claims

3. Deploy to your hosting provider (Vercel, Netlify, etc.)

## Troubleshooting

Common issues and solutions:
- **Gas price too high**: Adjust gas price in the provider configuration
- **Transaction failure**: Ensure the ClaimIssuer account has sufficient funds
- **Contract deployment issues**: Verify your contract ABIs are correct
- **Magic.link auth issues**: Check your Magic.link API keys and configuration
- **Claim validation failures**: Ensure your claim data and signatures are properly formatted

## Improvement Opportunities

After basic integration, consider:
1. Adding a gas estimation and confirmation step
2. Implementing a queue for identity deployments
3. Adding transaction monitoring and retry logic
4. Creating an admin dashboard to monitor identities and claims
5. Implementing a batch deployment option for multiple users

## Security Considerations

- Keep your ClaimIssuer private key secure
- Consider using a hardware wallet or KMS for production
- Implement rate limiting on your API routes
- Add thorough error handling and monitoring
- Consider gas price fluctuations in your deployment process