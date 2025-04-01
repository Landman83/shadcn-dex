"use client"

import React from "react";
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

function ChartComponent() {
  const mostRecentValue = chartData[chartData.length - 1].desktop;
  const formattedValue = `$${(mostRecentValue / 1000).toFixed(1)}K`;

  return (
    <Card className="border-0 bg-transparent col-span-1 md:col-span-2">
      <CardHeader className="p-0">
        <CardTitle className="font-space-grotesk text-3xl flex items-baseline">
          Portfolio Value: <span className="ml-2">{formattedValue}</span>
        </CardTitle>
        <CardDescription className="mb-1">January - March 2024</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={chartConfig} className="!aspect-[4/1]">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 5,
              bottom: 0
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
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-sm p-0">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 12.3% this quarter <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing daily portfolio value for Jan-Mar 2024
        </div>
      </CardFooter>
    </Card>
  )
}

function MenuBar({ activeItem, setActiveItem }) {
  const menuItems = ["Equity", "Cash", "Transactions"];

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

// Update the equity data structure with new companies
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
  },
];

const cashData = [
  { id: "cash_1", account: "Main Account", type: "Checking", balance: "$25,000.00" },
  { id: "cash_2", account: "Savings", type: "High Yield", balance: "$50,000.00" },
  { id: "cash_3", account: "Reserve", type: "Money Market", balance: "$100,000.00" },
];

interface EquityItem {
  id: string
  symbol: string
  name: string
  marketCap: string
  price: string
  shares: string
  value: string
  pnl: string
}

function TableContent({ activeItem, onTradeClick }: { 
  activeItem: string, 
  onTradeClick: (item: EquityItem) => void 
}) {
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
                <TableCell className="text-right">
                  <button 
                    onClick={() => onTradeClick(item)}
                    className="px-3 py-1 text-base font-space-grotesk bg-[#111111] text-white rounded hover:bg-[#222222] transition-colors"
                  >
                    Trade
                  </button>
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

  const handleTradeClick = (item: EquityItem) => {
    setSelectedItem(item);
    setIsTradeSheetOpen(true);
  };

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
          <div className="grid grid-cols-1 gap-8">
            <ChartComponent />
            <div>
              <MenuBar activeItem={activeItem} setActiveItem={setActiveItem} />
              <TableContent 
                activeItem={activeItem} 
                onTradeClick={handleTradeClick}
              />
            </div>
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
