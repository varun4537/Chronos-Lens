import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Camera, Clock, Search, Loader2, Info, Sparkles, Download, Compass } from 'lucide-react';
import { MapPicker } from './components/MapPicker';
import { ensureApiKey, generateVisualPrompt, generateSnapshot } from './services/geminiService';
import { Coordinates, GenerationRequest, PhotoStyle, GeneratedImage, LocationData } from './types';

// Default to Red Fort approx
const DEFAULT_COORDS: Coordinates = { lat: 28.6562, lng: 77.2410 };

const RECOMMENDATIONS = [
    {
        label: "🇮🇳 India's Independence",
        locationName: "Red Fort, Delhi",
        coords: { lat: 28.6562, lng: 77.2410 },
        date: "1947-08-15",
        time: "08:30",
        style: PhotoStyle.JOURNALISTIC
    },
    {
        label: "🚀 Apollo 11 Landing",
        locationName: "Tranquility Base, Moon",
        coords: { lat: 0.6740, lng: 23.4720 },
        date: "1969-07-20",
        time: "20:17",
        style: PhotoStyle.REALISTIC
    },
    {
        label: "🧱 Fall of Berlin Wall",
        locationName: "Brandenburg Gate, Berlin",
        coords: { lat: 52.5163, lng: 13.3777 },
        date: "1989-11-09",
        time: "23:00",
        style: PhotoStyle.JOURNALISTIC
    },
    {
        label: "🦖 Jurassic Era",
        locationName: "Isla Nublar (Costa Rica)",
        coords: { lat: 9.7489, lng: -83.7534 },
        date: "-65000000-01-01", // Approximate ;)
        time: "12:00",
        style: PhotoStyle.CINEMATIC
    },
    {
        label: "☮️ Woodstock '69",
        locationName: "Bethel, New York",
        coords: { lat: 41.701, lng: -74.880 },
        date: "1969-08-15",
        time: "14:00",
        style: PhotoStyle.VINTAGE
    },
    {
        label: "⛴️ Titanic Departure",
        locationName: "Southampton Docks, UK",
        coords: { lat: 50.8970, lng: -1.4040 },
        date: "1912-04-10",
        time: "12:00",
        style: PhotoStyle.VINTAGE
    }
];

