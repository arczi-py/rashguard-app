import { generateAndSaveDiagrams } from '../src/utils/generateDiagrams.js';

// Generate all diagrams
generateAndSaveDiagrams().then(() => {
  console.log('All diagrams have been generated successfully!');
}).catch(error => {
  console.error('Error generating diagrams:', error);
}); 