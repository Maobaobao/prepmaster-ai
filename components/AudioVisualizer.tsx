import React from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isRecording }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 bg-blue-500 rounded-full transition-all duration-150 ${
            isRecording ? 'animate-pulse' : 'h-1.5'
          }`}
          style={{
            height: isRecording ? `${Math.random() * 24 + 8}px` : '4px',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;