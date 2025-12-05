
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI, Chat, Part, Content } from "@google/genai";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Spinner from '../Spinner';
import InputWrapper from '../InputWrapper';
import UploadIcon from '../icons/UploadIcon';
import CameraIcon from '../icons/CameraIcon';
import ClearIcon from '../icons/ClearIcon';
import { getSystemApiKey } from '../../services/geminiService';

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
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const aiRef = useRef<GoogleGenAI | null>(null);

    // Track the current model being used
    const [currentModel, setCurrentModel] = useState<'gemini-2.5-flash' | 'gemini-1.5-flash'>('gemini-2.5-flash');

    // Initialize AI and Chat
    useEffect(() => {
        const initChat = () => {
            const apiKey = getSystemApiKey();
            if (!apiKey) {
                setError("API Key is missing. Please ensure `API_KEY` is set in your environment variables or .env file.");
                setMessages([{
                    role: 'model',
                    text: "I cannot connect because the API Key is missing from the environment settings."
                }]);
                return;
            }

            try {
                aiRef.current = new GoogleGenAI({ apiKey });
                const chatSession = aiRef.current.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: systemInstruction,
                    },
                });
                setChat(chatSession);
                setMessages([{
                    role: 'model',
                    text: "Hello! I'm MIT. Feel free to ask me any math or physics question, or upload an image of a problem, and I'll do my best to help you understand it. What's on your mind today?"
                }]);
            } catch (e: any) {
                setError(e.message);
                setMessages([{
                    role: 'model',
                    text: "Error initializing chat. Please try refreshing the page."
                }]);
            }
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
        }
    };

    /**
     * Converts our local Message state into the format required by the Google GenAI SDK history.
     */
    const getHistoryForFallback = (msgs: Message[]): Content[] => {
        return msgs
            .filter((m, i) => i > 0 && m.text) // Skip index 0 (welcome)
            .map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !imageToSend) || !chat || isLoading) return;

        const userMessageText = inputValue.trim();
        const userImage = imageToSend;

        // Add user message to UI immediately
        const userMessage: Message = { role: 'user', text: userMessageText, image: userImage || undefined };
        setMessages(prev => [...prev, userMessage, { role: 'model', text: '' }]);

        setInputValue('');
        setImageToSend(null);
        setIsLoading(true);

        const parts: Part[] = [];
        if (userMessageText) {
            parts.push({ text: userMessageText });
        }
        if (userImage) {
            try {
                const [header, data] = userImage.split(',');
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (mimeTypeMatch && mimeTypeMatch[1]) {
                    parts.push({ inlineData: { data, mimeType: mimeTypeMatch[1] } });
                }
            } catch (err) {
                console.error("Error parsing image for send", err);
            }
        }

        const executeSendMessage = async (activeChat: Chat, isRetry = false): Promise<void> => {
            try {
                const stream = await activeChat.sendMessageStream({ message: parts });
                let modelResponse = '';

                for await (const chunk of stream) {
                    if (chunk.text) {
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
                }
            } catch (error: any) {
                console.warn(`Chat Error (Model: ${currentModel}):`, error);

                // If this wasn't a retry and we are on the Pro model, try falling back to Flash
                if (!isRetry && currentModel === 'gemini-2.5-flash' && aiRef.current) {
                    console.log("Attempting fallback to gemini-1.5-flash...");

                    try {
                        // Create new chat with history
                        const history = getHistoryForFallback(messages);
                        const fallbackChat = aiRef.current.chats.create({
                            model: 'gemini-1.5-flash',
                            config: { systemInstruction: systemInstruction },
                            history: history
                        });

                        setChat(fallbackChat);
                        setCurrentModel('gemini-1.5-flash');

                        // Retry sending the message with the new chat
                        await executeSendMessage(fallbackChat, true);
                        return;
                    } catch (fallbackError) {
                        console.error("Fallback initialization failed:", fallbackError);
                    }
                }

                // If fallback failed or we are already on fallback
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    const errorMessage = "I'm having trouble connecting to the server. This might be due to high traffic or deployment settings.";
                    if (lastMessage && lastMessage.role === 'model') {
                        lastMessage.text = errorMessage;
                    }
                    return newMessages;
                });
            }
        };

        await executeSendMessage(chat);
        setIsLoading(false);
    };

    const iconicButtonClasses = "p-3 bg-black/10 dark:bg-black/20 border border-current/10 rounded-2xl transition-colors disabled:opacity-50 hover:bg-black/20 dark:hover:bg-white/20";

    if (error) {
        return (
            <div className="glass-panel w-full max-w-lg mx-auto p-6 rounded-3xl flex flex-col items-center justify-center text-center">
                <h2 className="text-xl font-bold text-red-500 mb-2">Configuration Error</h2>
                <p className="opacity-80">{error}</p>
            </div>
        );
    }

    return (
        <div className="glass-panel w-full max-w-lg mx-auto p-3 sm:p-4 rounded-3xl flex flex-col h-full">
            <h2 className="text-2xl font-bold text-center mb-4">MIT</h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl break-words ${msg.role === 'user'
                            ? 'bg-black/10 dark:bg-white/10'
                            : 'bg-black/5 dark:bg-black/20'
                            }`}>
                            {msg.image && (
                                <img src={msg.image} alt="User upload" className="rounded-lg mb-2 max-w-full h-auto" />
                            )}
                            {msg.text === '' && msg.role === 'model' && isLoading && (
                                <div className="flex items-center gap-2 text-sm opacity-70">
                                    <Spinner />
                                    <span>Thinking...</span>
                                </div>
                            )}
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