import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Persona {
  name: string;
  role: string;
  quote: string;
  avatar?: string;
}

interface PersonaCarouselProps {
  personas: Persona[];
}

export const PersonaCarousel = ({ personas }: PersonaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!personas || personas.length === 0) {
    return null;
  }

  const current = personas[currentIndex];
  const hasMultiple = personas.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? personas.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === personas.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Synthetic Personas</h3>

      <div className="relative">
        {/* Persona Card */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 min-h-[280px] flex flex-col justify-between">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-4 mb-4">
            {current.avatar && (
              <img
                src={current.avatar}
                alt={current.name}
                className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div>
              <h4 className="text-xl font-bold text-white">{current.name}</h4>
              <p className="text-sm text-gray-300">{current.role}</p>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="border-l-4 border-blue-400/50 pl-4 py-2">
            <p className="text-white italic">"{current.quote}"</p>
          </blockquote>

          {/* Pagination Indicator */}
          {hasMultiple && (
            <div className="flex justify-center gap-2 mt-4">
              {personas.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'w-8 bg-blue-400'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to persona ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {hasMultiple && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Previous persona"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Next persona"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Persona Count */}
      {hasMultiple && (
        <p className="text-center text-sm text-gray-400">
          {currentIndex + 1} of {personas.length}
        </p>
      )}
    </div>
  );
};
