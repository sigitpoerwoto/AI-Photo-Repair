import React, { useState } from 'react';
import { editImage, analyzeAndSuggestEdits } from '../services/geminiService';
import ImageUpload from './ImageUpload';
import { Spinner, UndoIcon, RedoIcon, RefreshIcon } from '../assets/icons';

const presets = [
    {
        name: 'Potret Kualitas DSLR',
        prompt: 'Edit this photo into a professional portrait of very high quality and Color, comparable to the results of Canon EOS R5. Create like a recent photo, with great clarity and no noise. Produce razor-sharp photos. Full HD 32k'
    },
    {
        name: 'Potret Studio Master',
        prompt: "Transform this into a professional studio portrait with the quality of a Canon EOS R5 camera and a 50mm f/1.8 lens. Crucially, do not change the person's face, identity, or pose. The composition should be a three-quarter body shot. Perform a master retouch: create smooth, radiant skin while keeping natural texture; enhance hair, eyes, and teeth subtly. Upgrade the clothing's fabric quality without changing its style or color. Relight the subject with soft, even, frontal studio lighting. Replace the background with a solid navy blue (#0f2a4a) studio backdrop. The final image should be ultra-sharp, with natural colors, medium contrast, and no noise or artifacts. Avoid plastic skin, over-whitened eyes, and harsh shadows."
    },
    {
        name: 'Fokus Otomatis AI',
        prompt: 'Enhance this blurred image'
    },
    {
        name: 'Remaster Digital',
        prompt: 'Restore the old photo to high resolution modern digital camera with three point lighting setup. Restore and refine the background and make the image realistic.'
    },
    {
        name: 'Perspektif Drone',
        prompt: 'Change the angle to a top-down angle'
    },
    {
        name: 'Restorasi Kekinian',
        prompt: 'Please edit my old photo into 1080 x 1920 pixels, with an aesthetic and modern photography look, making it appear authentic and enhancing the colors.'
    },
    {
        name: 'Pusaka Digital',
        prompt: 'Restore this old, damaged photo: repair scratches, enhance clarity, add natural colors, make it look modern and authentic in 1080x1920 resolution. Keep facial features realistic.'
    },
    {
        name: 'Penyelamat Memori',
        prompt: 'Restore this old damaged photo. Fix scratches, improve quality, enhance details, and colorize if needed.'
    },
    {
        name: 'Restorasi Setia',
        prompt: 'Ultra-realistic respectful restoration, keep face, gaze, features and pose 100% identical, no changes. Remove torn borders, natural modern colors, realistic skin. High-res, photorealistic, as if shot in 2025 with Canon EOS R5 + RF 85mm f/1.2, soft diffused studio light.'
    },
    {
        name: 'Kapsul Waktu',
        prompt: `Analyze the uploaded photo and perform full restoration.
Detect and correct the following issues if
present:
Scratches
Dust or dirt spots
Fold marks or creases
Missing or torn areas
Discoloration or yellowing
Faded or blurry sections
Black and white only (if so, fully colorize it)
Enhance the photo by:
Restoring original skin tones and clothing
colors.`
    },
    {
        name: 'Potret Keluarga Hangat',
        prompt: 'Restore this old photo of human subject or subjects, into colorized version. Set warm lighting, and Keep their neutral expressions and make it look like a fresh, high-quality family portrait.'
    },
    {
        name: 'Penyempurnaan Realistis',
        prompt: `Fixing damaged facial details and body parts with natural reconstruction
Removing visual noise and sharpening the image
Reconstructing missing background elements based on context
Matching textures and lighting seamlessly
Final image must look natural, modern, fully colored, and emotionally resonant.
Preserve all facial structure and identity from the original.
Composition and proportions must remain intact.
Use soft ambient lighting with high-definition clarity.`
    }
];

const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type });
};

const EditImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [allSuggestions, setAllSuggestions] = useState<string[]>([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [areSuggestionsVisible, setAreSuggestionsVisible] = useState(true);
    const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);

    const handleImageSelect = async (selectedFile: File | null) => {
        setFile(selectedFile);
        setError(null);
        setAnalysis(null);
        setAllSuggestions([]);
        setFilteredSuggestions([]);
        setPrompt('');
        setHistory([]);
        setHistoryIndex(-1);
        
        if (selectedFile) {
            setIsAnalyzing(true);
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    setHistory([dataUrl]);
                    setHistoryIndex(0);
                };
                reader.readAsDataURL(selectedFile);

                const result = await analyzeAndSuggestEdits(selectedFile);
                setAnalysis(result.analysis);
                setAllSuggestions(result.suggestions);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleRefreshSuggestions = async () => {
        if (!file) return;
        setIsRefreshingSuggestions(true);
        setError(null);
        try {
            const result = await analyzeAndSuggestEdits(file, allSuggestions);
            setAnalysis(result.analysis);
            setAllSuggestions(result.suggestions);
        } catch (err) {
             setError((err as Error).message);
        } finally {
            setIsRefreshingSuggestions(false);
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setPrompt(value);
        setAreSuggestionsVisible(true);

        if (value.trim() === '') {
            setFilteredSuggestions([]);
            return;
        }

        const searchTerms = value.toLowerCase().split(' ').filter(term => term.length > 1);
        const filtered = allSuggestions.filter(suggestion => 
            searchTerms.some(term => suggestion.toLowerCase().includes(term))
        ).slice(0, 5);
        
        setFilteredSuggestions(filtered);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(prev => (prev.trim() ? `${prev.trim()}, ${suggestion}` : suggestion));
        setFilteredSuggestions([]);
        setAreSuggestionsVisible(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !prompt || historyIndex < 0) {
            setError('Silakan unggah gambar dan masukkan instruksi pengeditan.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const currentImage = history[historyIndex];
            const imageFileToEdit = await dataUrlToFile(currentImage, file.name);

            const imageUrl = await editImage(imageFileToEdit, prompt);

            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(imageUrl);
            
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };
    
    const handleDownload = (format: 'png' | 'jpeg') => {
        if (!currentImage) return;

        const fileName = `edited-image-${Date.now()}.${format}`;

        // The API returns a PNG, so direct download for PNG is easy.
        if (format === 'png') {
            const link = document.createElement('a');
            link.href = currentImage;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // For JPEG, we need to convert using a canvas.
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // JPG doesn't support transparency, so we fill the background with white.
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality
                
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        };
        img.onerror = () => {
            setError("Gagal memuat gambar untuk konversi. Silakan coba unduh sebagai PNG.");
        };
        img.src = currentImage;
    };


    const currentImage = history[historyIndex];
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Edit & Pulihkan Gambar</h2>
                <p className="text-gray-400">Unggah foto, dapatkan saran berbasis AI, dan jelaskan perubahan yang Anda inginkan.</p>
            </div>

            <ImageUpload 
                onImageSelect={handleImageSelect as any}
                title="Klik untuk mengunggah atau seret dan lepas"
                description="PNG, JPG atau WEBP"
            />

            {isAnalyzing && (
                <div className="text-center p-8 bg-gray-700/50 rounded-lg">
                    <Spinner className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="mt-4 text-gray-300">Menganalisis gambar Anda untuk saran pengeditan...</p>
                </div>
            )}

            {analysis && (
                <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-indigo-300">💡 Analisis & Saran AI</h3>
                        <button
                            onClick={handleRefreshSuggestions}
                            disabled={isRefreshingSuggestions}
                            className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 disabled:text-gray-500 disabled:cursor-wait transition-colors"
                            title="Dapatkan saran baru"
                        >
                            <RefreshIcon className={`w-4 h-4 ${isRefreshingSuggestions ? 'animate-spin' : ''}`} />
                            <span>Saran Baru</span>
                        </button>
                    </div>
                    <p className="text-sm text-gray-400 border-l-2 border-indigo-500 pl-3 italic">{analysis}</p>
                    <p className="text-sm text-gray-300 pt-2">Berikut {allSuggestions.length} ide untuk Anda mulai:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-400 list-disc list-inside">
                        {allSuggestions.slice(0, 16).map((s, i) => <li key={i}><button onClick={() => handleSuggestionClick(s)} className="text-left hover:text-indigo-300 transition-colors">{s}</button></li>)}
                    </ul>
                </div>
            )}

            {file && !isAnalyzing && (
                <>
                    {presets.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-base font-semibold text-gray-300">Preset Cepat</h3>
                            <div className="flex flex-wrap gap-2">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => {
                                            setPrompt(preset.prompt);
                                            setAreSuggestionsVisible(false);
                                        }}
                                        className="bg-gray-700 text-gray-300 hover:bg-indigo-600 hover:text-white text-sm px-3 py-1.5 rounded-md transition-all duration-200"
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">Instruksi Pengeditan</label>
                            <textarea
                                id="edit-prompt"
                                value={prompt}
                                onChange={handlePromptChange}
                                onFocus={() => setAreSuggestionsVisible(true)}
                                onBlur={() => setTimeout(() => setAreSuggestionsVisible(false), 200)}
                                placeholder="Jelaskan editan Anda, atau ketik untuk melihat saran yang relevan..."
                                className="w-full bg-gray-900 text-white border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                rows={3}
                            />
                            {areSuggestionsVisible && filteredSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    <ul className="py-1">
                                        {filteredSuggestions.map((suggestion, index) => (
                                            <li
                                                key={index}
                                                onMouseDown={() => handleSuggestionClick(suggestion)}
                                                className="px-4 py-2 text-sm text-gray-300 cursor-pointer hover:bg-indigo-600 hover:text-white"
                                            >
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? <><Spinner className="w-5 h-5"/> Menerapkan Editan...</> : 'Terapkan Editan'}
                        </button>
                    </form>
                </>
            )}

            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}
            
            {isLoading && (
                 <div className="text-center p-8 bg-gray-700/50 rounded-lg">
                    <Spinner className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="mt-4 text-gray-300">AI sedang bekerja... Mohon tunggu.</p>
                </div>
            )}

            {currentImage && (
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Hasil:</h3>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleUndo} 
                                disabled={!canUndo}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                aria-label="Undo"
                            >
                                <UndoIcon className="w-4 h-4" />
                                <span>Mundur</span>
                            </button>
                            <button 
                                onClick={handleRedo} 
                                disabled={!canRedo}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                aria-label="Redo"
                            >
                                <RedoIcon className="w-4 h-4" />
                                <span>Maju</span>
                            </button>
                        </div>
                    </div>
                    <img src={currentImage} alt="Edited" className="w-full h-auto rounded-lg shadow-lg" />
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <p className="text-sm text-gray-400">Unduh sebagai:</p>
                        <button
                            onClick={() => handleDownload('png')}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition text-sm font-medium"
                        >
                            PNG
                        </button>
                        <button
                            onClick={() => handleDownload('jpeg')}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition text-sm font-medium"
                        >
                            JPG
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditImage;