// Minimal test version
console.log('Testing syntax...');

class TestClass {
    constructor() {
        console.log('Constructor works');
    }
    
    testMethod() {
        console.log('Method works');
    }
}

const test = new TestClass();
test.testMethod();
console.log('Syntax test complete');
