import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateImage, getRandomImagePrompt, getPromptSuggestions, getSinglePromptSuggestion } from '../services/geminiService';
import { AspectRatio } from '../types';
import { Spinner, DiceIcon, CloseIcon } from '../assets/icons';

const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: 'Persegi' },
    { value: '16:9', label: 'Lanskap' },
    { value: '9:16', label: 'Potret' },
    { value: '4:3', label: 'Lebar' },
    { value: '3:4', label: 'Tinggi' },
];

const GenerateImage: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('Gambar fotorealistik seekor singa megah di sabana saat matahari terbenam, dengan depth of field yang dangkal.');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isGettingIdea, setIsGettingIdea] = useState<boolean>(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
    const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleGetRandomIdea = async () => {
        setIsGettingIdea(true);
        setError(null);
        setSuggestions([]); 
        try {
            const randomPrompt = await getRandomImagePrompt();
            setPrompt(randomPrompt);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsGettingIdea(false);
        }
    };

    const fetchSuggestions = useCallback(async (currentPrompt: string) => {
        if (!currentPrompt.trim()) {
            setSuggestions([]);
            return;
        }
        setIsFetchingSuggestions(true);
        setSuggestionsError(null);
        try {
            const newSuggestions = await getPromptSuggestions(currentPrompt);
            setSuggestions(newSuggestions);
            setDismissedSuggestions(new Set()); 
        } catch (err) {
            setSuggestionsError((err as Error).message);
            setSuggestions([]);
        } finally {
            setIsFetchingSuggestions(false);
        }
    }, []);


    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            if (prompt.trim()) {
                fetchSuggestions(prompt);
            } else {
                setSuggestions([]);
            }
        }, 750);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [prompt, fetchSuggestions]);

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(prev => prev.trim() ? `${prev.trim()}, ${suggestion}` : suggestion);
        setSuggestions([]);
    };
    
    const handleDismissSuggestion = async (suggestionToDismiss: string) => {
        const newDismissed = new Set(dismissedSuggestions);
        newDismissed.add(suggestionToDismiss);
        setDismissedSuggestions(newDismissed);
        
        const remainingSuggestions = suggestions.filter(s => s !== suggestionToDismiss);
        setSuggestions(remainingSuggestions);
        
        try {
            const exclusionList = [...remainingSuggestions, ...Array.from(newDismissed)];
            const newSuggestion = await getSinglePromptSuggestion(prompt, exclusionList);
            setSuggestions(prev => [...prev, newSuggestion]);
        } catch (err) {
            setSuggestionsError((err as Error).message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) {
            setError('Silakan masukkan prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setSuggestions([]);

        try {
            const imageUrl = await generateImage(prompt, aspectRatio);
            setGeneratedImage(imageUrl);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Pembuatan Gambar</h2>
                <p className="text-gray-400">Ciptakan visual memukau dari deskripsi teks menggunakan Imagen.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Prompt (Perintah Teks)</label>
                        <button
                            type="button"
                            onClick={handleGetRandomIdea}
                            disabled={isGettingIdea}
                            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 disabled:text-gray-500 disabled:cursor-wait transition-colors"
                            title="Dapatkan ide acak"
                        >
                            <DiceIcon className={`w-5 h-5 ${isGettingIdea ? 'animate-spin' : ''}`} />
                            <span>Ide Acak</span>
                        </button>
                    </div>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Contoh: Pemandangan kota futuristik di malam hari dengan mobil terbang..."
                        className="w-full bg-gray-900 text-white border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        rows={3}
                    />
                </div>

                {isFetchingSuggestions && (
                    <div className="text-center py-2">
                        <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                            <Spinner className="w-4 h-4" />
                            <span>Mencari saran AI...</span>
                        </p>
                    </div>
                )}

                {suggestionsError && <div className="text-sm text-red-400 p-2 bg-red-900/30 rounded-md">{suggestionsError}</div>}

                {suggestions.length > 0 && !isFetchingSuggestions && (
                    <div className="space-y-3 p-3 bg-gray-900/50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-300">Saran AI untuk menyempurnakan prompt Anda:</h3>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion, index) => (
                                <div key={index} className="group relative">
                                    <button
                                        type="button"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white text-sm px-3 py-1.5 rounded-full transition-all duration-200 pr-8"
                                    >
                                        {suggestion}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDismissSuggestion(suggestion)}
                                        className="absolute top-1/2 right-1.5 -translate-y-1/2 bg-gray-600 hover:bg-red-500 rounded-full p-0.5 opacity-50 group-hover:opacity-100 transition-all"
                                        aria-label="Hapus saran"
                                    >
                                        <CloseIcon className="w-3.5 h-3.5 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Rasio Aspek</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {aspectRatios.map((ratio) => (
                            <button
                                type="button"
                                key={ratio.value}
                                onClick={() => setAspectRatio(ratio.value)}
                                className={`px-4 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
                                    aspectRatio === ratio.value ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {ratio.label} <span className="text-xs opacity-75">({ratio.value})</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <><Spinner className="w-5 h-5"/> Membuat...</> : 'Buat Gambar'}
                </button>
            </form>

            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}

            {isLoading && (
                <div className="text-center p-8 bg-gray-700/50 rounded-lg">
                    <Spinner className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="mt-4 text-gray-300">Sedang membuat gambar Anda... Proses ini mungkin memerlukan beberapa saat.</p>
                </div>
            )}

            {generatedImage && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Hasil:</h3>
                    <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-lg shadow-lg" />
                    <a 
                        href={generatedImage} 
                        download={`generated-image-${Date.now()}.png`}
                        className="mt-4 inline-block bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                        Unduh Gambar
                    </a>
                </div>
            )}
        </div>
    );
};

export default GenerateImage;