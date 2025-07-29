#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// 테스트 카테고리 정의
const testCategories = {
  backend: {
    name: 'Backend Tests',
    path: './backend',
    command: 'npm test',
    description: 'API endpoints, authentication, database operations',
    tests: {
      auth: 'tests/api/auth.test.js',
      users: 'tests/api/users.test.js',
      boards: 'tests/api/boards.test.js',
      comments: 'tests/api/comments.test.js',
      tags: 'tests/api/tags.test.js',
      admin: 'tests/api/admin.test.js',
      security: 'tests/security/security.test.js',
      validation: 'tests/validation/validation.test.js',
      basic: 'tests/api/basic.test.js',
    }
  },
  frontend: {
    name: 'Frontend Tests',
    path: './frontend',
    command: 'npm test -- --watchAll=false',
    description: 'React components, hooks, API integration',
    tests: {
      components: 'src/components',
      hooks: 'src/hooks',
      api: 'src/api',
      pages: 'src/pages',
      utils: 'src/utils',
    }
  },
  integration: {
    name: 'Integration Tests',
    path: '.',
    command: 'npm run test:integration',
    description: 'End-to-end functionality, full stack tests',
    tests: {
      auth_flow: 'tests/integration/auth-flow.test.js',
      board_flow: 'tests/integration/board-flow.test.js',
      comment_flow: 'tests/integration/comment-flow.test.js',
    }
  },
  performance: {
    name: 'Performance Tests',
    path: './backend',
    command: 'npm run test:performance',
    description: 'Load testing, response times, caching',
    tests: {
      api_load: 'tests/performance/api-load.test.js',
      cache: 'tests/performance/cache.test.js',
      database: 'tests/performance/database.test.js',
    }
  }
};

// 헬퍼 함수들
function printHeader() {
  console.clear();
  console.log(colors.cyan + colors.bold + `
╔══════════════════════════════════════════════════════╗
║           LiKorea Test Runner v1.0.0                 ║
╚══════════════════════════════════════════════════════╝
` + colors.reset);
}

function printMenu() {
  console.log(colors.yellow + 'Select test category:' + colors.reset);
  console.log('');
  
  const categories = Object.keys(testCategories);
  categories.forEach((key, index) => {
    const category = testCategories[key];
    console.log(`  ${colors.bold}${index + 1}.${colors.reset} ${colors.green}${category.name}${colors.reset}`);
    console.log(`     ${colors.cyan}${category.description}${colors.reset}`);
    console.log('');
  });
  
  console.log(`  ${colors.bold}${categories.length + 1}.${colors.reset} ${colors.magenta}Run All Tests${colors.reset}`);
  console.log(`     Run all test categories sequentially`);
  console.log('');
  console.log(`  ${colors.bold}${categories.length + 2}.${colors.reset} ${colors.blue}Coverage Report${colors.reset}`);
  console.log(`     Generate test coverage report`);
  console.log('');
  console.log(`  ${colors.bold}0.${colors.reset} ${colors.red}Exit${colors.reset}`);
  console.log('');
}