export default function App() {
  const [coords, setCoords] = useState<Coordinates>(DEFAULT_COORDS);
  const [locationName, setLocationName] = useState<string>("Red Fort, Delhi");
  const [date, setDate] = useState<string>("1947-08-15");
  const [time, setTime] = useState<string>("10:00");
  const [style, setStyle] = useState<PhotoStyle>(PhotoStyle.JOURNALISTIC);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simple Geocoding using Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!locationName.trim()) return;
    setIsLoading(true);
    setLoadingStep("Locating place...");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const newCoords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setCoords(newCoords);
        // Clean up name display
        setLocationName(data[0].display_name.split(',')[0]);
      } else {
        setError("Location not found.");
      }
    } catch (err) {
      setError("Could not find location.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleReverseGeocode = async (c: Coordinates) => {
    // Optional: Update text box when map is clicked
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lng}`);
      const data = await response.json();
      if (data) {
        setLocationName(data.display_name.split(',')[0] || "Selected Location");
      }
    } catch (e) {
      // Ignore errors for smoothness
    }
  };

  const handleMapClick = (newCoords: Coordinates) => {
    setCoords(newCoords);
    handleReverseGeocode(newCoords);
  };

  const handleRecommendationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const index = parseInt(e.target.value);
      if (isNaN(index)) return;
      
      const rec = RECOMMENDATIONS[index];
      setLocationName(rec.locationName);
      setCoords(rec.coords);
      setDate(rec.date);
      setTime(rec.time);
      setStyle(rec.style);
      
      // Provide visual feedback
      setResult(null);
      setError(null);
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);
    
    try {
      // 1. Check API Key
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        setError("API Key is required to use the Time Machine.");
        return;
      }

      setIsLoading(true);

      // 2. Build Request
      const request: GenerationRequest = {
        location: { name: locationName, coords },
        date,
        time,
        style
      };

      // 3. Analyze History (Flash)
      setLoadingStep("Consulting historical archives...");
      const visualContext = await generateVisualPrompt(request);

      // 4. Generate Image (Pro Image 3)
      setLoadingStep("Developing historical snapshot (Nano Banana 3)...");
      const generatedImage = await generateSnapshot(request, visualContext);

      setResult(generatedImage);

    } catch (err: any) {
        if (err.message && err.message.includes("Requested entity was not found")) {
            setError("API Key validation failed. Please try selecting your key again.");
            // Reset key logic if possible or just let user retry which triggers the flow
        } else {
            setError(err.message || "Failed to generate time travel snapshot.");
        }
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Chronos Lens</h1>
              <p className="text-xs text-blue-400">Powered by Gemini Nano Banana 3</p>
            </div>
          </div>
          <button 
             onClick={() => window.aistudio?.openSelectKey()}
             className="text-xs text-gray-400 hover:text-white underline"
          >
            Manage API Key
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-1/3 p-6 bg-gray-900 border-r border-gray-800 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          {/* Section: Recommendations */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
             <h2 className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2 flex items-center gap-2">
                <Compass className="w-3 h-3" /> Quick Travel Guide
             </h2>
             <select 
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer hover:border-gray-600 transition-colors"
                defaultValue=""
                onChange={handleRecommendationChange}
             >
                <option value="" disabled>✨ Select a Famous Event...</option>
                {RECOMMENDATIONS.map((rec, idx) => (
                    <option key={idx} value={idx}>{rec.label}</option>
                ))}
             </select>
          </div>

          {/* Section: Location */}
          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter a place (e.g., Red Fort)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-700 shadow-inner">
              <MapPicker selectedCoords={coords} onLocationSelect={handleMapClick} />
            </div>
            <div className="text-xs text-gray-500 font-mono flex justify-between">
              <span>Lat: {coords.lat.toFixed(4)}</span>
              <span>Lng: {coords.lng.toFixed(4)}</span>
            </div>
          </div>

          {/* Section: Time */}
          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Date & Time
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Time (Optional)</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Style */}
          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
              <Camera className="w-4 h-4" /> Lens Style
            </h2>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as PhotoStyle)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {Object.values(PhotoStyle).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-auto pt-4">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
                ${isLoading 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Snapshot</span>
                </>
              )}
            </button>
            {isLoading && (
              <p className="text-center text-xs text-blue-300 mt-2 animate-pulse">{loadingStep}</p>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="w-full lg:w-2/3 bg-black flex items-center justify-center relative p-8">
          
          {!result && !isLoading && (
            <div className="text-center text-gray-600 max-w-md">
              <Camera className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">Ready to Travel Time</h3>
              <p className="text-sm mb-6">Enter coordinates and a date, or pick a famous event to reveal a snapshot of the past.</p>
            </div>
          )}

          {/* Result View */}
          {result && (
            <div className="relative w-full h-full flex flex-col gap-4 animate-in fade-in duration-700">
              <div className="flex-1 relative flex items-center justify-center bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden group">
                 <img 
                   src={result.imageUrl} 
                   alt="Historical Snapshot" 
                   className="max-h-full max-w-full object-contain shadow-2xl"
                 />
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={result.imageUrl} 
                      download={`chronos_${date}_${locationName}.png`}
                      className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm flex items-center justify-center"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                 </div>
              </div>
              
              <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 p-4 rounded-xl">
                <h3 className="text-blue-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                   <Sparkles className="w-3 h-3" /> Time Traveler's Log
                </h3>
                <p className="text-gray-200 text-sm md:text-base leading-relaxed font-medium">
                  {result.story}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 font-mono border-t border-gray-800 pt-2">
                   <span>{date} {time}</span>
                   <span>{locationName}</span>
                   <span>{style}</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay for Image Generation phase specifically */}
          {isLoading && loadingStep.includes("Nano Banana") && (
            <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center text-center p-4">
               <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
               <h3 className="text-xl font-bold text-white mb-2">Constructing Image</h3>
               <p className="text-gray-400 text-sm max-w-sm">
                 The AI is weaving historical data into pixels. This may take a moment.
               </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
