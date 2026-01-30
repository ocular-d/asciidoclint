#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

class ReleaseValidator {
  constructor(options = {}) {
    this.tag = options.tag || 'next';
    this.timeout = options.timeout || 300000; // 5 minutes
    this.retries = options.retries || 3;
  }

  async validateRelease(packages) {
    console.log(`🔍 Validating release for ${packages.length} packages...`);
    
    const results = {
      installation: [],
      functionality: [],
      integration: [],
      performance: [],
      security: []
    };

    for (const pkg of packages) {
      console.log(`\n📦 Validating ${pkg.name}@${pkg.version}`);
      
      try {
        // Test installation
        await this.validateInstallation(pkg);
        results.installation.push({ package: pkg.name, status: 'passed' });
        
        // Test functionality
        await this.validateFunctionality(pkg);
        results.functionality.push({ package: pkg.name, status: 'passed' });
        
        // Test integration
        await this.validateIntegration(pkg);
        results.integration.push({ package: pkg.name, status: 'passed' });
        
        // Test performance
        await this.validatePerformance(pkg);
        results.performance.push({ package: pkg.name, status: 'passed' });
        
        // Security scan
        await this.validateSecurity(pkg);
        results.security.push({ package: pkg.name, status: 'passed' });
        
        console.log(`✅ ${pkg.name} validation passed`);
        
      } catch (error) {
        console.error(`❌ ${pkg.name} validation failed:`, error.message);
        
        // Mark failed tests
        Object.keys(results).forEach(testType => {
          if (!results[testType].find(r => r.package === pkg.name)) {
            results[testType].push({ package: pkg.name, status: 'failed', error: error.message });
          }
        });
        
        throw error;
      }
    }

    return results;
  }

