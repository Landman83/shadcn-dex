"use client"

import React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "@/components/ui/menubar"

interface TradeSheetProps {
  isOpen: boolean
  onClose: () => void
  symbol: string
  currentPrice: number
  currentShares?: number
}

type TabType = "buy" | "sell" | "book" | "trades";

export function TradeSheet({ isOpen, onClose, symbol, currentPrice, currentShares = 0 }: TradeSheetProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("buy")
  const [orderType, setOrderType] = React.useState<"market" | "limit">("market")
  const [shares, setShares] = React.useState("")
  const [limitPrice, setLimitPrice] = React.useState("")

  // Mock data for order book
  const orderBook = {
    sells: [
      { price: currentPrice + 0.50, size: 500 },
      { price: currentPrice + 0.25, size: 1200 },
      { price: currentPrice + 0.10, size: 800 },
    ],
    buys: [
      { price: currentPrice - 0.10, size: 1000 },
      { price: currentPrice - 0.25, size: 1500 },
      { price: currentPrice - 0.50, size: 700 },
    ]
  }

  // Mock data for recent trades
  const recentTrades = [
    { side: "buy", size: 500, price: 84.25, timestamp: Date.now() - 30000 },
    { side: "sell", size: 1200, price: 84.20, timestamp: Date.now() - 60000 },
    { side: "buy", size: 300, price: 84.15, timestamp: Date.now() - 90000 },
    { side: "sell", size: 800, price: 84.30, timestamp: Date.now() - 120000 },
  ]

  const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '')
    if (value) {
      const formattedValue = new Intl.NumberFormat('en-US').format(parseInt(value))
      setShares(formattedValue)
    } else {
      setShares('')
    }
  }

  const calculateTotalValue = () => {
    const numShares = Number(shares.replace(/,/g, ''))
    const price = orderType === "market" ? currentPrice : Number(limitPrice)
    return numShares * price
  }

  const calculateFees = () => {
    return calculateTotalValue() * 0.001 // 0.1% fee
  }

  const calculateTotal = () => {
    return calculateTotalValue() + calculateFees()
  }

  const handleSubmit = async () => {
    // Handle trade submission
    console.log("Trade submitted:", {
      type: activeTab,
      orderType,
      shares,
      price: orderType === "market" ? currentPrice : limitPrice
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="p-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl font-space-grotesk text-left italic">Trade {symbol}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-8">
          {/* Buy/Sell/Book/Trades Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as TabType)} 
            className="w-full"
          >
            <TabsList className="w-full bg-[#111111]">
              <TabsTrigger 
                value="buy"
                className={cn(
                  "flex-1",
                  activeTab === "buy" ? "bg-green-500 text-white" : "text-gray-400"
                )}
              >
                Buy
              </TabsTrigger>
              <TabsTrigger 
                value="sell"
                className={cn(
                  "flex-1",
                  activeTab === "sell" ? "bg-red-500 text-white" : "text-gray-400"
                )}
              >
                Sell
              </TabsTrigger>
              <TabsTrigger 
                value="book"
                className={cn(
                  "flex-1",
                  activeTab === "book" ? "bg-white text-white" : "text-gray-400"
                )}
              >
                Book
              </TabsTrigger>
              <TabsTrigger 
                value="trades"
                className={cn(
                  "flex-1",
                  activeTab === "trades" ? "bg-white text-white" : "text-gray-400"
                )}
              >
                Trades
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Content based on active tab */}
          {(activeTab === "buy" || activeTab === "sell") && (
            <>
              {/* Order Type Menu */}
              <div className="flex space-x-8 border-b border-gray-800">
                {["Market", "Limit"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type.toLowerCase() as "market" | "limit")}
                    className={`text-base font-medium pb-2 px-3 transition-colors duration-150
                      ${
                        orderType === type.toLowerCase()
                        ? "text-white border-b-2 border-white"
                        : "text-gray-400 hover:text-white"
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Market Price Display */}
              <div>
                <div className="text-sm text-gray-400 mb-2">Market Price</div>
                <div className="text-2xl font-space-grotesk">
                  ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Share Input */}
              <div>
                <div className="text-sm text-gray-400 mb-3">Number of Shares</div>
                <Input
                  type="text"
                  placeholder="0"
                  value={shares}
                  onChange={handleShareChange}
                  className="text-xl bg-[#111111] border-gray-800 text-right py-6"
                />
                {currentShares > 0 && (
                  <div className="text-sm text-gray-400 mt-2">
                    Current Position: {currentShares.toLocaleString()} shares
                  </div>
                )}
              </div>

              {/* Limit Price Input */}
              {orderType === "limit" && (
                <div>
                  <div className="text-sm text-gray-400 mb-3">Limit Price</div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="text-xl bg-[#111111] border-gray-800 text-right py-6"
                  />
                </div>
              )}

              {/* Trade Summary */}
              {shares && (
                <div className="bg-[#111111] rounded-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">Position</span>
                    <span className="font-space-grotesk">
                      {currentShares.toLocaleString()} shares
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">Fees (0.1%)</span>
                    <span className="font-space-grotesk">
                      ${calculateFees().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-gray-400">Total</span>
                    <span className="font-space-grotesk">
                      ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!shares || (orderType === "limit" && !limitPrice)}
                className={cn(
                  "w-full py-4 rounded-md font-medium transition-colors",
                  activeTab === "buy" 
                    ? "bg-green-500 text-white hover:bg-green-600" 
                    : "bg-red-500 text-white hover:bg-red-600",
                  (!shares || (orderType === "limit" && !limitPrice)) && "opacity-50 cursor-not-allowed"
                )}
              >
                {activeTab === "buy" ? "Buy" : "Sell"} {symbol}
              </button>
            </>
          )}

          {activeTab === "book" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 text-sm text-gray-400 mb-2">
                <div>Price</div>
                <div className="text-right">Size</div>
                <div className="text-right">Total</div>
              </div>
              
              {/* Sell orders (red) */}
              <div className="space-y-1">
                {orderBook.sells.map((order, i) => (
                  <div key={i} className="grid grid-cols-3 text-sm">
                    <div className="text-red-400">${order.price.toFixed(2)}</div>
                    <div className="text-right">{order.size.toLocaleString()}</div>
                    <div className="text-right">${(order.price * order.size).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="text-xl font-medium text-center py-2 border-y border-gray-800">
                ${currentPrice.toFixed(2)}
              </div>

              {/* Buy orders (green) */}
              <div className="space-y-1">
                {orderBook.buys.map((order, i) => (
                  <div key={i} className="grid grid-cols-3 text-sm">
                    <div className="text-green-400">${order.price.toFixed(2)}</div>
                    <div className="text-right">{order.size.toLocaleString()}</div>
                    <div className="text-right">${(order.price * order.size).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "trades" && (
            <div className="flex flex-col gap-2">
              {recentTrades.map((trade, i) => (
                <div key={i} className="grid grid-cols-3 text-sm py-2 border-b border-gray-800">
                  <div className={trade.side === "buy" ? "text-green-400" : "text-red-400"}>
                    {trade.side === "buy" ? "BUY" : "SELL"}
                  </div>
                  <div className="text-right">{trade.size.toLocaleString()}</div>
                  <div className="text-right">${trade.price.toFixed(2)}</div>
                  <div className="col-span-3 text-xs text-gray-400 mt-1">
                    {new Date(trade.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
