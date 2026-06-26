import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getConversations, getMessages, clearMessages, receiveSocketMessage } from "../redux/chatSlice";
import { getAdminChatWSUrl } from "../services/apiCalls"; // Updated import
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Search, Send, MessageSquare, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function ChatPlatform() {
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const socketRef = useRef(null); // Ref to store WebSocket instance

  const { conversations = [], activeMessages = [], fetchingMessages } = useSelector((state) => state.chat || {});
  const { user } = useSelector((state) => state.auth || {});

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  // 1. Establish WebSocket Connection
  useEffect(() => {
    const wsUrl = getAdminChatWSUrl();
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Real-time message received:", data);
      
      // If the event is 'sent' or a new message, push to Redux
      // Map the backend structure to our message format
      const formattedMsg = {
        id: Date.now(), // Fallback ID
        sender_id: data.sender_id,
        sender_type: data.sender_type,
        receiver_id: data.receiver_id,
        message: data.message,
        created_at: new Date().toISOString()
      };

      dispatch(receiveSocketMessage(formattedMsg));
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [dispatch]);

  // 2. Initial Fetch for Conversations
  useEffect(() => {
    dispatch(getConversations());
  }, [dispatch]);

  // 3. Fetch History when selection changes
  useEffect(() => {
    if (selectedUser?.user_id) {
      dispatch(getMessages({ id: selectedUser.user_id, type: selectedUser.user_type }));
    } else {
      dispatch(clearMessages());
    }
  }, [selectedUser, dispatch]);

  // 4. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !isConnected) return;

    const payload = {
      receiver_id: selectedUser.user_id,
      receiver_type: selectedUser.user_type,
      message: newMessage
    };

    // Send via WebSocket instead of HTTP post
    socketRef.current.send(JSON.stringify(payload));
    
    setNewMessage(""); 
  };

  const filteredUsers = conversations.filter(u => 
    u.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
      <Card className="bg-card-bg border-border-subtle shadow-lg overflow-hidden flex-1 flex">
        
        {/* User List Sidebar */}
        <div className={cn("w-full md:w-80 border-r border-border-subtle flex flex-col", selectedUser ? "hidden md:flex" : "flex")}>
          <div className="p-4 border-b border-border-subtle bg-card-bg/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-text-main uppercase">Conversations</h2>
              <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} title={isConnected ? "Live" : "Offline"} />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-dashboard-bg border border-border-subtle rounded-md pl-9 pr-3 py-2 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map((chat) => (
              <div
                key={chat.user_id}
                onClick={() => setSelectedUser(chat)}
                className={cn(
                  "p-4 flex items-center gap-3 cursor-pointer border-b border-border-subtle/30 hover:bg-primary/5 transition-all",
                  selectedUser?.user_id === chat.user_id && "bg-primary/10 border-l-4 border-l-primary"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {chat.user_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-text-main truncate">{chat.user_name}</p>
                    <span className="text-[10px] text-text-muted">
                      {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate">{chat.last_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className={cn("flex-1 flex flex-col bg-card-bg", !selectedUser ? "hidden md:flex" : "flex")}>
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-border-subtle flex items-center gap-3 bg-dashboard-bg/10">
                <button onClick={() => setSelectedUser(null)} className="md:hidden"><ChevronLeft /></button>
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-black font-bold">
                  {selectedUser.user_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-main">{selectedUser.user_name}</h3>
                  <p className="text-[10px] text-green-500 font-medium">REAL-TIME CONNECTED</p>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/5 custom-scrollbar">
                {activeMessages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.user_id || msg.sender_type === "user"; // Adjust based on your token logic

                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm",
                        isMe ? "bg-primary text-black font-medium rounded-tr-none" : "bg-dashboard-bg border border-border-subtle text-text-main rounded-tl-none"
                      )}>
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-text-muted mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-border-subtle flex items-center gap-2">
                <input
                  type="text"
                  placeholder={isConnected ? "Type a message..." : "Connecting..."}
                  disabled={!isConnected}
                  className="flex-1 bg-dashboard-bg border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || !isConnected} 
                  className="bg-primary text-black rounded-xl w-10 h-10 p-0"
                >
                  <Send size={18} />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <MessageSquare size={48} className="mb-4" />
              <p>Select a user to start chatting</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}