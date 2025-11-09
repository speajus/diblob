/**
 * Tests for container nesting and merging based on SPEC.md
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

console.log('=== Test 1: Multiple independent containers ===');
const container1 = createContainer();
const container2 = createContainer();

container1.register(myBlob, MyImpl, 'Container1');
container2.register(myBlob, MyImpl, 'Container2');

const instance1 = await container1.resolve(myBlob);
const instance2 = await container2.resolve(myBlob);
instance1.someMethod(); // Should print: Hello Container1
instance2.someMethod(); // Should print: Hello Container2

console.log('\n=== Test 2: Container nesting ===');
const parent = createContainer();
parent.register(myBlob, MyImpl, 'Parent');

const child = createContainer(parent);
child.register(myBlob, MyImpl, 'Child');

const parentInstance = await parent.resolve(myBlob);
const childInstance =await child.resolve(myBlob);
parentInstance.someMethod(); // Should print: Hello Parent
childInstance.someMethod(); // Should print: Hello Child

console.log('\n=== Test 3: Child inherits from parent ===');
const blob2 = createBlob<MyType>();
parent.register(blob2, MyImpl, 'FromParent');

const child2 = createContainer(parent);
// child2 doesn't register blob2, but should inherit from parent
const inheritedInstance = await child2.resolve(blob2);
inheritedInstance.someMethod(); // Should print: Hello FromParent

console.log('\n=== Test 4: Container merging ===');
const c1 = createContainer();
const c2 = createContainer();

const blob3 = createBlob<MyType>();
const blob4 = createBlob<MyType>();

c1.register(blob3, MyImpl, 'C1');
c2.register(blob4, MyImpl, 'C2');

const merged = createContainer(c1, c2);
const mergedInstance1 = await merged.resolve(blob3);
const mergedInstance2 = await merged.resolve(blob4);
mergedInstance1.someMethod(); // Should print: Hello C1
mergedInstance2.someMethod(); // Should print: Hello C2

console.log('\n=== Test 5: Merging with override ===');
const c3 = createContainer();
const c4 = createContainer();

c3.register(myBlob, MyImpl, 'C3');
c4.register(myBlob, MyImpl, 'C4');

const merged2 = createContainer(c3, c4);
// Last parent wins (c4)
const overrideInstance = await merged2.resolve(myBlob);
overrideInstance.someMethod(); // Should print: Hello C4

console.log('\n=== Done ===');