function runTest(category, specificTest = null) {
  return new Promise((resolve, reject) => {
    const testConfig = testCategories[category];
    if (!testConfig) {
      reject(new Error(`Unknown test category: ${category}`));
      return;
    }

    const cwd = path.resolve(testConfig.path);
    let command = testConfig.command;
    
    // 특정 테스트 파일만 실행하는 경우
    if (specificTest && testConfig.tests[specificTest]) {
      const testPath = testConfig.tests[specificTest];
      if (category === 'backend') {
        command = `npm test -- ${testPath}`;
      } else if (category === 'frontend') {
        command = `npm test -- --testPathPattern=${testPath} --watchAll=false`;
      }
    }

    console.log(`${colors.blue}Running ${testConfig.name}...${colors.reset}`);
    console.log(`${colors.cyan}Command: ${command}${colors.reset}`);
    console.log(`${colors.cyan}Directory: ${cwd}${colors.reset}`);
    console.log('');

    const [cmd, ...args] = command.split(' ');
    const testProcess = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}✓ ${testConfig.name} passed${colors.reset}`);
        resolve();
      } else {
        console.log(`${colors.red}✗ ${testConfig.name} failed with code ${code}${colors.reset}`);
        reject(new Error(`Test failed with code ${code}`));
      }
    });

    testProcess.on('error', (err) => {
      console.error(`${colors.red}Error running tests: ${err.message}${colors.reset}`);
      reject(err);
    });
  });
}

async function runAllTests() {
  console.log(`${colors.magenta}Running all tests...${colors.reset}\n`);
  
  const results = {
    passed: [],
    failed: []
  };

  for (const category of Object.keys(testCategories)) {
    try {
      await runTest(category);
      results.passed.push(category);
    } catch (error) {
      results.failed.push(category);
    }
    console.log('\n' + colors.cyan + '─'.repeat(60) + colors.reset + '\n');
  }

  // 결과 요약
  console.log(colors.bold + '\nTest Summary:' + colors.reset);
  console.log(colors.green + `  Passed: ${results.passed.length}` + colors.reset);
  console.log(colors.red + `  Failed: ${results.failed.length}` + colors.reset);
  
  if (results.failed.length > 0) {
    console.log(colors.red + '\nFailed categories:' + colors.reset);
    results.failed.forEach(cat => {
      console.log(`  - ${cat}`);
    });
  }

  return results.failed.length === 0;
}

async function generateCoverageReport() {
  console.log(`${colors.blue}Generating coverage report...${colors.reset}\n`);
  
  // Backend coverage
  console.log(`${colors.cyan}Backend coverage:${colors.reset}`);
  await runCommand('npm run test:coverage', './backend');
  
  console.log('\n' + colors.cyan + '─'.repeat(60) + colors.reset + '\n');
  
  // Frontend coverage
  console.log(`${colors.cyan}Frontend coverage:${colors.reset}`);
  await runCommand('npm test -- --coverage --watchAll=false', './frontend');
}

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const process = spawn(cmd, args, {
      cwd: path.resolve(cwd),
      shell: true,
      stdio: 'inherit'
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function selectSpecificTest(category) {
  const testConfig = testCategories[category];
  const tests = Object.keys(testConfig.tests);
  
  console.clear();
  console.log(`${colors.yellow}Select specific test for ${testConfig.name}:${colors.reset}\n`);
  
  tests.forEach((test, index) => {
    console.log(`  ${colors.bold}${index + 1}.${colors.reset} ${test}`);
  });
  
  console.log(`\n  ${colors.bold}0.${colors.reset} Run all ${category} tests`);
  console.log(`  ${colors.bold}b.${colors.reset} Back to main menu`);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nYour choice: ', async (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'b') {
        resolve('back');
      } else if (answer === '0') {
        await runTest(category);
        resolve('done');
      } else {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < tests.length) {
          await runTest(category, tests[index]);
          resolve('done');
        } else {
          console.log(colors.red + 'Invalid choice!' + colors.reset);
          resolve('invalid');
        }
      }
    });
  });
}

async function main() {
  let running = true;

  while (running) {
    printHeader();
    printMenu();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('Your choice: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });

    const categories = Object.keys(testCategories);
    const choice = parseInt(answer);

    if (answer === '0') {
      running = false;
      console.log(colors.yellow + '\nGoodbye!' + colors.reset);
    } else if (choice > 0 && choice <= categories.length) {
      const category = categories[choice - 1];
      const result = await selectSpecificTest(category);
      
      if (result === 'done') {
        console.log('\nPress Enter to continue...');
        await new Promise(resolve => {
          process.stdin.once('data', resolve);
        });
      }
    } else if (choice === categories.length + 1) {
      await runAllTests();
      console.log('\nPress Enter to continue...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    } else if (choice === categories.length + 2) {
      await generateCoverageReport();
      console.log('\nPress Enter to continue...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    } else {
      console.log(colors.red + 'Invalid choice!' + colors.reset);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// 에러 핸들링
process.on('uncaughtException', (err) => {
  console.error(colors.red + `\nUnexpected error: ${err.message}` + colors.reset);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red + '\nUnhandled Promise Rejection:' + colors.reset, reason);
  process.exit(1);
});

// 실행
if (require.main === module) {
  main().catch(err => {
    console.error(colors.red + `\nError: ${err.message}` + colors.reset);
    process.exit(1);
  });
}

module.exports = { runTest, runAllTests, testCategories };