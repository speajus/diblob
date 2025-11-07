# Specification

## Blob Creation
Blobs are created with the createBlob() function.

```ts filename=blobs.ts
// Define a type
export type MyType = { someMethod(): void };
// Create a blob for a type
export const myBlob = createBlob<MyType>();
```

## Container Registration
Containers are created with the createContainer() function.

```ts filename=my-impl.ts
import { container } from './container';
import { myBlob, type MyType } from './blobs';

class MyImpl implements MyType {
  constructor(private name = 'Jane') {}  
  someMethod() { 
    console.log('Hello', this.name);
   }
}

```

```ts filename=container.ts
import { createContainer } from 'diblob';
import { myBlob } from './blobs';
import { MyImpl } from './my-impl';
export const container = createContainer();

container.register(myBlob, MyImpl);

// Blobs are proxies that act as the type
myBlob.someMethod(); // Act as MyType

```


## Constructor Registration
Blobs can be used in the constructor.   When they are used, they are resolved automatically. The blob 
dependencies are resolved automatically, and tracked.

```ts filename=constructor.ts

class MyDependentImpl {
  constructor(private say = myBlob) {}
  someMethod() { 
    this.say.someMethod();
   }
}
//If myBlob is not registered, an error is thrown
const instance = new MyDependentImpl(); // myBlob is resolved automatically
instance.someMethod(); // Calls myBlob.someMethod()

```

## Factory Registration
Blobs can be registered with a factory function.  The factory function is called with the container as the first argument.
The factory function can return a plain value, or a promise.  The factory function can also return a plain value or a promise.
```ts filename=factory.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';
import { container } from './container';

container.register(myBlob, () => new MyImpl());

```

## Resolution can be async
If context.resolve() is called, it returns a promise.  The promise is resolved when all dependencies are resolved. This is
transitive, so if a dependency is async, the promise is not resolved until all dependencies are resolved.

```ts filename=async.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';

const ctx = createContainer();
ctx.register(myBlob, async () => new MyImpl());

const myblob = await ctx.resolve(myBlob);
await myBlob.someMethod(); // Async resolution

```
If a blob is used in a constructor, and the constructor is not async, and the blob is async, an error is thrown.
```ts filename=async-error.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';

const ctx = createContainer();
ctx.register(myBlob, async () => new MyImpl());

class MyDependentImpl {
  constructor(private say = myBlob) {}
}

const b = new MyDependentImpl(); // Error: myBlob is async, but constructor is not
```
To fix this, resolve the class with the container.

```ts filename=async-ok.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';
import { container } from './container';
container.register(myBlob, async () => new MyImpl());

const b = await container.resolve(MyDependentImpl); // Ok: myBlob is async, but constructor is not
```
This is done by each blob throwing a special symbol that is caught by the proxy.  The proxy then requests async resolution
from the container.  The container resolves the blob async, and then returns the value.  The proxy then returns the value.
If any other properties are accessed before the promise is resolved, they are queued and returned when the promise is resolved.


# Invalidation
When a blob is re-registered, all dependent blobs are invalidated.  This means that they are removed from the cache, and 
will be re-resolved the next time they are accessed.  This is done by the container tracking which blobs depend on other blobs.
```ts filename=invalidation.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';
import { container } from './container';

container.register(myBlob, () => new MyImpl('Joe'));
const instance = await container.resolve(myBlob);
instance.someMethod(); // Calls myBlob.someMethod()

container.register(myBlob, () => new MyImpl2('Joe'));
instance.someMethod(); // Calls myBlob.someMethod() on new instance says `Hello Joe`

```
This works transitively, so if a blob is re-registered, and it has dependencies, all dependent blobs are invalidated.  
```ts filename=transitive-invalidation.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';
import { container } from './container';

class MyTransitiveImpl {
  constructor(private say = myBlob) {}
  someMethod() { 
    this.say.someMethod();
   }
}

container.register(myBlob, MyImpl, 'Jane');
const instance = await container.resolve(MyTransitiveImpl);
instance.someMethod(); // Calls myBlob.someMethod() `Hello Jane`

container.register(myBlob, MyImpl, 'Joe');
instance.someMethod(); // Calls myBlob.someMethod() on new instance says `Hello Joe`

```
This works deeply, so if a blob is re-registered, and it has dependencies, and those dependencies have dependencies, all dependent blobs are invalidated.  
```ts filename=deep-invalidation.ts
import { container } from './container';
import { myBlob, type MyType } from './blobs';

const blob2 = createBlob<MyType>();

class MyTransitiveImpl {
  constructor(private say = blob2) {}
  someMethod() { 
    this.say.someMethod();
   }
}
const blob3 = createBlob<MyTransitiveImpl>();


class MyDependentImpl {
  constructor(private say =blob3) {}
  someMethod() { 
    this.say.someMethod();
   }
}

container.register(blob2, MyImpl, 'Jane');
container.register(blob3, MyTransitiveImpl);
container.register(myBlob, MyImpl, 'Jane');
const instance = await container.resolve(MyDependentImpl);
instance.someMethod(); // Calls myBlob.someMethod() `Hello Jane`

container.register(myBlob, MyImpl, 'Joe');
instance.someMethod(); // Calls myBlob.someMethod() on new instance says `Hello Joe`

```

## Registering properties.
Class's can also register properties.  This is done by using the blobs.  


```ts filename=properties.ts
import { myBlob, type MyType } from './blobs';
import { container } from './container';

class MyImpl {
  private blob = myBlob;  
  constructor() {}  
  someMethod() { 
    this.blob.someMethod(); 
   }
}

container.register(myBlob, MyImpl, 'Jane');

const instance = await container.resolve(MyImpl);
instance.someMethod(); // Calls myBlob.someMethod() `Hello Jane`

```

## Multiple Containers
Multiple containers can be created.  They are completely independent.  They can be used to create
scopes.  For example, a request scope, or a test scope.

```ts filename=multiple-containers.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';

const container1 = createContainer();
const container2 = createContainer();

container1.register(myBlob, MyImpl, 'Jane');
container2.register(myBlob, MyImpl, 'Joe');

const instance1 = await container1.resolve(MyImpl);
const instance2 = await container2.resolve(MyImpl);
instance1.someMethod(); // Calls myBlob.someMethod() `Hello Jane`
instance2.someMethod(); // Calls myBlob.someMethod() `Hello Joe`

```
## Container Nesting
Containers can be nested.  This is done by passing a parent container to the createContainer() function.
```ts filename=container-nesting.ts
import { createContainer } from 'diblob';
import { myBlob, type MyType } from './blobs';

const parent = createContainer();
parent.register(myBlob, MyImpl, 'Jane');

const child = createContainer(parent);
child.register(myBlob, MyImpl, 'Joe');

const instance1 = await parent.resolve(MyImpl);
const instance2 = await child.resolve(MyImpl);
instance1.someMethod(); // Calls myBlob.someMethod() `Hello Jane`
instance2.someMethod(); // Calls myBlob.someMethod() `Hello Joe`

```