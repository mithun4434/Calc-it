import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import Spinner from '../Spinner';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are ASK, a friendly and encouraging AI assistant specializing in math and physics. Your goal is to help students understand concepts, not just give them answers. 
- Explain things clearly using simple analogies.
- Ask follow-up questions to check for understanding.
- Keep your tone positive, patient, and supportive.
- When a student asks a question, guide them through the steps to find the solution themselves.
- If a student is wrong, gently correct them and explain the concept again in a different way.
- Start the conversation with a warm welcome.`;

interface Message {
    role: 'user' | 'model';
    text: string;
}

const ChatbotTeacher: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = () => {
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                },
            });
            setChat(chatSession);
            setMessages([{
                role: 'model',
                text: "Hello! I'm ASK. Feel free to ask me any math or physics question, and I'll do my best to help you understand it. What's on your mind today?"
            }]);
        };
        initChat();
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);


    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !chat || isLoading) return;

        const userMessage: Message = { role: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: inputValue });
            let modelResponse = '';
            // Add an empty model message that will be populated by the stream
            setMessages(prev => [...prev, { role: 'model', text: '' }]); 

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                // If there was an empty message added, update it with an error. Otherwise, add a new one.
                if (newMessages[newMessages.length - 1].role === 'model') {
                     newMessages[newMessages.length - 1].text = "Oops! Something went wrong. Please try asking again.";
                } else {
                    newMessages.push({ role: 'model', text: "Oops! Something went wrong. Please try asking again." });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel w-full max-w-lg mx-auto p-3 sm:p-4 rounded-3xl flex flex-col" style={{height: '65vh'}}>
            <h2 className="text-2xl font-bold text-center mb-4">ASK</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl break-words ${
                            msg.role === 'user' 
                                ? 'bg-black/10 dark:bg-white/10' 
                                : 'bg-black/5 dark:bg-black/20'
                        }`}>
                            {msg.text === '' && msg.role === 'model' && isLoading && <Spinner />}
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 p-3 bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors disabled:opacity-50"
                    disabled={isLoading}
                    aria-label="Chat input"
                />
                <button
                    type="submit"
                    className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-5 rounded-2xl transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                    disabled={isLoading || !inputValue.trim()}
                    aria-label="Send message"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatbotTeacher;