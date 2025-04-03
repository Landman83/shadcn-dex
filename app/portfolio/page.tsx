"use client"

import React from "react";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TradeSheet } from "@/components/ui/trade-sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IdentityStatus, useIdentityAddress } from "@/components/ui/identity-status"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Generate 3 months of daily data with upward trend in hundreds of thousands
const generateDailyData = () => {
  const data = [];
  const startDate = new Date(2024, 0, 1); // Jan 1, 2024
  const endDate = new Date(2024, 3, 0); // Mar 31, 2024
  
  let baseValue = 350000; // Start at $350K
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Add more significant randomness but maintain upward trend
    const randomFactor = Math.random() * 15000 - 6000; // Random between -$6K and +$9K
    baseValue += randomFactor;
    
    // Ensure value doesn't go below $300K
    if (baseValue < 300000) baseValue = 300000;
    
    // Add weekly growth factor to create upward trend
    baseValue += 1200; // About $1.2K daily growth on average
    
    data.push({
      date: new Date(currentDate).toISOString().split('T')[0],
      value: Math.round(baseValue)
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return data;
};

const dailyData = generateDailyData();

// Format data for daily display instead of monthly averages
const chartData = dailyData.map(item => ({
  date: item.date,
  desktop: item.value
}));

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "white",
  },
} satisfies ChartConfig

// Add these near the top with other data structures
const accountStats = {
  portfolioValue: "$589.3K",
  cash: "$175.0K",
  performance24h: "+2.1%",
  performance30d: "+12.3%",
  annualizedReturn: "+31.5%"
};

// Add open orders data structure
const openOrdersData = [
  { 
    id: "order_1", 
    symbol: "SKYT",
    type: "Limit Buy",
    price: "$83.50",
    shares: "500",
    value: "$41,750.00",
    date: "2024-03-29",
    status: "Open"
  },
  { 
    id: "order_2", 
    symbol: "NMA",
    type: "Limit Sell",
    price: "$39.00",
    shares: "1000",
    value: "$39,000.00",
    date: "2024-03-28",
    status: "Open"
  }
];

function ChartComponent() {
  const [timeframe, setTimeframe] = React.useState<"1D" | "7D" | "1M" | "3M" | "1Y" | "MAX">("3M");
  const mostRecentValue = chartData[chartData.length - 1].desktop;
  const formattedValue = `$${(mostRecentValue / 1000).toFixed(1)}K`;

  return (
    <Card className="border-0 bg-transparent col-span-1 md:col-span-2">
      <CardContent className="p-0">
        <div className="relative">
          <ChartContainer config={chartConfig} className="!aspect-[4/1]">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 5,
                bottom: 40  // Increased bottom margin to make room for tabs
              }}
              height={60}
            >
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
                stroke="rgba(255,255,255,0.5)"
                interval={14}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey="desktop"
                type="natural"
                stroke="white"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
          
          {/* Timeframe selector positioned absolutely */}
          <div className="absolute bottom-0 right-0">
            <Tabs value={timeframe} onValueChange={(value: any) => setTimeframe(value)} className="w-fit">
              <TabsList className="bg-[#111111]">
                <TabsTrigger value="1D">1D</TabsTrigger>
                <TabsTrigger value="7D">7D</TabsTrigger>
                <TabsTrigger value="1M">1M</TabsTrigger>
                <TabsTrigger value="3M">3M</TabsTrigger>
                <TabsTrigger value="1Y">1Y</TabsTrigger>
                <TabsTrigger value="MAX">MAX</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MenuBarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

