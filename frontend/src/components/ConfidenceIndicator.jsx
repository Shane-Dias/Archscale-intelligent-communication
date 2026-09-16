import { useState } from 'react';

/**
 * ConfidenceIndicator Component
 * 
 * Displays a color-coded circular indicator for AI extraction confidence scores.
 * Shows tooltip on hover with numeric value and label.
 * 
 * @param {Object} props
 * @param {number|null|undefined} props.confidence - Confidence score (0.0-1.0)
 * @param {'sm'|'md'|'lg'} props.size - Size variant (default: 'sm')
 */
function ConfidenceIndicator({ confidence, size = 'sm' }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Don't render if no confidence score
  if (confidence === null || confidence === undefined) {
    return null;
  }
  
  const { bgColor, borderColor, label } = getConfidenceStyle(confidence);
  const sizeClass = getSizeClass(size);
  
  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Visual indicator dot */}
      <div 
        className={`${sizeClass} rounded-full ${bgColor} ${borderColor} border-2`}
        aria-label={`Confidence: ${confidence.toFixed(1)} (${label})`}
      />
      
      {/* Tooltip */}
      {showTooltip && (
        <div 
          className={`absolute z-50 px-2 py-1 rounded shadow-lg text-xs font-semibold text-white whitespace-nowrap ${bgColor} transition-opacity duration-200`}
          style={{ 
            bottom: '100%', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            marginBottom: '4px' 
          }}
        >
          {confidence.toFixed(1)} {label}
        </div>
      )}
    </div>
  );
}

/**
 * Maps confidence score to color styling and label
 * 
 * @param {number} confidence - Score from 0.0 to 1.0
 * @returns {Object} Style classes and label
 */
function getConfidenceStyle(confidence) {
  if (confidence >= 0.7) {
    return {
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-300',
      label: 'High'
    };
  } else if (confidence >= 0.4) {
    return {
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-300',
      label: 'Medium'
    };
  } else {
    return {
      bgColor: 'bg-red-500',
      borderColor: 'border-red-300',
      label: 'Low'
    };
  }
}

/**
 * Returns Tailwind size classes for the indicator dot
 * 
 * @param {'sm'|'md'|'lg'} size
 * @returns {string} Tailwind width and height classes
 */
function getSizeClass(size) {
  switch (size) {
    case 'sm': return 'w-2 h-2';
    case 'md': return 'w-3 h-3';
    case 'lg': return 'w-4 h-4';
    default: return 'w-2 h-2';
  }
}

export default ConfidenceIndicator;
