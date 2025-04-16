import * as React from "react"
import { cn } from "@/lib/utils"

const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
))
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative ml-3", className)}
    {...props}
  />
))
TimelineItem.displayName = "TimelineItem"

const TimelineIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute left-0 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-muted bg-background z-10",
      className
    )}
    {...props}
  />
))
TimelineIcon.displayName = "TimelineIcon"

const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute top-0 left-0 -translate-x-1/2 w-[2px] h-full bg-border", className)}
    {...props}
  />
))
TimelineConnector.displayName = "TimelineConnector"

const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex gap-2 items-center mb-2", className)}
    {...props}
  />
))
TimelineHeader.displayName = "TimelineHeader"

const TimelineBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("pb-6", className)}
    {...props}
  />
))
TimelineBody.displayName = "TimelineBody"

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 pb-8 pt-1", className)}
    {...props}
  />
))
TimelineContent.displayName = "TimelineContent"

export { 
  Timeline, 
  TimelineItem, 
  TimelineIcon, 
  TimelineContent, 
  TimelineConnector, 
  TimelineHeader, 
  TimelineBody 
}