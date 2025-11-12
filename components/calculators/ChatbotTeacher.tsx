import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat, Part } from "@google/genai";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Spinner from '../Spinner';
import InputWrapper from '../InputWrapper';
import UploadIcon from '../icons/UploadIcon';
import CameraIcon from '../icons/CameraIcon';
import ClearIcon from '../icons/ClearIcon';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are MIT (Math & Inquiry Tutor), a friendly and encouraging AI assistant specializing in math and physics. Your goal is to help students understand concepts, not just give them answers.
- Explain things clearly using simple analogies.
- Ask follow-up questions to check for understanding.
- If the user uploads an image, analyze it and discuss the problem shown.
- Keep your tone positive, patient, and supportive.
- When a student asks a question, guide them through the steps to find the solution themselves.
- If a student is wrong, gently correct them and explain the concept again in a different way.
- Start the conversation with a warm welcome.`;

interface Message {
    role: 'user' | 'model';
    text: string;
    image?: string;
}

const MITChat: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [imageToSend, setImageToSend] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = () => {
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-pro',
                config: {
                    systemInstruction: systemInstruction,
                },
            });
            setChat(chatSession);
            setMessages([{
                role: 'model',
                text: "Hello! I'm MIT. Feel free to ask me any math or physics question, or upload an image of a problem, and I'll do my best to help you understand it. What's on your mind today?"
            }]);
        };
        initChat();
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (typeof event.target?.result === 'string') {
                    setImageToSend(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = async () => {
        try {
            const photo = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.DataUrl,
                source: CameraSource.Camera,
            });
            if (photo.dataUrl) {
                setImageToSend(photo.dataUrl);
            }
        } catch (error) {
            console.error('Camera capture failed:', error);
            // Optionally, display an error message to the user in the chat
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !imageToSend) || !chat || isLoading) return;

        const userMessage: Message = { role: 'user', text: inputValue, image: imageToSend || undefined };
        const currentImage = imageToSend;
        
        setMessages(prev => [...prev, userMessage, { role: 'model', text: '' }]);
        setInputValue('');
        setImageToSend(null);
        setIsLoading(true);

        try {
            const parts: Part[] = [];
            if (inputValue.trim()) {
                parts.push({ text: inputValue.trim() });
            }
            if (currentImage) {
                const [header, data] = currentImage.split(',');
                if (!header || !data) throw new Error('Invalid image data URL format.');
                
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error('Could not extract MIME type from image data URL.');
                
                parts.push({ inlineData: { data, mimeType: mimeTypeMatch[1] } });
            }

            const stream = await chat.sendMessageStream({ message: parts });
            let modelResponse = '';

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage) {
                        lastMessage.text = modelResponse;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.text = "Oops! Something went wrong. Please try asking again.";
                } else {
                    newMessages.push({ role: 'model', text: "Oops! Something went wrong. Please try asking again." });
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const iconicButtonClasses = "p-3 bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl transition-colors disabled:opacity-50 hover:bg-black/20 dark:hover:bg-white/20";

    return (
        <div className="glass-panel w-full max-w-lg mx-auto p-3 sm:p-4 rounded-3xl flex flex-col h-full">
            <h2 className="text-2xl font-bold text-center mb-4">MIT</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl break-words ${
                            msg.role === 'user' 
                                ? 'bg-black/10 dark:bg-white/10' 
                                : 'bg-black/5 dark:bg-black/20'
                        }`}>
                            {msg.image && (
                                <img src={msg.image} alt="User upload" className="rounded-lg mb-2 max-w-full h-auto" />
                            )}
                            {msg.text === '' && msg.role === 'model' && isLoading && <Spinner />}
                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4">
                 {imageToSend && (
                    <div className="relative mb-2 w-24 h-24 p-1 border border-current/20 rounded-lg">
                        <img src={imageToSend} alt="Preview" className="w-full h-full object-cover rounded-md" />
                        <button
                            onClick={() => setImageToSend(null)}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full transition-transform active:scale-90"
                            aria-label="Remove image"
                        >
                            <ClearIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <InputWrapper className="flex-1" value={inputValue} onClear={() => setInputValue('')} disabled={isLoading}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask a question..."
                            className="w-full p-3 bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-colors disabled:opacity-50"
                            disabled={isLoading}
                            aria-label="Chat input"
                        />
                    </InputWrapper>
                    <label htmlFor="mit-image-upload" className={`${iconicButtonClasses} ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <UploadIcon />
                    </label>
                    <input id="mit-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLoading} />

                    <button type="button" onClick={handleCameraCapture} disabled={isLoading} className={iconicButtonClasses} aria-label="Use camera">
                        <CameraIcon />
                    </button>
                    <button
                        type="submit"
                        className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-5 rounded-2xl transition-all duration-300 flex items-center justify-center disabled:opacity-50"
                        disabled={isLoading || (!inputValue.trim() && !imageToSend)}
                        aria-label="Send message"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MITChat;
