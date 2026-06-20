interface TypingIndicatorProps {
  typingUsers: string[]
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 animate-fade-in">
      {/* Animated dots */}
      <div className="flex items-center gap-[3px] ml-9">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-surface-500 rounded-full animate-pulse-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <p className="text-[11px] text-surface-500 italic">{label}</p>
    </div>
  )
}
