/**
 * Syntax Check Script
 * This will help us find the exact syntax error
 */

console.log('🔍 Checking syntax...');

try {
    // Try to parse the main.js file as text and find issues
    fetch('./main.js')
        .then(response => response.text())
        .then(code => {
            console.log('📝 Code length:', code.length);
            
            // Try to create a function with the code to check syntax
            try {
                new Function(code);
                console.log('✅ Syntax appears valid');
            } catch (error) {
                console.error('❌ Syntax error found:', error);
                console.log('Error message:', error.message);
                console.log('Error stack:', error.stack);
                
                // Try to find the line with the error
                const lines = code.split('\n');
                console.log('📊 Total lines:', lines.length);
                
                // Look for common syntax issues
                console.log('\n🔍 Checking for common issues:');
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineNum = i + 1;
                    
                    // Check for }{ patterns
                    if (line.includes('}{')) {
                        console.log(`⚠️ Line ${lineNum}: Found }{ pattern: ${line.trim()}`);
                    }
                    
                    // Check for missing spaces after }
                    if (/}\s*[a-zA-Z]/.test(line)) {
                        console.log(`⚠️ Line ${lineNum}: Missing space after }: ${line.trim()}`);
                    }
                    
                    // Check for unbalanced braces in individual lines
                    const openBraces = (line.match(/\{/g) || []).length;
                    const closeBraces = (line.match(/\}/g) || []).length;
                    if (openBraces !== closeBraces && (openBraces > 1 || closeBraces > 1)) {
                        console.log(`⚠️ Line ${lineNum}: Unbalanced braces: ${line.trim()}`);
                    }
                }
            }
        })
        .catch(error => {
            console.error('Failed to fetch main.js:', error);
        });
} catch (error) {
    console.error('Script error:', error);
}
