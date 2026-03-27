"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Loader2,
  Sparkles,
  Move,
  Check,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragged, setIsDragged] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const dragRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const inputRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for custom event from navigation
  useEffect(() => {
    const handleOpenAIChat = () => {
      setIsOpen(true);
    };

    window.addEventListener('openAIChat', handleOpenAIChat);

    return () => {
      window.removeEventListener('openAIChat', handleOpenAIChat);
    };
  }, []);

  // Initialize position to bottom-right corner
  useEffect(() => {
    const updatePosition = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const widgetWidth = 56; // Button width
      const widgetHeight = 56; // Button height
      const margin = 24; // Distance from edges
      
      setPosition({
        x: screenWidth - widgetWidth - margin,
        y: screenHeight - widgetHeight - margin
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    // Don't set isDragged to true immediately - wait for actual movement
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;

    // Check if user actually moved the mouse (drag threshold)
    const dragDistance = Math.sqrt(newX * newX + newY * newY);
    if (dragDistance > 5) { // 5px threshold
      setIsDragged(true);
    }

    // Keep widget within screen bounds
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const widgetWidth = 56;
    const widgetHeight = 56;
    const margin = 12;

    const boundedX = Math.max(margin, Math.min(screenWidth - widgetWidth - margin, newX));
    const boundedY = Math.max(margin, Math.min(screenHeight - widgetHeight - margin, newY));

    setPosition({ x: boundedX, y: boundedY });
  };

  const handleMouseUp = () => {
    // Only reset isDragging, keep isDragged until next click
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartPos.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStartPos.current.x;
    const newY = touch.clientY - dragStartPos.current.y;

    // Check if user actually moved (drag threshold)
    const dragDistance = Math.sqrt(newX * newX + newY * newY);
    if (dragDistance > 5) {
      setIsDragged(true);
    }

    // Keep widget within screen bounds
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const widgetWidth = 56;
    const widgetHeight = 56;
    const margin = 12;

    const boundedX = Math.max(margin, Math.min(screenWidth - widgetWidth - margin, newX));
    const boundedY = Math.max(margin, Math.min(screenHeight - widgetHeight - margin, newY));

    setPosition({ x: boundedX, y: boundedY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Touch events for mobile
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    } else {
      // Clean up all events
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      // Cleanup all events on unmount
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  const askAI = async (userMessage) => {
    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: userMessage }),
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.text;
    } catch (error) {
      console.error("AI Error:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages(prev => [
      ...prev,
      { 
        role: "user", 
        content: userMessage, 
        timestamp: new Date(),
        status: "sent"
      }
    ]);

    setIsLoading(true);
    setIsTyping(true);

    // Simulate typing indicator
    setTimeout(() => setIsTyping(false), 1000);

    try {
      const aiResponse = await askAI(userMessage);
      
      // Add AI response
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: aiResponse, 
          timestamp: new Date(),
          status: "delivered"
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "Sorry, I encountered an error. Please try again.", 
          timestamp: new Date(),
          isError: true,
          status: "error"
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        ref={dragRef}
        className={`fixed z-[9999] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragged ? 'shadow-2xl' : 'shadow-lg'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transition: isDragging ? 'none' : 'all 0.3s ease'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <Button
          onClick={(e) => {
            // Only open if not dragged
            if (!isDragged) {
              toggleChat();
            }
            setTimeout(() => setIsDragged(false), 100);
          }}
          size="lg"
          className={`hidden lg:block h-14 w-14 rounded-full transition-all duration-300 bg-gradient-to-r from-green-600 to-green-600 hover:from-green-700 hover:to-green-700 border-0 ${isDragged ? 'hover:scale-100' : 'hover:scale-110 hover:shadow-xl'}`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 180, opacity: 1 }}
                exit={{ rotate: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -180, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <MessageCircle className="h-6 w-6" />
                <motion.div
                  className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        
        {/* Drag indicator */}
        {/* {isDragged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
          >
            <Move className="h-3 w-3 inline mr-1" />
            Drag to position
          </motion.div>
        )} */}
      </motion.div>


      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-[9999] w-96 max-w-[calc(100vw-3rem)]"
            initial={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.4
            }}
          >
            <Card className="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden ">
              {/* Header with gradient */}
              <CardHeader className="pb-1 bg-green-700 pt-2 text-white rounded-t-sm relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "linear",
                    repeatDelay: 2,
                    times:[0, 0.5, 1]
                  }}
                />
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ 
                        rotate: [0, 100, -100, 0],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 4,
                        ease: "easeInOut"
                      }}
                    >
                      <Sparkles className="h-5 w-5" />
                    </motion.div>
                    <span className="text-lg font-semibold">ASYV AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
                      <div className="h-2 w-2 bg-emerald-300 rounded-full animate-pulse" />
                      <span>Online</span>
                    </div>
                    <Button
                      onClick={() => setIsOpen(false)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-96 p-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-gray-500 dark:text-gray-400 py-8"
                      >
                        <motion.div
                          animate={{ 
                            y: [0, -5, 0],
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 3,
                            ease: "easeInOut"
                          }}
                        >
                          <Bot className="h-16 w-16 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                        <p className="text-sm font-medium">Hello! I'm your ASYV AI Assistant.</p>
                        <p className="text-sm mt-1 text-gray-400">How can I help you today?</p>
                        
                        {/* Suggested prompts */}
                        <div className="grid grid-cols-2 gap-2 mt-6">
                          {["What can you do?", "Tell me a joke", "Help me", "Pricing"].map((prompt, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              onClick={() => {
                                setInput(prompt);
                                setTimeout(() => handleSendMessage(), 100);
                              }}
                              className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg transition-colors"
                            >
                              {prompt}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }}
                          className={`flex gap-2 ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="h-8 w-8 mt-1 flex-shrink-0 ring-2 ring-orange-500/20">
                              <AvatarFallback className="bg-green-700 text-white">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`max-w-[80%] space-y-1 ${message.role === "user" ? "items-end" : "items-start"}`}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                              className={`rounded-2xl px-4 py-2 ${
                                message.role === "user"
                                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-br-none"
                                  : message.isError
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : "bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200/50 dark:border-gray-700/50"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                            </motion.div>
                            
                            {/* Timestamp and status */}
                            <div className={`flex items-center gap-1 text-[10px] text-gray-400 px-1 ${
                              message.role === "user" ? "justify-end" : "justify-start"
                            }`}>
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(message.timestamp)}</span>
                              {message.role === "user" && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <Check className="h-3 w-3 text-emerald-500" />
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {message.role === "user" && (
                            <Avatar className="h-8 w-8 mt-1 flex-shrink-0 ring-2 ring-orange-500/20">
                              <AvatarFallback className="bg-orange-500 text-white">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </motion.div>
                      ))
                    )}
                    
                    {/* Typing indicator */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 justify-start"
                      >
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0 ring-2 ring-orange-500/20">
                          <AvatarFallback className="bg-orange-500 text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-none">
                          <div className="flex items-center gap-1">
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.7, delay: 0 }}
                              className="h-2 w-2 bg-gray-700 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }}
                              className="h-2 w-2 bg-gray-700 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.7, delay: 0.4 }}
                              className="h-2 w-2 bg-gray-700 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        disabled={isLoading}
                        className="pr-12 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all h-9 min-h-9 p-2"
                      />
                      {input && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <div className="h-2 w-2 bg-orange-500 rounded-full" />
                        </motion.div>
                      )}
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className="bg-orange-500 hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Send className="h-4 w-4" />
                        </motion.div>
                      )}
                    </Button>
                  </div>
                  
                  {/* Footer text */}
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-[10px] text-center text-gray-400 mt-2"
                  >
                    Powered by ASYV AI • Responses may be generated
                  </motion.p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}



