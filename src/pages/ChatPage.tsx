import { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { mockMessages, type ChatMessage } from "../lib/data";

const TypingIndicator = () => (
  <div className="flex items-center gap-1 chat-bubble-ai w-fit">
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot-1" />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot-2" />
    <div className="h-2 w-2 rounded-full bg-muted-foreground animate-typing-dot-3" />
  </div>
);

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}>
      {!isUser && <span className="mr-2 mt-1 text-xl">🐻</span>}
      <div className={`max-w-[78%] ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`}>
        <p className="text-[15px] leading-relaxed">{message.content}</p>
        <p className={`mt-1 text-[10px] ${isUser ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "I hear you! 💛 Thanks for sharing that with me. I've logged everything. Remember, you're doing your best and that's enough. Want to tell me more or should we call it for today?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="Buddy 🐻" subtitle="Always here for you" />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        <div className="mx-auto max-w-lg space-y-3">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isTyping && (
            <div className="flex items-center">
              <span className="mr-2 text-xl">🐻</span>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="fixed bottom-[60px] left-0 right-0 border-t bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
            <Mic size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tell me how you're feeling..."
            className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatPage;
