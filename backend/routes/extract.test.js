/**
 * Manual test script for validateConfidence function
 * Run with: node backend/routes/extract.test.js
 */

// Copy the validateConfidence function for testing
function validateConfidence(score) {
  // Accept undefined/null for backward compatibility
  if (score === undefined || score === null) return null;
  
  // Convert to number if string
  const num = typeof score === 'string' ? parseFloat(score) : score;
  
  // Validate range
  if (isNaN(num) || num < 0.0 || num > 1.0) {
    console.warn(`Invalid confidence score ${score}, defaulting to null`);
    return null;
  }
  
  return num;
}

// Test cases
console.log('Testing validateConfidence function:\n');

const testCases = [
  { input: 0.85, expected: 0.85, description: 'Valid score in range' },
  { input: 0.0, expected: 0.0, description: 'Minimum valid score' },
  { input: 1.0, expected: 1.0, description: 'Maximum valid score' },
  { input: '0.75', expected: 0.75, description: 'String number in range' },
  { input: null, expected: null, description: 'Null value' },
  { input: undefined, expected: null, description: 'Undefined value' },
  { input: -0.5, expected: null, description: 'Below minimum' },
  { input: 1.5, expected: null, description: 'Above maximum' },
  { input: 'invalid', expected: null, description: 'Non-numeric string' },
  { input: NaN, expected: null, description: 'NaN value' },
  { input: {}, expected: null, description: 'Object' },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected, description }) => {
  const result = validateConfidence(input);
  const success = result === expected;
  
  if (success) {
    console.log(`✓ PASS: ${description}`);
    console.log(`  Input: ${JSON.stringify(input)} → Output: ${result}\n`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${description}`);
    console.log(`  Input: ${JSON.stringify(input)}`);
    console.log(`  Expected: ${expected}, Got: ${result}\n`);
    failed++;
  }
});

console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
