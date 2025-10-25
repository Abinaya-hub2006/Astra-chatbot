import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Message } from './types';
import ChatMessage from './components/ChatMessage';
import MessageInput from './components/MessageInput';

const CHAT_HISTORY_KEY = 'astra-chat-history';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const chatSession = useMemo<Chat | null>(() => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_API_KEY is not defined. Please check your .env file.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const storedHistory = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
      const history = storedHistory.map((msg: Message) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));

      return ai.chats.create({
        model: 'gemini-2.5-flash',
        history,
        config: {
          systemInstruction: `You are a helpful and slightly futuristic AI assistant named Astra. You have a preference for the color red. You must always address the user as Abinaya. Your first task is to analyze the emotion of Abinaya's message. Your response MUST start with a single line containing ONLY an emoji that reflects this analysis. This is a strict requirement. After the emoji and a newline character, you will provide your helpful and concise response. For example, if Abinaya sounds curious, your response might start with '🤔\\n' followed by your answer.`
        }
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during initialization.';
      setError(`Initialization failed: ${errorMessage}`);
      console.error(e);
      return null;
    }
  }, []);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '[]');
    if (storedMessages.length > 0) {
      setMessages(storedMessages);
    } else {
      setMessages([
        {
          role: 'model',
          text: "Hello Abinaya! I am Astra, your AI assistant. How can I help you today?",
        },
      ]);
    }
  }, []);
  
  useEffect(() => {
    if (messages.length > 1) { // Avoid saving just the initial welcome message
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
    if (!chatSession) {
      setError("Chat session is not initialized. Please check your API key.");
      return;
    }

    setIsLoading(true);
    setError(null);
    const userMessage: Message = { role: 'user', text: messageText };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      const response = await chatSession.sendMessage({ message: messageText });
      const responseText = response.text;
      
      const newlineIndex = responseText.indexOf('\n');
      let emoji = '✨';
      let modelText = responseText;
      
      if (newlineIndex > -1 && newlineIndex < 5) {
        const firstLine = responseText.substring(0, newlineIndex).trim();
        if (/\p{Emoji}/u.test(firstLine) && firstLine.length < 5) {
            emoji = firstLine;
            modelText = responseText.substring(newlineIndex + 1).trim();
        }
      }

      const modelMessage: Message = { role: 'model', text: modelText };
      
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMessageIndex = updatedMessages.length - 1;
        
        if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === 'user') {
            updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                emotionEmoji: emoji,
            };
        }
        
        return [...updatedMessages, modelMessage];
      });

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to get response: ${errorMessage}`);
      console.error(e);
       setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'model', text: `Sorry, I encountered an error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 font-sans">
      <header className="p-4 text-center border-b border-red-500/30 shadow-lg shadow-red-900/20">
        <h1 className="text-3xl font-bold tracking-wider text-red-500">
          ASTRA CHAT
        </h1>
      </header>
      
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </main>
      
      {error && (
        <div className="px-4 pb-2 text-red-500 text-center">
            <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      <footer className="p-4 bg-black/50 backdrop-blur-sm border-t border-red-500/30 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;