import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getConversations, getMessages, sendMessage, clearActiveMessages } from "../redux/chatSlice";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Search, Send, Plus, MoreVertical, Paperclip, Smile, Circle, Phone, Video, MessageSquare, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

export default function ChatPlatform() {
  const dispatch = useDispatch();
  const { conversations, activeMessages, loading } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth); // Get logged in user ID to identify "isMe"

  const [selectedUser, setSelectedUser] = useState(null); 
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  
  const scrollRef = useRef(null);

  // Initial Fetch
  useEffect(() => {
    dispatch(getConversations());
    // Optional: set up interval to poll for new messages
    const interval = setInterval(() => dispatch(getConversations()), 10000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      dispatch(getMessages({ id: selectedUser.user_id, type: selectedUser.user_type }));
    } else {
      dispatch(clearActiveMessages());
    }
  }, [selectedUser, dispatch]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const payload = {
      receiver_id: selectedUser.user_id,
      receiver_type: selectedUser.user_type,
      message: newMessage
    };

    await dispatch(sendMessage(payload));
    setNewMessage("");
    // Refresh list to update "last message"
    dispatch(getConversations());
  };

  const filteredUsers = conversations.filter(u => 
    u.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] space-y-4 lg:space-y-6">
      <div className={cn("transition-all", selectedUser ? "hidden md:block" : "block")}>
        <h1 className="text-xl lg:text-2xl font-bold text-text-main">Messages</h1>
        <p className="text-xs lg:text-sm text-primary mt-1 font-medium">
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <span className="text-text-muted mx-1">&gt;&gt;</span> Chat Support
        </p>
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-lg overflow-hidden flex-1 flex relative">
        {/* Left Sidebar */}
        <div className={cn("w-full md:w-80 border-r border-border-subtle flex flex-col bg-dashboard-bg/20 transition-all duration-300", selectedUser ? "hidden md:flex" : "flex")}>
          <div className="p-4 border-b border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-text-main uppercase tracking-widest">Conversations</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card-bg border border-border-subtle rounded-md pl-9 pr-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredUsers.map((chat) => (
              <div
                key={chat.user_id}
                onClick={() => setSelectedUser(chat)}
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer transition-all border-b border-border-subtle/30",
                  selectedUser?.user_id === chat.user_id ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-dashboard-bg/40"
                )}
              >
                <div className="relative h-10 w-10 shrink-0 rounded-full bg-dashboard-bg border border-border-subtle flex items-center justify-center text-primary font-bold">
                  {chat.user_name?.charAt(0).toUpperCase()}
                  {chat.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-card-bg">
                      {chat.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-text-main truncate">{chat.user_name}</p>
                    <span className="text-[10px] text-text-muted">
                      {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate mt-0.5">{chat.last_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area */}
        <div className={cn("flex-1 flex flex-col bg-card-bg relative", !selectedUser ? "hidden md:flex" : "flex")}>
          {selectedUser ? (
            <>
              <div className="p-3 lg:p-4 border-b border-border-subtle flex items-center justify-between bg-dashboard-bg/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedUser(null)} className="p-1 text-text-muted md:hidden"><ChevronLeft size={24} /></button>
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {selectedUser.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-main leading-tight">{selectedUser.user_name}</h3>
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-tight">Active Conversation</span>
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/5">
                <AnimatePresence>
                  {activeMessages.map((msg) => {
                    // Logic: If sender_id matches current logged in user ID, it's "Me"
                    // Adjust this comparison based on your auth state structure
                    const isMe = msg.sender_type === "user" || msg.sender_id === user?.id; 
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex flex-col max-w-[75%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                      >
                        <div className={cn(
                          "px-4 py-2 rounded-2xl text-sm shadow-sm", 
                          isMe ? "bg-primary text-black font-semibold rounded-tr-none" : "bg-card-bg border border-border-subtle text-text-main rounded-tl-none"
                        )}>
                          {msg.message}
                        </div>
                        <span className="text-[9px] text-text-muted mt-1 opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="p-4 border-t border-border-subtle">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-card-bg border border-border-subtle rounded-xl px-2 py-1.5 focus-within:border-primary shadow-inner">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-text-main px-2"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="bg-primary text-black h-9 px-4 rounded-lg font-bold">
                    <Send size={16} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="p-8 bg-dashboard-bg/50 rounded-full border border-border-subtle mb-4">
                <MessageSquare size={40} className="text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-text-main">Support Messages</h3>
              <p className="text-sm text-text-muted max-w-xs mt-2">Select a user to begin chatting.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}