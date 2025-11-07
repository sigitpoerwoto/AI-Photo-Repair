import React, { useState, useEffect } from 'react';
import { analyzeImage } from '../services/geminiService';
import ImageUpload from './ImageUpload';
import { Spinner } from '../assets/icons';

const AnalyzeImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!file) return;

        const getAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            setAnalysis(null);
            try {
                const result = await analyzeImage(file);
                setAnalysis(result);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        };

        getAnalysis();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const handleImageSelect = (selectedFile: File) => {
        setFile(selectedFile);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-1">Analisis Gambar</h2>
                <p className="text-gray-400">Dapatkan deskripsi detail gambar Anda, didukung oleh pemahaman Gemini.</p>
            </div>
            
            <ImageUpload 
                onImageSelect={handleImageSelect}
                title="Unggah gambar untuk dianalisis"
                description="Deskripsi akan dibuat secara otomatis."
            />
            
            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</div>}
            
            {isLoading && (
                <div className="text-center p-8 bg-gray-700/50 rounded-lg">
                    <Spinner className="w-8 h-8 text-indigo-400 mx-auto" />
                    <p className="mt-4 text-gray-300">Menganalisis gambar... Proses ini seharusnya cepat.</p>
                </div>
            )}

            {analysis && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Hasil Analisis:</h3>
                    <div className="bg-gray-900/70 p-4 rounded-lg prose prose-invert max-w-none prose-p:text-gray-300">
                        <p>{analysis}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzeImage;