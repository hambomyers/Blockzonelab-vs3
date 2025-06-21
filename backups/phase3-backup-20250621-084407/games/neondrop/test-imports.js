// Test the clean EverythingCard
console.log('🧪 Testing CLEAN EverythingCard...');

try {
    console.log('Testing EverythingCard import...');
    const module = await import('./ui/EverythingCard.js');
    console.log('✅ EverythingCard imported successfully!');
    console.log('✅ Found class:', module.EverythingCard.name);
} catch (error) {
    console.error('❌ EverythingCard import failed:', error);
}

console.log('🎉 Test complete!');
