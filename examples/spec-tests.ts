/**
 * Tests based on SPEC.md examples
 */

import { createBlob, createContainer } from '../src';

// Define a type
export type MyType = { someMethod(): void };

// Create a blob for a type
export const myBlob = createBlob<MyType>();

class MyImpl implements MyType {
  constructor(private name = 'Jane') {}
  someMethod() {
    console.log('Hello', this.name);
  }
}

const container = createContainer();

console.log('=== Test 1: Basic Registration ===');
container.register(myBlob, MyImpl);
myBlob.someMethod(); // Should print: Hello Jane

console.log('\n=== Test 2: Constructor with default blob parameter ===');
class MyDependentImpl {
  constructor(private say = myBlob) {}
  someMethod() {
    this.say.someMethod();
  }
}

// This should work - myBlob is resolved automatically from default parameter
const instance = new MyDependentImpl();
instance.someMethod(); // Should print: Hello Jane

console.log('\n=== Test 3: Property initialization with blob ===');
class MyPropImpl {
  private blob = myBlob;
  constructor() {}
  someMethod() {
    this.blob.someMethod();
  }
}

const propInstance = new MyPropImpl();
propInstance.someMethod(); // Should print: Hello Jane

console.log('\n=== Test 4: Factory Registration ===');
const blob2 = createBlob<MyType>();
container.register(blob2, () => new MyImpl('Factory'));
blob2.someMethod(); // Should print: Hello Factory

console.log('\n=== Test 5: Registration with plain value ===');
const blob3 = createBlob<MyType>();
container.register(blob3, MyImpl, 'Joe');
blob3.someMethod(); // Should print: Hello Joe

console.log('\n=== Test 6: Invalidation ===');
container.register(myBlob, MyImpl, 'Jane');
myBlob.someMethod(); // Should print: Hello Jane

container.register(myBlob, MyImpl, 'Bob');
myBlob.someMethod(); // Should print: Hello Bob

console.log('\n=== Test 7: Transitive Invalidation ===');
class MyTransitiveImpl {
  constructor(private say = myBlob) {}
  someMethod() {
    this.say.someMethod();
  }
}

const blob4 = createBlob<MyTransitiveImpl>();
container.register(myBlob, MyImpl, 'Jane');
container.register(blob4, MyTransitiveImpl);

const transitiveInstance = await container.resolve(blob4);
transitiveInstance.someMethod(); // Should print: Hello Jane

container.register(myBlob, MyImpl, 'Joe');
transitiveInstance.someMethod(); // Should print: Hello Joe (invalidated and recreated)

console.log('\n=== Done ===');

