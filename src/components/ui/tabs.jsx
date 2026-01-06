import * as React from "react"
import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

const TabsContext = createContext({
  value: "",
  setValue: () => {},
})

const Tabs = React.forwardRef(({ className, defaultValue, value: controlledValue, onValueChange, ...props }, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "")
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  const setValue = isControlled ? onValueChange : setInternalValue

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div ref={ref} className={cn("w-full max-w-full", className)} {...props} />
    </TabsContext.Provider>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue, setValue } = useContext(TabsContext)
  const isActive = selectedValue === value

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-background text-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue } = useContext(TabsContext)
  const isActive = selectedValue === value

  if (!isActive) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }

