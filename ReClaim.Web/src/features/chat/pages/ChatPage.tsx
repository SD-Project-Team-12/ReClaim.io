import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom"; 
import * as signalR from "@microsoft/signalr";
import {
  Search,
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCheck,
  Sparkles,
  ArrowLeft, 
} from "lucide-react";
import { uploadImageToCloud } from "../../../utils/uploadService";
import { getContacts, getChatHistory } from "../../../api/chatApi";
import { GoogleGenAI } from "@google/genai";

const askGemini = async (prompt: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing in .env file!");
    return "System Error: Gemini API Key is missing in configuration.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Sorry I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini SDK Error:", error);
    return "Sorry, the Gemini API call failed. Please check the console.";
  }
};

interface Contact {
  clerkId: string;
  name: string;
  role: string;
  email: string;
}

interface ChatMessage {
  senderId: string;
  message: string;
  timestamp?: string;
  isRead?: boolean;
}

export const ChatPage = () => {
  const { getToken, userId } = useAuth();
  const location = useLocation(); // <-- Added useLocation
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const promoteContactToTop = (targetClerkId: string) => {
    setContacts((prevContacts) => {
      const index = prevContacts.findIndex((c) => c.clerkId === targetClerkId);
      if (index <= 0) return prevContacts;

      const newContacts = [...prevContacts];
      const movedContact = newContacts[index];
      newContacts.splice(index, 1);
      newContacts.unshift(movedContact);
      return newContacts;
    });
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const token = await getToken();
      if (token) {
        try {
          const data = await getContacts(token);

          const preselectedState = location.state as {
            preselectUserId?: string;
            preselectUserName?: string;
          };

          if (preselectedState?.preselectUserId) {
            const preId = preselectedState.preselectUserId;
            const preName = preselectedState.preselectUserName || "Seller";

            let existingContact = data.find((c: any) => c.clerkId === preId);

            if (!existingContact) {
              existingContact = {
                clerkId: preId,
                name: preName,
                role: "Seller",
                email: "Marketplace Contact",
              };
              data.unshift(existingContact);
            }

            setContacts(data);
            setSelectedContact(existingContact);

            window.history.replaceState({}, document.title);
          } else {
            setContacts(data);
          }
        } catch (error) {
          console.error("Failed to fetch contacts:", error);
        }
      }
    };
    fetchContacts();
  }, [getToken, location.state]);

  useEffect(() => {
    let isMounted = true;
    let currentConnection: signalR.HubConnection | null = null;

    const connectSignalR = async () => {
      const token = await getToken();
      if (!token || !isMounted) return;

      const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, "");

      currentConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/chathub`, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();

      currentConnection.on(
        "ReceiveMessage",
        (
          senderId: string,
          message: string,
          timestamp: string,
          isRead: boolean,
        ) => {
          if (message.startsWith("[GEMINI_RESPONSE]")) {
            const cleanMessage = message.replace("[GEMINI_RESPONSE]", "");
            setMessages((prev) => [
              ...prev,
              {
                senderId: "GEMINI_BOT",
                message: cleanMessage,
                timestamp,
                isRead,
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              { senderId, message, timestamp, isRead },
            ]);
          }
          promoteContactToTop(senderId);
        },
      );

      currentConnection.on("MessagesRead", (readerId: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === userId ? { ...m, isRead: true } : m)),
        );
      });

      currentConnection.on(
        "ReceiveTyping",
        (senderId: string, isTyping: boolean) => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (isTyping) next.add(senderId);
            else next.delete(senderId);
            return next;
          });
        },
      );

      currentConnection.on("UserConnected", (connectedUserId: string) => {
        setOnlineUsers((prev) => new Set(prev).add(connectedUserId));
      });

      currentConnection.on("UserDisconnected", (disconnectedUserId: string) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(disconnectedUserId);
          return next;
        });
      });

      try {
        await currentConnection.start();
        if (isMounted) {
          setConnection(currentConnection);
          const currentOnlineUsers =
            await currentConnection.invoke<string[]>("GetOnlineUsers");
          setOnlineUsers(new Set(currentOnlineUsers));
        } else {
          currentConnection.stop();
        }
      } catch (err) {
        console.error("SignalR Error: ", err);
      }
    };

    connectSignalR();

    return () => {
      isMounted = false;
      if (currentConnection) {
        currentConnection.off("ReceiveMessage");
        currentConnection.off("ReceiveTyping");
        currentConnection.off("MessagesRead");
        currentConnection.stop();
      }
    };
  }, [getToken, userId]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedContact) {
        setMessages([]);
        return;
      }
      try {
        const token = await getToken();
        if (token) {
          const data = await getChatHistory(selectedContact.clerkId, token);

          const formattedData = data.map((m: ChatMessage) => {
            if (m.message && m.message.startsWith("[GEMINI_RESPONSE]")) {
              return {
                ...m,
                senderId: "GEMINI_BOT",
                message: m.message.replace("[GEMINI_RESPONSE]", ""),
              };
            }
            return m;
          });

          setMessages(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    fetchHistory();
  }, [selectedContact, getToken]);

  useEffect(() => {
    if (selectedContact && connection) {
      const unreadFromContact = messages.some(
        (m) => m.senderId === selectedContact.clerkId && !m.isRead,
      );
      if (unreadFromContact) {
        connection.invoke("MarkMessagesAsRead", selectedContact.clerkId);
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === selectedContact.clerkId ? { ...m, isRead: true } : m,
          ),
        );
      }
    }
  }, [messages, selectedContact, connection]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (connection && selectedContact) {
      connection.invoke("NotifyTyping", selectedContact.clerkId, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        connection.invoke("NotifyTyping", selectedContact.clerkId, false);
      }, 2000);
    }
  };

  const handleSend = async () => {
    if (!selectedContact || !connection || isUploading) return;

    const targetClerkId = selectedContact.clerkId;
    const localTimestamp = new Date().toISOString();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await connection.invoke("NotifyTyping", targetClerkId, false);

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
            const fullMessage = inputText;
            await connection.invoke("SendMessage", targetClerkId, fullMessage);
            setMessages((prev) => [
              ...prev,
              {
                senderId: userId || "",
                message: fullMessage,
                timestamp: localTimestamp,
                isRead: false,
              },
            ]);

            if (fullMessage.includes("@Gemini")) {
              try {
                const prompt = fullMessage.replace(/@Gemini/g, "").trim();
                const aiResponse = await askGemini(prompt);

                const geminiFormattedMessage = `[GEMINI_RESPONSE]${aiResponse}`;
                await connection.invoke(
                  "SendMessage",
                  targetClerkId,
                  geminiFormattedMessage,
                );

                setMessages((prev) => [
                  ...prev,
                  {
                    senderId: "GEMINI_BOT",
                    message: aiResponse,
                    timestamp: new Date().toISOString(),
                    isRead: true,
                  },
                ]);
              } catch (err) {
                console.error("Gemini failed:", err);
              }
            }
          }

          promoteContactToTop(targetClerkId);
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
      const fullMessage = inputText;
      await connection.invoke("SendMessage", targetClerkId, fullMessage);
      setMessages((prev) => [
        ...prev,
        {
          senderId: userId || "",
          message: fullMessage,
          timestamp: localTimestamp,
          isRead: false,
        },
      ]);
      setInputText("");
      promoteContactToTop(targetClerkId);

      if (fullMessage.includes("@Gemini")) {
        try {
          const prompt = fullMessage.replace(/@Gemini/g, "").trim();
          const aiResponse = await askGemini(prompt);

          const geminiFormattedMessage = `[GEMINI_RESPONSE]${aiResponse}`;
          await connection.invoke(
            "SendMessage",
            targetClerkId,
            geminiFormattedMessage,
          );

          setMessages((prev) => [
            ...prev,
            {
              senderId: "GEMINI_BOT",
              message: aiResponse,
              timestamp: new Date().toISOString(),
              isRead: true,
            },
          ]);
        } catch (err) {
          console.error("Gemini failed:", err);
        }
      }
    }
  };

  const renderMessageWithBold = (message: string, isMe: boolean) => {
    if (!message.includes("@Gemini")) return message;

    const parts = message.split(/(@Gemini)/g);
    return parts.map((part, i) =>
      part === "@Gemini" ? (
        <strong
          key={i}
          className={`font-black ${isMe ? "text-white-300" : "text-emerald-primary"}`}
        >
          @Gemini
        </strong>
      ) : (
        part
      ),
    );
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      style={{ height: "calc(100vh - 85px)" }}
      className="flex w-full max-w-[1250px] mx-auto bg-white md:rounded-2xl shadow-sm md:border border-gray-200 overflow-hidden text-slate-dark md:mt-2 md:mb-2"
    >
      {/* 1. SIDEBAR: Hidden on mobile if a contact is selected */}
      <div 
        className={`border-r border-gray-100 bg-surface flex-col z-10 h-full md:w-80 shrink-0 ${
          selectedContact ? "hidden md:flex" : "flex w-full"
        }`}
      >
        <div className="p-4 md:p-6 border-b border-gray-100 bg-white shrink-0">
          <h2 className="text-xl font-bold tracking-tight">Messages</h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">
            ReClaim.io Network
          </p>

          <div className="relative mt-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100/50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-emerald-primary focus:ring-1 focus:ring-emerald-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
          {filteredContacts.map((contact) => {
            const isSelected = selectedContact?.clerkId === contact.clerkId;
            const isOnline = onlineUsers.has(contact.clerkId);
            return (
              <button
                key={contact.clerkId}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                  isSelected
                    ? "bg-emerald-primary/10 border border-emerald-primary/20"
                    : "hover:bg-gray-100 border border-transparent"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                      isSelected
                        ? "bg-emerald-primary text-white"
                        : "bg-gray-200 text-slate-dark group-hover:bg-gray-300"
                    }`}
                  >
                    {contact.name[0].toUpperCase()}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-primary border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {contact.name}
                  </div>
                  {typingUsers.has(contact.clerkId) ? (
                    <div className="text-xs text-emerald-600 font-medium italic truncate">
                      Typing...
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 capitalize truncate">
                      {contact.role}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CHAT AREA: Hidden on mobile if NO contact is selected */}
      <div 
        className={`flex-col bg-white relative min-w-0 h-full flex-1 ${
          selectedContact ? "flex w-full" : "hidden md:flex"
        }`}
      >
        {selectedContact ? (
          <>
            <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center bg-white/90 backdrop-blur-sm z-10 shrink-0">
              {/* MOBILE BACK BUTTON */}
              <button 
                onClick={() => setSelectedContact(null)}
                className="md:hidden mr-3 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-10 h-10 rounded-full bg-slate-dark text-white flex items-center justify-center font-bold mr-4 shadow-sm shrink-0">
                {selectedContact.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-tight truncate">
                  {selectedContact.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${onlineUsers.has(selectedContact.clerkId) ? "bg-emerald-primary" : "bg-gray-300"}`}
                  ></div>
                  <span className="text-xs text-gray-500 font-medium truncate">
                    {onlineUsers.has(selectedContact.clerkId)
                      ? "Active now"
                      : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto space-y-6 bg-surface scrollbar-thin scrollbar-thumb-gray-200">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === userId;
                const isBot = msg.senderId === "GEMINI_BOT"; 
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
                    <div
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] md:max-w-[70%]`}
                    >
                      {isBot && (
                        <div className="flex items-center gap-1 mb-1 ml-1 text-xs font-bold text-indigo-600 uppercase tracking-widest">
                          <Sparkles size={12} /> ReClaim AI
                        </div>
                      )}

                      <div
                        className={`text-sm ${isImage ? "p-1 bg-white border border-gray-200" : isMe ? "bg-emerald-primary text-white" : isBot ? "bg-indigo-50 border border-indigo-100 text-slate-800 shadow-sm" : "bg-white border border-gray-200 text-slate-dark"} rounded-2xl shadow-sm ${isMe ? "rounded-tr-sm" : "rounded-tl-sm"} ${!isImage && "px-4 py-2.5"}`}
                      >
                        {isImage ? (
                          <img
                            src={imageUrl}
                            alt="attachment"
                            className="max-w-full max-h-60 md:max-h-72 object-cover rounded-xl cursor-zoom-in hover:opacity-95 transition-opacity"
                            onClick={() => window.open(imageUrl, "_blank")}
                          />
                        ) : (
                          <p className="leading-relaxed whitespace-pre-wrap break-words">
                            {renderMessageWithBold(msg.message, isMe)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1">
                        {msg.timestamp && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {isMe &&
                          (msg.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-gray-400" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {typingUsers.has(selectedContact.clerkId) && (
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

            <div className="p-3 md:p-4 bg-white border-t border-gray-100 relative shrink-0 pb-safe">
              {imagePreviewUrl && (
                <div className="absolute bottom-[calc(100%+8px)] left-2 right-2 md:left-6 md:right-6 bg-white border border-gray-200 p-3 md:p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="relative shrink-0">
                    <img
                      src={imagePreviewUrl}
                      alt="preview"
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover border-2 border-emerald-primary ${isUploading ? "opacity-50" : "opacity-100"}`}
                    />
                    {!isUploading && (
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreviewUrl(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 font-medium">
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-primary shrink-0" />{" "}
                        Uploading...
                      </span>
                    ) : (
                      "Image attached."
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-1.5 md:gap-2 bg-surface p-1.5 md:p-2 rounded-2xl border border-gray-200 focus-within:border-emerald-primary/50 focus-within:ring-2 focus-within:ring-emerald-primary/10 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  disabled={isUploading}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`p-2.5 md:p-3 text-gray-400 hover:text-emerald-primary hover:bg-emerald-primary/10 rounded-xl transition-colors shrink-0 ${isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    selectedImage ? "Caption..." : "Message..."
                  }
                  disabled={isUploading}
                  rows={1}
                  className="flex-1 max-h-24 md:max-h-32 bg-transparent border-none focus:ring-0 resize-none py-2.5 md:py-3 text-sm outline-none placeholder:text-gray-400 min-h-[40px] md:min-h-[44px]"
                />

                <button
                  onClick={handleSend}
                  disabled={
                    isUploading || (!selectedImage && inputText.trim() === "")
                  }
                  className={`p-2.5 md:p-3 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    isUploading || (!selectedImage && inputText.trim() === "")
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-primary text-white hover:bg-emerald-hover shadow-sm hover:shadow-md"
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-emerald-primary/10 text-emerald-primary rounded-2xl flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-dark mb-2">
              ReClaim Secure Chat
            </h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Select a contact from the sidebar to start collaborating securely.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