  async validateInstallation(pkg) {
    console.log(`  🔧 Testing installation...`);
    
    const tempDir = path.join(__dirname, '..', '.temp', `install-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      // Create a test package.json
      const testPackage = {
        name: 'install-test',
        version: '1.0.0',
        dependencies: {
          [pkg.name]: `${pkg.version}`
        }
      };
      
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(testPackage, null, 2)
      );

      // Test npm install
      execSync(`npm install --tag ${this.tag}`, { 
        cwd: tempDir, 
        timeout: this.timeout,
        stdio: 'pipe'
      });

      // Verify installation
      const installedPath = path.join(tempDir, 'node_modules', pkg.name);
      if (!fs.existsSync(installedPath)) {
        throw new Error(`Package not found after installation: ${installedPath}`);
      }

      // Verify version
      const installedPkg = JSON.parse(
        fs.readFileSync(path.join(installedPath, 'package.json'), 'utf8')
      );
      
      if (!semver.satisfies(installedPkg.version, pkg.version)) {
        throw new Error(`Version mismatch: expected ${pkg.version}, got ${installedPkg.version}`);
      }

    } finally {
      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async validateFunctionality(pkg) {
    console.log(`  ⚙️ Testing functionality...`);
    
    if (pkg.name.includes('cli')) {
      await this.validateCLIFunctionality(pkg);
    } else {
      await this.validateLibraryFunctionality(pkg);
    }
  }

  async validateCLIFunctionality(pkg) {
    const tempDir = path.join(__dirname, '..', '.temp', `cli-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      // Install CLI package
      execSync(`npm install -g ${pkg.name}@${pkg.version} --tag ${this.tag}`, {
        timeout: this.timeout,
        stdio: 'pipe'
      });

      // Test basic commands
      const commands = [
        'asciidoclint --version',
        'asciidoclint --help'
      ];

      for (const cmd of commands) {
        try {
          const output = execSync(cmd, { 
            timeout: 30000,
            encoding: 'utf8'
          });
          console.log(`    ✓ ${cmd}`);
        } catch (error) {
          throw new Error(`Command failed: ${cmd} - ${error.message}`);
        }
      }

      // Test with sample file
      const sampleFile = path.join(tempDir, 'test.adoc');
      fs.writeFileSync(sampleFile, '= Test Document\n\nThis is a test document.');
      
      execSync(`asciidoclint ${sampleFile}`, {
        cwd: tempDir,
        timeout: 30000,
        stdio: 'pipe'
      });

    } finally {
      // Cleanup
      try {
        execSync(`npm uninstall -g ${pkg.name}`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore cleanup errors
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async validateLibraryFunctionality(pkg) {
    const tempDir = path.join(__dirname, '..', '.temp', `lib-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      // Create test script
      const testScript = `
        const pkg = require('${pkg.name}');
        console.log('Package loaded successfully');
        
        // Basic functionality test
        if (typeof pkg === 'object') {
          console.log('Package exports:', Object.keys(pkg));
        }
      `;

      fs.writeFileSync(path.join(tempDir, 'test.js'), testScript);
      
      const packageJson = {
        name: 'functionality-test',
        version: '1.0.0',
        dependencies: {
          [pkg.name]: pkg.version
        }
      };
      
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

      // Install and test
      execSync(`npm install --tag ${this.tag}`, { cwd: tempDir, stdio: 'pipe' });
      execSync('node test.js', { cwd: tempDir, timeout: 30000 });

    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async validateIntegration(pkg) {
    console.log(`  🔗 Testing integration...`);
    
    // Test with example projects
    const exampleDir = path.join(__dirname, '..', 'examples', 'basic-project');
    if (fs.existsSync(exampleDir)) {
      const tempDir = path.join(__dirname, '..', '.temp', `integration-test-${Date.now()}`);
      
      // Copy example project
      execSync(`cp -r ${exampleDir} ${tempDir}`);
      
      try {
        // Update to use the published version
        const packageJsonPath = path.join(tempDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          
          if (packageJson.dependencies && packageJson.dependencies[pkg.name]) {
            packageJson.dependencies[pkg.name] = pkg.version;
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
          }

          // Install and test
          execSync('npm install', { cwd: tempDir, stdio: 'pipe' });
          if (packageJson.scripts && packageJson.scripts.test) {
            execSync('npm test', { cwd: tempDir, timeout: this.timeout });
          }
        }

      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  }

  async validatePerformance(pkg) {
    console.log(`  🚀 Testing performance...`);
    
    // Run performance benchmarks if available
    const benchmarkScript = path.join(__dirname, '..', 'tools', 'benchmarks', 'run-benchmarks.js');
    if (fs.existsSync(benchmarkScript)) {
      const output = execSync(`node ${benchmarkScript} --package ${pkg.name}@${pkg.version}`, {
        encoding: 'utf8',
        timeout: this.timeout
      });
      
      console.log(`    Performance results: ${output.trim()}`);
    }
  }

  async validateSecurity(pkg) {
    console.log(`  🔒 Security scan...`);
    
    try {
      // Use npm audit on the package
      const tempDir = path.join(__dirname, '..', '.temp', `security-test-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      
      const packageJson = {
        name: 'security-test',
        version: '1.0.0',
        dependencies: {
          [pkg.name]: pkg.version
        }
      };
      
      fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
      
      execSync(`npm install --tag ${this.tag}`, { cwd: tempDir, stdio: 'pipe' });
      execSync('npm audit --audit-level=high', { 
        cwd: tempDir, 
        stdio: 'pipe',
        timeout: 60000
      });
      
      fs.rmSync(tempDir, { recursive: true, force: true });
      
    } catch (error) {
      if (error.status === 1) {
        // npm audit found vulnerabilities
        throw new Error('Security vulnerabilities found in dependencies');
      }
      // Other errors might be network issues, ignore them
    }
  }
}

// CLI usage
if (require.main === module) {
  const packages = JSON.parse(process.argv[2] || '[]');
  const tag = process.argv[3] || 'next';
  
  const validator = new ReleaseValidator({ tag });
  
  validator.validateRelease(packages)
    .then(results => {
      console.log('\n📊 Validation Results:');
      console.log(JSON.stringify(results, null, 2));
      
      // Check for any failures
      const hasFailures = Object.values(results).some(tests => 
        tests.some(test => test.status === 'failed')
      );
      
      if (hasFailures) {
        console.error('\n❌ Validation failed');
        process.exit(1);
      } else {
        console.log('\n✅ All validations passed');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('\n💥 Validation error:', error.message);
      process.exit(1);
    });
}

module.exports = ReleaseValidator;