
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Image, User, Sparkles, Camera, X } from "lucide-react";

interface VirtualBackgroundSelectorProps {
  onBackgroundChange: (background: BackgroundOption) => void;
  onFilterChange: (filter: FilterOption) => void;
  currentBackground: BackgroundOption;
  currentFilter: FilterOption;
}

export interface BackgroundOption {
  id: string;
  name: string;
  type: 'none' | 'blur' | 'image';
  preview?: string;
  blurAmount?: number;
}

export interface FilterOption {
  id: string;
  name: string;
  type: 'none' | 'brightness' | 'contrast' | 'sepia' | 'vintage' | 'cool';
  intensity?: number;
}

const backgroundOptions: BackgroundOption[] = [
  { id: 'none', name: 'None', type: 'none' },
  { id: 'blur-light', name: 'Light Blur', type: 'blur', blurAmount: 3 },
  { id: 'blur-medium', name: 'Medium Blur', type: 'blur', blurAmount: 6 },
  { id: 'blur-heavy', name: 'Heavy Blur', type: 'blur', blurAmount: 10 },
  { id: 'office', name: 'Office', type: 'image', preview: '🏢' },
  { id: 'library', name: 'Library', type: 'image', preview: '📚' },
  { id: 'home', name: 'Home Office', type: 'image', preview: '🏠' },
  { id: 'nature', name: 'Nature', type: 'image', preview: '🌲' },
  { id: 'space', name: 'Space', type: 'image', preview: '🌌' },
  { id: 'classroom', name: 'Classroom', type: 'image', preview: '🎓' },
];

const filterOptions: FilterOption[] = [
  { id: 'none', name: 'None', type: 'none' },
  { id: 'bright', name: 'Bright', type: 'brightness', intensity: 1.2 },
  { id: 'contrast', name: 'High Contrast', type: 'contrast', intensity: 1.3 },
  { id: 'sepia', name: 'Sepia', type: 'sepia', intensity: 1 },
  { id: 'vintage', name: 'Vintage', type: 'vintage', intensity: 0.8 },
  { id: 'cool', name: 'Cool Tone', type: 'cool', intensity: 1.1 },
];

export default function VirtualBackgroundSelector({
  onBackgroundChange,
  onFilterChange,
  currentBackground,
  currentFilter,
}: VirtualBackgroundSelectorProps) {
  const [activeTab, setActiveTab] = useState<'backgrounds' | 'filters'>('backgrounds');

  const handleBackgroundSelect = (background: BackgroundOption) => {
    onBackgroundChange(background);
  };

  const handleFilterSelect = (filter: FilterOption) => {
    onFilterChange(filter);
  };

  return (
    <Card className="w-80 bg-gray-800 border-gray-700 p-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'backgrounds' | 'filters')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="backgrounds" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Backgrounds
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Filters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backgrounds" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {backgroundOptions.map((bg) => (
              <Button
                key={bg.id}
                variant={currentBackground.id === bg.id ? "default" : "outline"}
                className={`h-20 flex flex-col items-center justify-center p-2 relative ${
                  currentBackground.id === bg.id ? "ring-2 ring-blue-400" : ""
                }`}
                onClick={() => handleBackgroundSelect(bg)}
              >
                {bg.type === 'none' && <X className="w-6 h-6 mb-1" />}
                {bg.type === 'blur' && <User className="w-6 h-6 mb-1" />}
                {bg.type === 'image' && (
                  <span className="text-2xl mb-1">{bg.preview}</span>
                )}
                <span className="text-xs text-center">{bg.name}</span>
                {currentBackground.id === bg.id && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white px-1 py-0 text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {filterOptions.map((filter) => (
              <Button
                key={filter.id}
                variant={currentFilter.id === filter.id ? "default" : "outline"}
                className={`h-20 flex flex-col items-center justify-center p-2 relative ${
                  currentFilter.id === filter.id ? "ring-2 ring-purple-400" : ""
                }`}
                onClick={() => handleFilterSelect(filter)}
              >
                <Sparkles className="w-6 h-6 mb-1" />
                <span className="text-xs text-center">{filter.name}</span>
                {currentFilter.id === filter.id && (
                  <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white px-1 py-0 text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
