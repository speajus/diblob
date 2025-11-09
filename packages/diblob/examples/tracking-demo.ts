/**
 * Demonstration of the singleton array tracking mechanism
 * Shows how blobs push themselves into the tracking array during constructor execution
 */

import { createBlob, createContainer } from '../src';

interface ServiceA {
  name: string;
}

interface ServiceB {
  name: string;
}

interface ServiceC {
  name: string;
}

const serviceA = createBlob<ServiceA>();
const serviceB = createBlob<ServiceB>();
const serviceC = createBlob<ServiceC>();

class ImplA implements ServiceA {
  name = 'ServiceA';
}

class ImplB implements ServiceB {
  name = 'ServiceB';
}

class ImplC implements ServiceC {
  name = 'ServiceC';
}

// Class with multiple blob dependencies
class ComplexService {
  constructor(
    private a = serviceA,
    private b = serviceB,
    private c = serviceC
  ) {
    console.log('ComplexService constructor called');
    console.log('  - serviceA accessed:', this.a.name);
    console.log('  - serviceB accessed:', this.b.name);
    console.log('  - serviceC accessed:', this.c.name);
  }

  describe() {
    return `ComplexService with ${this.a.name}, ${this.b.name}, ${this.c.name}`;
  }
}

// Class with partial blob dependencies
class PartialService {
  constructor(
    private a = serviceA,
    private plainValue = 'plain'
  ) {
    console.log('PartialService constructor called');
    console.log('  - serviceA accessed:', this.a.name);
    console.log('  - plainValue:', this.plainValue);
  }

  describe() {
    return `PartialService with ${this.a.name} and ${this.plainValue}`;
  }
}

async function main() {
  console.log('=== Singleton Array Tracking Demo ===\n');

  const container = createContainer();
  
  // Register the blobs
  container.register(serviceA, ImplA);
  container.register(serviceB, ImplB);
  container.register(serviceC, ImplC);

  console.log('1. Resolving ComplexService (3 blob dependencies):');
  console.log('   During constructor execution, each blob will push itself into the tracking array\n');
  const complex = container.resolve(ComplexService);
  console.log('\n   Result:', complex.describe());

  console.log('\n2. Resolving PartialService (1 blob + 1 plain value):');
  console.log('   Only the blob will be tracked, plain values are ignored\n');
  const partial = container.resolve(PartialService);
  console.log('\n   Result:', partial.describe());

  console.log('\n3. Resolving the same class again:');
  console.log('   The tracking array is reset for each resolution\n');
  const complex2 = container.resolve(ComplexService);
  console.log('\n   Result:', complex2.describe());

  console.log('\n=== Demo Complete ===');
  console.log('\nHow it works:');
  console.log('1. container.resolve(Class) calls beginConstructorTracking()');
  console.log('2. new Class() is executed');
  console.log('3. Each blob default parameter access triggers the blob proxy getter');
  console.log('4. The getter calls trackConstructorDependency(blob)');
  console.log('5. The blob pushes itself into the singleton array');
  console.log('6. endConstructorTracking() returns the array of accessed blobs');
  console.log('7. Container resolves those blobs and handles async if needed');
}

main().catch(console.error);

