import q1Prompt from './01-hello/prompt.md?raw';
import q1Walk from './01-hello/walkthrough.md?raw';
import q1Starter from './01-hello/starter.js?raw';
import q1Solution from './01-hello/solution.js?raw';
import q1Test from './01-hello/app.test.js?raw';

import q2Prompt from './02-greet-query/prompt.md?raw';
import q2Walk from './02-greet-query/walkthrough.md?raw';
import q2Starter from './02-greet-query/starter.js?raw';
import q2Solution from './02-greet-query/solution.js?raw';
import q2Test from './02-greet-query/app.test.js?raw';

const sharedPackageJson = JSON.stringify(
  {
    name: 'express-question',
    version: '1.0.0',
    main: 'app.js',
    scripts: { test: 'jest' },
    dependencies: { express: '^4.19.2' },
    devDependencies: { jest: '^29.7.0', supertest: '^7.0.0' },
  },
  null,
  2,
);

export const questions = [
  {
    id: '01-hello',
    title: '1. Hello route',
    prompt: q1Prompt,
    walkthrough: q1Walk,
    solution: q1Solution,
    files: {
      '/app.js': q1Starter,
      '/app.test.js': q1Test,
      '/package.json': sharedPackageJson,
    },
  },
  {
    id: '02-greet-query',
    title: '2. Greet (query string)',
    prompt: q2Prompt,
    walkthrough: q2Walk,
    solution: q2Solution,
    files: {
      '/app.js': q2Starter,
      '/app.test.js': q2Test,
      '/package.json': sharedPackageJson,
    },
  },
];
