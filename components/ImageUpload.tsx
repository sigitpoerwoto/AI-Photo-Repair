import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, Spinner } from '../assets/icons';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  title: string;
  description: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, title, description }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      onImageSelect(file);
      // Reset URL state if a file is uploaded
      setImageUrl('');
      setUrlError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  }, []);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
        setUrlError("Silakan masukkan URL.");
        return;
    }
    setIsFetchingUrl(true);
    setUrlError(null);

    try {
        // Using a cors-anywhere proxy for demo purposes. 
        // In a real application, this should be a managed server-side proxy.
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Gagal mengambil gambar. Status: ${response.status}`);
        }
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            throw new Error('File yang diambil bukan gambar yang valid.');
        }
        
        const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || 'image_from_url';
        const imageFile = new File([blob], fileName, { type: blob.type });
        processFile(imageFile);

    } catch (error) {
        console.error("URL fetch error:", error);
        setUrlError("Gagal memuat gambar dari URL. Ini mungkin disebabkan oleh masalah jaringan atau kebijakan CORS. Silakan coba URL lain.");
    } finally {
        setIsFetchingUrl(false);
    }
  };


  return (
    <div className="w-full space-y-4">
      {imagePreview ? (
        <div className="text-center">
            <img src={imagePreview} alt="Preview" className="max-h-80 w-auto mx-auto rounded-lg shadow-lg mb-4" />
            <button
                onClick={() => {
                  setImagePreview(null);
                  onImageSelect(null as any); // Clear parent state
                  if(fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
                Ulangi
            </button>
        </div>
      ) : (
        <>
            <label
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragging ? 'border-indigo-400 bg-gray-700/50' : 'border-gray-600 bg-gray-700/20 hover:border-gray-500'
                }`}
            >
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400 font-semibold">{title}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 bg-indigo-600 text-white px-4 py-2 text-sm rounded-md hover:bg-indigo-700 transition"
                    >
                        Pilih dari Komputer
                    </button>
                </div>
            </label>

            <div className="flex items-center text-gray-500">
                <hr className="flex-grow border-t border-gray-600" />
                <span className="px-3 text-sm">ATAU</span>
                <hr className="flex-grow border-t border-gray-600" />
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-2">
                <div>
                  <label htmlFor='image-url' className="sr-only">URL Gambar</label>
                  <div className="flex gap-2">
                      <input
                          id="image-url"
                          type="text"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Tempelkan URL gambar di sini"
                          className="flex-grow w-full bg-gray-900 text-white border border-gray-600 rounded-md p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          disabled={isFetchingUrl}
                      />
                      <button
                          type="submit"
                          disabled={isFetchingUrl}
                          className="flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                      >
                          {isFetchingUrl ? <Spinner className="w-5 h-5"/> : 'Muat'}
                      </button>
                  </div>
                </div>
                {urlError && <p className="text-sm text-red-400">{urlError}</p>}
            </form>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        id="dropzone-file"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => handleFileChange(e.target.files)}
      />
    </div>
  );
};

export default ImageUpload;