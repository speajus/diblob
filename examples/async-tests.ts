/**
 * Tests for async resolution based on SPEC.md
 */

import { createBlob, createContainer } from '../src';

type MyType = { someMethod(): void };
const myBlob = createBlob<MyType>();

class MyImpl implements MyType {
  constructor(private name = 'Jane') {}
  someMethod() {
    console.log('Hello', this.name);
  }
}

const ctx = createContainer();

async function runTests() {
  console.log('=== Test 1: Async factory ===');
  ctx.register(myBlob, async () => new MyImpl('Async'));
  
  const resolved = await ctx.resolve(myBlob);
  resolved.someMethod(); // Should print: Hello Async
  
  console.log('\n=== Test 2: Async blob usage ===');
  await myBlob.someMethod(); // Should print: Hello Async
  
  console.log('\n=== Test 3: Resolve class with async dependency ===');
  class MyDependentImpl {
    constructor(private say = myBlob) {}
    someMethod() {
      this.say.someMethod();
    }
  }
  
  const instance = await ctx.resolve(MyDependentImpl);
  instance.someMethod(); // Should print: Hello Async
  
  console.log('\n=== Done ===');
}

runTests().catch(console.error);

