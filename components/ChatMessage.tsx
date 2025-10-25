import React from 'react';
import type { Message } from '../types';
import BotIcon from './icons/BotIcon';
import UserIcon from './icons/UserIcon';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const wrapperClasses = isUser ? 'flex-row-reverse' : 'flex-row';
  const avatarClasses = isUser ? 'ml-3 bg-red-900 text-red-300' : 'mr-3 bg-gray-700 text-gray-300';
  const bubbleClasses = isUser
    ? 'bg-red-900/50 rounded-br-none'
    : 'bg-gray-800 rounded-bl-none';

  return (
    <div className={`flex items-start my-4 animate-fade-in ${wrapperClasses}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center self-end ${avatarClasses}`}>
        {isUser ? <UserIcon className="w-6 h-6" /> : <BotIcon className="w-6 h-6" />}
      </div>
      <div className="flex flex-col">
        <div className={`px-4 py-3 rounded-2xl max-w-lg md:max-w-xl lg:max-w-2xl text-white whitespace-pre-wrap ${bubbleClasses}`}>
          {message.text}
        </div>
      </div>
      {isUser && message.emotionEmoji && (
         <div className="self-end text-2xl mx-2 animate-pop-in" title={`Analyzed emotion: ${message.emotionEmoji}`}>
            {message.emotionEmoji}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;