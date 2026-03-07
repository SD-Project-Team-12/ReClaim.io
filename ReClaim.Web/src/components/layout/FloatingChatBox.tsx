import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import * as signalR from "@microsoft/signalr";
import {
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Minimize2,
  Maximize2,
  Check,       // <-- Added for Seen functionality
  CheckCheck   // <-- Added for Seen functionality
} from "lucide-react";
import { useChatPopup } from "../../context/ChatPopupContext";
import { uploadImageToCloud } from "../../utils/uploadService";
import { getChatHistory, getContacts } from "../../api/chatApi";

interface ChatMessage {
  senderId: string;
  message: string;
  timestamp?: string; 
  isRead?: boolean;   
}

export default function FloatingChatBox() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isOpen, targetUser, closeChatPopup, openChatPopup } = useChatPopup();
  const { getToken, userId } = useAuth();
  
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const [verifiedTargetId, setVerifiedTargetId] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // 1. Verify User
  useEffect(() => {
    if (!isOpen || !targetUser?.id) return;

    const verifyUser = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const contacts = await getContacts(token);

        const existingContact = contacts.find(
          (c: any) =>
            c.clerkId === targetUser.id ||
            c.email === targetUser.id ||
            (c.name === targetUser.name && targetUser.name !== "Seller")
        );

        if (existingContact) {
          setVerifiedTargetId(existingContact.clerkId);
          openChatPopup(existingContact.clerkId, existingContact.name);
        } else {
          setVerifiedTargetId(targetUser.id);
        }
      } catch (err) {
        console.error("Failed to verify user:", err);
        setVerifiedTargetId(targetUser.id);
      }
    };

    verifyUser();
  }, [isOpen, targetUser?.id]);

  // 2. Fetch History
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!isOpen || !verifiedTargetId) return;
      setLoading(true);
      try {
        const token = await getToken();
        if (token && isMounted) {
          const data = await getChatHistory(verifiedTargetId, token);
          if (isMounted) setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, verifiedTargetId]);

  // 3. SignalR Connection
  useEffect(() => {
    let isMounted = true;

    const connectSignalR = async () => {
      const token = await getToken();
      if (!token || !isMounted || !isOpen) return;

      const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");

      const conn = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/chathub`, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();

      conn.on("ReceiveMessage", (senderId: string, message: string, timestamp: string, isRead: boolean) => {
        setMessages((prev) => [...prev, { senderId, message, timestamp, isRead }]);
      });

      conn.on("MessagesRead", (readerId: string) => {
        setMessages(prev => prev.map(m => 
            (m.senderId === userId) ? { ...m, isRead: true } : m
        ));
      });

      conn.on("ReceiveTyping", (senderId: string, isTyping: boolean) => {
        setTypingUsers(prev => {
            const next = new Set(prev);
            if (isTyping) next.add(senderId);
            else next.delete(senderId);
            return next;
        });
      });

      conn.on("UserConnected", (connectedUserId: string) => {
        setOnlineUsers((prev) => new Set(prev).add(connectedUserId));
      });

      conn.on("UserDisconnected", (disconnectedUserId: string) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(disconnectedUserId);
          return next;
        });
      });

      try {
        await conn.start();
        if (isMounted) {
          connectionRef.current = conn;
          setConnection(conn);
          const currentOnlineUsers = await conn.invoke<string[]>("GetOnlineUsers");
          setOnlineUsers(new Set(currentOnlineUsers));
        } else {
          conn.stop();
        }
      } catch (err) {
        console.error("SignalR Error: ", err);
      }
    };

    connectSignalR();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.off("ReceiveMessage");
        connectionRef.current.off("ReceiveTyping"); 
        connectionRef.current.off("MessagesRead");  
        connectionRef.current.stop();
      }
    };
  }, [getToken, isOpen, userId]);

  useEffect(() => {
    const targetClerkId = verifiedTargetId || targetUser?.id;
    if (targetClerkId && connection && !isMinimized && isOpen) {
        const unreadFromContact = messages.some(m => m.senderId === targetClerkId && !m.isRead);
        if (unreadFromContact) {
            connection.invoke("MarkMessagesAsRead", targetClerkId).catch(console.error);
            setMessages(prev => prev.map(m => 
                m.senderId === targetClerkId ? { ...m, isRead: true } : m
            ));
        }
    }
  }, [messages, verifiedTargetId, targetUser?.id, connection, isMinimized, isOpen]);

  // 4. Auto Scroll
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, isMinimized]);

  // 5. File Handle
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const targetClerkId = verifiedTargetId || targetUser?.id;
    
    if (connection && targetClerkId) {
      connection.invoke("NotifyTyping", targetClerkId, true).catch(console.error);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        connection.invoke("NotifyTyping", targetClerkId, false).catch(console.error);
      }, 2000);
    }
  };

  // 6. Send Message Function
  const handleSend = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }

    const targetClerkId = verifiedTargetId || targetUser?.id;

    if (!targetClerkId || !connection || isUploading) return;

    const localTimestamp = new Date().toISOString();

    // Clear typing indicator on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await connection.invoke("NotifyTyping", targetClerkId, false).catch(console.error);

    if (selectedImage) {
      setIsUploading(true);
      try {
        const cloudinaryUrl = await uploadImageToCloud(selectedImage);

        if (cloudinaryUrl) {
          const imageMessage = `[IMAGE]${cloudinaryUrl}`;
          await connection.invoke("SendMessage", targetClerkId, imageMessage);
          setMessages((prev) => [
            ...prev,
            {
              senderId: userId || "",
              message: imageMessage,
              timestamp: localTimestamp,
              isRead: false,
            },
          ]);

          if (inputText.trim() !== "") {
            await connection.invoke("SendMessage", targetClerkId, inputText);
            setMessages((prev) => [
              ...prev,
              {
                senderId: userId || "",
                message: inputText,
                timestamp: localTimestamp,
                isRead: false,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error sending image:", error);
      } finally {
        setIsUploading(false);
        setSelectedImage(null);
        setImagePreviewUrl(null);
        setInputText("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else if (inputText.trim() !== "") {
      try {
        await connection.invoke("SendMessage", targetClerkId, inputText);
        setMessages((prev) => [
          ...prev,
          {
            senderId: userId || "",
            message: inputText,
            timestamp: localTimestamp,
            isRead: false,
          },
        ]);
        setInputText("");
      } catch (err) {
         console.error("Message send failed", err);
      }
    }
  };

  if (!isOpen || !targetUser) return null;

  return (
    <div
      className={`fixed bottom-0 right-6 z-[999] w-[340px] bg-white shadow-2xl rounded-t-2xl border border-gray-200 transition-all duration-300 flex flex-col ${isMinimized ? "h-[52px]" : "h-[500px]"}`}
    >
      {/* Header */}
      <div
        className="bg-emerald-600 px-4 py-3 rounded-t-2xl flex justify-between items-center text-white cursor-pointer shadow-sm shrink-0"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
              {targetUser.name[0]}
            </div>
            {onlineUsers.has(verifiedTargetId || targetUser.id) && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-600 rounded-full"></div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm truncate">
              {targetUser.name}
            </span>
            <span className="text-[10px] text-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              {onlineUsers.has(verifiedTargetId || targetUser.id) ? "Online" : "Away"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1.5 hover:bg-emerald-700 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeChatPopup();
            }}
            className="p-1.5 hover:bg-emerald-700 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-gray-400 px-4">
                Send a message to start conversing with {targetUser.name}.
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === userId;
                const isImage = msg.message.startsWith("[IMAGE]");
                const rawUrl = msg.message.replace("[IMAGE]", "");
                const imageUrl = isImage
                  ? rawUrl.startsWith("http")
                    ? rawUrl
                    : `${import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "")}${rawUrl}`
                  : "";

                return (
                  <div
                    key={index}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        <div
                        className={`text-sm ${isImage ? "p-1 bg-white border border-gray-200" : isMe ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-800"} rounded-2xl shadow-sm ${isMe ? "rounded-tr-sm" : "rounded-tl-sm"} ${!isImage && "px-3.5 py-2"}`}
                        >
                        {isImage ? (
                            <img
                            src={imageUrl}
                            alt="attachment"
                            className="max-w-full max-h-48 object-cover rounded-xl cursor-zoom-in"
                            onClick={() => window.open(imageUrl, "_blank")}
                            />
                        ) : (
                            <p className="leading-relaxed whitespace-pre-wrap break-words">
                            {msg.message}
                            </p>
                        )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                            {msg.timestamp && (
                                <span className="text-[10px] text-gray-400">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            {isMe && (
                                msg.isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                ) : (
                                    <Check className="w-3.5 h-3.5 text-gray-400" />
                                )
                            )}
                        </div>
                    </div>
                  </div>
                );
              })
            )}

            {typingUsers.has(verifiedTargetId || targetUser.id) && (
                <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm italic flex gap-1 items-center">
                        <span className="animate-pulse">.</span>
                        <span className="animate-pulse delay-75">.</span>
                        <span className="animate-pulse delay-150">.</span>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview Area */}
          {imagePreviewUrl && (
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-3 animate-in fade-in">
              <div className="relative">
                <img
                  src={imagePreviewUrl}
                  alt="preview"
                  className={`w-12 h-12 rounded-lg object-cover border-2 border-emerald-600 ${isUploading ? "opacity-50" : ""}`}
                />
                {!isUploading && (
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {isUploading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />{" "}
                    Uploading...
                  </span>
                ) : (
                  "Image attached."
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-end gap-2 shrink-0">
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={isUploading}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              value={inputText}
              onChange={handleInputChange} 
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // @ts-ignore
                  handleSend(e);
                }
              }}
              placeholder={
                selectedImage ? "Add a caption..." : "Write a message..."
              }
              disabled={isUploading}
              rows={1}
              className="flex-1 max-h-32 bg-gray-100/80 border-none rounded-2xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400 min-h-[44px]"
            />

            <button
              type="button"
              onClick={handleSend as any}
              disabled={
                isUploading || (!selectedImage && inputText.trim() === "")
              }
              className={`p-3 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                isUploading || (!selectedImage && inputText.trim() === "")
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-primary text-white hover:bg-emerald-600 shadow-sm hover:shadow-md"
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}