import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// 1. Interface expects 'id' and 'name'
export interface TargetUser {
    id: string;   
    name: string;
}

interface ChatPopupContextType {
    isOpen: boolean;
    targetUser: TargetUser | null;
    openChatPopup: (id: string, name: string) => void;
    closeChatPopup: () => void;
}

const ChatPopupContext = createContext<ChatPopupContextType | undefined>(undefined);

export const ChatPopupProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<TargetUser | null>(null);

    // 2. Here we receive 'id' (which can be the clerkId) and set it to 'id'
    const openChatPopup = (id: string, name: string) => {
        setTargetUser({ id, name }); // Mapping to match the TargetUser interface
        setIsOpen(true);
    };

    const closeChatPopup = () => {
        setIsOpen(false);
        setTargetUser(null);
    };

    return (
        <ChatPopupContext.Provider value={{ isOpen, targetUser, openChatPopup, closeChatPopup }}>
            {children}
        </ChatPopupContext.Provider>
    );
};

export const useChatPopup = () => {
    const context = useContext(ChatPopupContext);
    if (context === undefined) {
        throw new Error('useChatPopup must be used within a ChatPopupProvider');
    }
    return context;
};