function MenuBar({ activeItem, setActiveItem }: MenuBarProps) {
  const menuItems = ["Equity", "Cash", "Open Orders", "Transactions"];

  return (
    <div className="flex space-x-8 border-b border-gray-700">
      {menuItems.map((item) => (
        <button
          key={item}
          onClick={() => setActiveItem(item)}
          className={`text-xl font-medium pb-2 px-3 transition-colors duration-150
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
  );
}

// Update the equity data structure to include status
const equityData = [
  { 
    id: "eq_1", 
    symbol: "SKYT",
    name: "Sky Technologies", 
    marketCap: "$8.4B",
    price: "$84.25",
    shares: "1200",
    value: "$101,100.00",
    pnl: "+21.3%",
    status: "Locked"
  },
  { 
    id: "eq_2", 
    symbol: "LOLO",
    name: "Lonesome Logistics", 
    marketCap: "$5.2B",
    price: "$52.50",
    shares: "850",
    value: "$44,625.00",
    pnl: "+12.1%",
    status: "Tradeable"
  },
  { 
    id: "eq_3", 
    symbol: "NMA",
    name: "Numena Technologies", 
    marketCap: "$3.8B",
    price: "$38.25",
    shares: "2500",
    value: "$95,625.00",
    pnl: "+28.5%",
    status: "Tradeable"
  },
];

const cashData = [
  { id: "cash_1", account: "Main Account", type: "Checking", balance: "$25,000.00" },
  { id: "cash_2", account: "Savings", type: "High Yield", balance: "$50,000.00" },
  { id: "cash_3", account: "Reserve", type: "Money Market", balance: "$100,000.00" },
];

// Update the EquityItem interface
interface EquityItem {
  id: string
  symbol: string
  name: string
  marketCap: string
  price: string
  shares: string
  value: string
  pnl: string
  status: "Locked" | "Tradeable"
}

// Add this interface above the TableContent component
interface TableContentProps {
  activeItem: string;
  onTradeClick: (item: EquityItem) => void;
}

function TableContent({ activeItem, onTradeClick }: TableContentProps) {
  switch (activeItem) {
    case "Equity":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base font-space-grotesk">Symbol</TableHead>
              <TableHead className="text-base font-space-grotesk">Name</TableHead>
              <TableHead className="text-base font-space-grotesk">Market Cap</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Price</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Shares</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Value</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">P&L</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equityData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-base font-space-grotesk">{item.symbol}</TableCell>
                <TableCell className="text-base font-space-grotesk">{item.name}</TableCell>
                <TableCell className="text-base font-space-grotesk">{item.marketCap}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{item.price}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{item.shares}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{item.value}</TableCell>
                <TableCell className={`text-base font-space-grotesk text-right ${
                  item.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.pnl}
                </TableCell>
                <TableCell className="text-base font-space-grotesk text-right text-gray-400">
                  {item.status}
                </TableCell>
                <TableCell className="text-right">
                  {item.status === "Tradeable" && (
                    <button 
                      onClick={() => onTradeClick(item)}
                      className="px-3 py-1 text-base font-space-grotesk bg-[#111111] text-white rounded hover:bg-[#222222] transition-colors"
                    >
                      Trade
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

    case "Cash":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base font-space-grotesk">Account</TableHead>
              <TableHead className="text-base font-space-grotesk">Type</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-base font-space-grotesk">{item.account}</TableCell>
                <TableCell className="text-base font-space-grotesk">{item.type}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{item.balance}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

    case "Open Orders":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-base font-space-grotesk">Symbol</TableHead>
              <TableHead className="text-base font-space-grotesk">Type</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Price</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Shares</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Value</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Date</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openOrdersData.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium text-base font-space-grotesk">{order.symbol}</TableCell>
                <TableCell className={`text-base font-space-grotesk ${
                  order.type.includes('Buy') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {order.type}
                </TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{order.price}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{order.shares}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{order.value}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right">{order.date}</TableCell>
                <TableCell className="text-base font-space-grotesk text-right text-gray-400">{order.status}</TableCell>
                <TableCell className="text-right">
                  <button 
                    onClick={() => {/* Add cancel order handler */}}
                    className="px-3 py-1 text-base font-space-grotesk bg-[#111111] text-white rounded hover:bg-[#222222] transition-colors"
                  >
                    Cancel
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

    case "Transactions":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-base font-space-grotesk">Date</TableHead>
              <TableHead className="text-base font-space-grotesk">Type</TableHead>
              <TableHead className="text-base font-space-grotesk">Asset</TableHead>
              <TableHead className="text-base font-space-grotesk text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell className="font-medium text-base font-space-grotesk">{txn.date}</TableCell>
                <TableCell className="text-base font-space-grotesk">{txn.type}</TableCell>
                <TableCell className="text-base font-space-grotesk">{txn.asset}</TableCell>
                <TableCell className={`text-base font-space-grotesk text-right ${txn.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {txn.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );

    default:
      return null;
  }
}

// Update transaction data with new companies
const transactions = [
  { id: "txn_1", date: "2024-03-28", type: "Buy", asset: "NMA", amount: "-$38,250.00" },
  { id: "txn_2", date: "2024-03-25", type: "Sell", asset: "SKYT", amount: "+$25,275.00" },
  { id: "txn_3", date: "2024-03-22", type: "Dividend", asset: "LOLO", amount: "+$425.00" },
  { id: "txn_4", date: "2024-03-20", type: "Deposit", asset: "Cash", amount: "+$50,000.00" },
  { id: "txn_5", date: "2024-03-15", type: "Buy", asset: "LOLO", amount: "-$26,250.00" },
];

export default function Home() {
  const [activeItem, setActiveItem] = React.useState("Equity");
  const [isTradeSheetOpen, setIsTradeSheetOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<EquityItem | null>(null);
  const identityAddress = useIdentityAddress()

  const handleTradeClick = (item: EquityItem) => {
    setSelectedItem(item);
    setIsTradeSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <ToastContainer />
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
          <div className="mb-4">
            <h1 className="text-2xl font-medium">
              Hello, Rankin
            </h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              Address: {identityAddress ? (
                `${identityAddress.slice(0, 4)}...${identityAddress.slice(-4)}`
              ) : (
                <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Account Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-[#111111] rounded-lg p-4 md:col-span-1">
                <div className="text-2xl font-medium">
                  {accountStats.portfolioValue}
                </div>
                <div className="text-sm text-gray-400">
                  Portfolio Value
                </div>
              </div>
              <div className="bg-[#111111] rounded-lg p-4 md:col-span-1">
                <div className="text-2xl font-medium">
                  {accountStats.cash}
                </div>
                <div className="text-sm text-gray-400">
                  Cash
                </div>
              </div>
              <div className="bg-[#111111] rounded-lg p-4 md:col-span-1">
                <div className="text-2xl font-medium text-green-400">
                  {accountStats.performance24h}
                </div>
                <div className="text-sm text-gray-400">
                  24h Performance
                </div>
              </div>
              <div className="bg-[#111111] rounded-lg p-4 md:col-span-1">
                <div className="text-2xl font-medium text-green-400">
                  {accountStats.performance30d}
                </div>
                <div className="text-sm text-gray-400">
                  30D Performance
                </div>
              </div>
              <div className="bg-[#111111] rounded-lg p-4 md:col-span-1">
                <div className="text-2xl font-medium text-green-400">
                  {accountStats.annualizedReturn}
                </div>
                <div className="text-sm text-gray-400">
                  Annualized Return
                </div>
              </div>
            </div>

            <ChartComponent />
            <div>
              <MenuBar activeItem={activeItem} setActiveItem={setActiveItem} />
              <TableContent 
                activeItem={activeItem} 
                onTradeClick={handleTradeClick}
              />
            </div>
          </div>

          {/* KYC Status moved outside the grid */}
          <div className="mt-8">
            <IdentityStatus />
          </div>

          {selectedItem && (
            <TradeSheet
              isOpen={isTradeSheetOpen}
              onClose={() => {
                setIsTradeSheetOpen(false);
                setSelectedItem(null);
              }}
              symbol={selectedItem.symbol}
              currentPrice={parseFloat(selectedItem.price.replace('$', ''))}
              currentShares={parseInt(selectedItem.shares.replace(',', ''))}
            />
          )}
        </div>
      </main>
    </div>
  );
}
