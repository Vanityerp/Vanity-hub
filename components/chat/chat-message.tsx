import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export interface ChatMessageProps {
  id: string
  content: string
  timestamp: Date
  sender: {
    id: string
    name: string
    avatar?: string
    location: string
    role: string
  }
  isCurrentUser?: boolean
}

export function ChatMessage({ content, timestamp, sender, isCurrentUser = false }: ChatMessageProps) {
  return (
    <div className={cn("flex w-full gap-2 mb-4", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {sender.avatar ? (
          <AvatarImage src={sender.avatar} alt={sender.name} />
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {sender.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        )}
      </Avatar>
      <div className={cn("flex flex-col max-w-[80%]", isCurrentUser ? "items-end" : "items-start")}>
        <div className={cn("px-3 py-2 rounded-lg", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          <p className="text-sm">{content}</p>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <span className="font-medium">{sender.name}</span>
          <span>•</span>
          <span>
            {sender.location} - {sender.role}
          </span>
          <span>•</span>
          <time dateTime={timestamp.toISOString()}>{format(timestamp, "h:mm a")}</time>
        </div>
      </div>
    </div>
  )
}

