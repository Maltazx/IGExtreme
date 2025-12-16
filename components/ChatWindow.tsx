
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface ChatWindowProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    onClose?: () => void;
    title: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, onClose, title }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl border border-gray-200">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                {onClose && (
                    <button onClick={onClose} className="px-2 rounded-full text-gray-500 hover:bg-gray-200 font-bold">
                       X
                    </button>
                )}
            </header>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-100/50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'client' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'client' ? 'bg-white shadow-sm' : 'bg-primary text-gray-800'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-dark"
                    />
                    <button type="submit" className="ml-3 px-5 py-2 bg-primary-dark text-white font-semibold rounded-full hover:bg-yellow-600 transition-colors">
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;