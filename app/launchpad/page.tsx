"use client"

import React from "react"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

function MenuBar({ activeItem, setActiveItem }) {
  const menuItems = [
    "Summary",
    "Team",
    "Market",
    "Progress",
    "Offering Details",
    "Cap Table",
    "Financials",
    "Docs",
    "Media",
    "Discussion"
  ];

  return (
    <div className="flex overflow-x-auto border-b border-gray-700 no-scrollbar">
      <div className="flex space-x-6 min-w-min">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => setActiveItem(item)}
            className={`text-base font-medium pb-2 px-2 transition-colors duration-150 whitespace-nowrap
              ${
                activeItem === item
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-white"
              }
            `}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function TokenPurchaseCard() {
  const [usdcAmount, setUsdcAmount] = React.useState("");
  const [skytAmount, setSkytAmount] = React.useState("");
  
  const handleUsdcChange = (value: string) => {
    setUsdcAmount(value);
    if (value === "") {
      setSkytAmount("");
      return;
    }
    const skyt = (parseFloat(value) / 70).toFixed(2);
    setSkytAmount(skyt);
  };

  const handleSkytChange = (value: string) => {
    setSkytAmount(value);
    if (value === "") {
      setUsdcAmount("");
      return;
    }
    const usdc = (parseFloat(value) * 70).toFixed(2);
    setUsdcAmount(usdc);
  };

  return (
    <Card className="bg-[#0D0D0D] border-0 w-[300px]">
      <CardHeader>
        <CardTitle className="text-xl font-space-grotesk">Buy $SKYT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">USDC Amount</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={usdcAmount}
              onChange={(e) => handleUsdcChange(e.target.value)}
              className="bg-black/40 border-gray-800"
            />
            <div className="absolute right-3 top-2.5 text-sm text-gray-400">
              USDC
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm text-gray-400">SKYT Amount</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={skytAmount}
              onChange={(e) => handleSkytChange(e.target.value)}
              className="bg-black/40 border-gray-800"
            />
            <div className="absolute right-3 top-2.5 text-sm text-gray-400">
              SKYT
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <button className="w-full bg-white text-black py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
          Invest
        </button>
      </CardFooter>
    </Card>
  );
}

export default function LaunchpadPage() {
  const [activeItem, setActiveItem] = React.useState("Summary");
  const [timeRemaining, setTimeRemaining] = React.useState({
    days: 25,
    hours: 13,
    minutes: 42,
    seconds: 18
  });

  // Countdown timer effect
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hardCap = 5000000; // $5M
  const currentRaise = 3750000; // $3.75M
  const softCap = 2000000; // $2M
  
  const progress = (currentRaise / hardCap) * 100;
  const softCapPosition = (softCap / hardCap) * 100;

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="w-full flex justify-center">
        <div className="w-full max-w-6xl flex items-center justify-between">
          <div className="flex items-center">
            <div className="font-space-grotesk text-xl font-bold mr-12">
              numena
            </div>
            <NavigationMenu>
              <NavigationMenuList className="space-x-1">
                <NavigationMenuItem>
                  <Link href="/portfolio" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "hover:bg-gray-800 hover:text-white data-[active]:bg-gray-800"
                    )}>
                      Portfolio
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/launchpad" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "hover:bg-gray-800 hover:text-white data-[active]:bg-gray-800"
                    )}>
                      Launchpad
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/rewards" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "hover:bg-gray-800 hover:text-white data-[active]:bg-gray-800"
                    )}>
                      Rewards
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="hover:bg-gray-800 hover:text-white data-[state=open]:bg-gray-800">About</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 bg-gray-900 md:w-[400px] lg:w-[500px]">
                      <li>
                        <Link href="/about/team" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white">
                            <div className="text-sm font-medium leading-none">Our Team</div>
                            <p className="line-clamp-2 text-sm leading-snug text-gray-400">
                              Meet the people behind numena
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link href="/about/mission" legacyBehavior passHref>
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white">
                            <div className="text-sm font-medium leading-none">Our Mission</div>
                            <p className="line-clamp-2 text-sm leading-snug text-gray-400">
                              Learn about our values and goals
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <div className="relative w-64">
            <Input 
              type="search" 
              placeholder="Search..." 
              className="pr-10"
            />
            <svg 
              className="absolute right-3 top-3 h-4 w-4 text-gray-400" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </header>
      
      <main className="mt-8 w-full flex justify-center">
        <div className="w-full max-w-6xl">
          
          <div className="relative pt-6 pb-16">
            <div className="flex gap-8">
              <div className="flex-1 pr-16">
                <div className="mb-16">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl font-space-grotesk font-medium mb-1">Sky Technologies</h2>
                      <div className="flex items-center text-gray-400">
                        <span className="font-space-grotesk">SKYT - Series B</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-space-grotesk font-medium mb-1">
                        Equity Offering
                      </div>
                      <div className="text-sm font-space-grotesk">
                        <div className="text-green-400">Soft Cap Reached!</div>
                        <div className="text-white">62.5% to Hard Cap</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="relative">
                    <div 
                      className="text-sm font-space-grotesk"
                      style={{ 
                        position: 'absolute',
                        left: `${(progress)}%`,
                        transform: 'translateX(-50%)',
                        bottom: '100%',
                        marginBottom: '4px'
                      }}
                    >
                      <div className="text-green-400 text-center">$22.5M</div>
                      <div className="text-green-400 text-center">▼</div>
                    </div>

                    <Progress 
                      value={progress} 
                      className="h-2 bg-gray-800/50"
                      indicatorColor="#42FF97"
                    />

                    <div className="relative mt-2 text-sm text-gray-400 font-space-grotesk">
                      <div 
                        style={{ 
                          position: 'absolute',
                          left: `${(10/36 * 100)}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        $10M
                      </div>
                      <div 
                        className="absolute right-0"
                      >
                        $36M
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-8">
                    <div className="bg-[#0D0D0D] p-4 rounded-lg">
                      <div className="text-2xl font-space-grotesk">$70.00</div>
                      <div className="text-sm text-gray-400">Price per Share</div>
                    </div>
                    <div className="bg-[#0D0D0D] p-4 rounded-lg">
                      <div className="text-2xl font-space-grotesk">$144.5M</div>
                      <div className="text-sm text-gray-400">Valuation</div>
                    </div>
                    <div className="bg-[#0D0D0D] p-4 rounded-lg">
                      <div className="text-2xl font-space-grotesk">25</div>
                      <div className="text-sm text-gray-400">Investors</div>
                    </div>
                    <div className="bg-[#0D0D0D] p-4 rounded-lg">
                      <div className="text-2xl font-space-grotesk">$22.5M</div>
                      <div className="text-sm text-gray-400">Capital Raised</div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="text-sm text-gray-400 mb-2">Time Remaining:</div>
                    <div className="text-2xl font-space-grotesk">
                      {String(timeRemaining.days).padStart(2, '0')} : {String(timeRemaining.hours).padStart(2, '0')} : {String(timeRemaining.minutes).padStart(2, '0')} : {String(timeRemaining.seconds).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>
              <TokenPurchaseCard />
            </div>
          </div>

          <div>
            <MenuBar activeItem={activeItem} setActiveItem={setActiveItem} />
            <div className="mt-6">
              {/* Content for each tab will go here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
