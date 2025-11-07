import React, { useState } from 'react';
import GenerateImage from './components/GenerateImage';
import EditImage from './components/EditImage';
import AnalyzeImage from './components/AnalyzeImage';
import { GenerateIcon, EditIcon, AnalyzeIcon, PhotoIcon } from './assets/icons';

type Tab = 'generate' | 'edit' | 'analyze';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('edit');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generate':
        return <GenerateImage />;
      case 'edit':
        return <EditImage />;
      case 'analyze':
        return <AnalyzeImage />;
      default:
        return <EditImage />;
    }
  };

  // Fix: Replaced JSX.Element with React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm md:text-base font-medium rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
        activeTab === tab 
          ? 'bg-gray-800 text-indigo-400 border-b-2 border-indigo-400' 
          : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PhotoIcon className="w-8 h-8 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Studio Foto AI
            </h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex border-b border-gray-700">
            <TabButton tab="generate" label="Buat Gambar" icon={<GenerateIcon className="w-5 h-5" />} />
            <TabButton tab="edit" label="Edit & Pulihkan" icon={<EditIcon className="w-5 h-5" />} />
            <TabButton tab="analyze" label="Analisis" icon={<AnalyzeIcon className="w-5 h-5" />} />
          </div>
          
          <div className="bg-gray-800 rounded-b-lg p-4 md:p-8">
            {renderTabContent()}
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Didukung oleh Google Gemini & Imagen</p>
      </footer>
    </div>
  );
};

export default App;