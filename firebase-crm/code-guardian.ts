/**
 * Code Guardian Agent - TypeScript/React Edition
 * Intelligent code analysis and auto-fixing for TypeScript/React projects
 */

import * as fs from 'fs'
import * as path from 'path'
import * as ts from 'typescript'
import { glob } from 'glob'

interface CodeIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  file: string
  line: number
  column: number
  message: string
  suggestion: string
  autoFixable: boolean
  fixCode?: string
}

interface FileContext {
  filePath: string
  content: string
  sourceFile?: ts.SourceFile
  imports: string[]
  components: Map<string, ComponentInfo>
  hooks: Map<string, HookInfo>
  functions: Map<string, FunctionInfo>
  issues: CodeIssue[]
  dependencies: string[]
  lastModified: Date
  checksum: string
}

interface ComponentInfo {
  name: string
  props: string[]
  state: string[]
  hooks: string[]
  line: number
  isExported: boolean
}

interface HookInfo {
  name: string
  dependencies: string[]
  line: number
}

interface FunctionInfo {
  name: string
  params: string[]
  returnType?: string
  line: number
  isAsync: boolean
}

class CodeGuardianAgent {
  private projectRoot: string
  private contextMap: Map<string, FileContext> = new Map()
  private criticalPatterns: Map<string, RegExp[]>
  private reactPatterns: Map<string, RegExp[]>
  private firebasePatterns: Map<string, RegExp[]>

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.criticalPatterns = this.loadCriticalPatterns()
    this.reactPatterns = this.loadReactPatterns()
    this.firebasePatterns = this.loadFirebasePatterns()
  }

  private loadCriticalPatterns(): Map<string, RegExp[]> {
    return new Map([
      ['security', [
        /eval\s*\(/,  // Dangerous eval
        /dangerouslySetInnerHTML/,  // XSS risk
        /document\.write/,  // DOM manipulation risk
        /innerHTML\s*=/,  // XSS risk
        /localStorage\.getItem.*JSON\.parse/,  // Unsafe JSON parsing
        /sessionStorage\.getItem.*JSON\.parse/,
      ]],
      ['performance', [
        /useEffect\(\s*\(\s*\)\s*=>\s*{[^}]*}\s*,\s*\[\s*\]\s*\)/,  // Empty deps array
        /setState.*inside.*map/,  // State updates in loops
        /new Date\(\).*inside.*map/,  // Heavy operations in loops
      ]],
      ['memory_leaks', [
        /useEffect\(.*\)(?!.*return)/,  // useEffect without cleanup
        /setInterval.*(?!.*clearInterval)/,  // setInterval without clear
        /setTimeout.*(?!.*clearTimeout)/,  // setTimeout without clear
        /addEventListener.*(?!.*removeEventListener)/,  // Event listeners without cleanup
      ]],
      ['null_safety', [
        /\w+\.\w+(?!\?\.)/,  // Missing optional chaining
        /\[\w+\](?!\?\.)/,  // Array access without null check
      ]],
    ])
  }

  private loadReactPatterns(): Map<string, RegExp[]> {
    return new Map([
      ['hooks_rules', [
        /if\s*\([^)]*\)\s*{[^}]*use[A-Z]/,  // Hooks in conditions
        /for\s*\([^)]*\)\s*{[^}]*use[A-Z]/,  // Hooks in loops
        /function\s+\w+\s*\([^)]*\)\s*{[^}]*use[A-Z]/,  // Hooks in nested functions
      ]],
      ['key_prop', [
        /<\w+\s+(?!.*key=)/,  // Missing key in lists
        /\.map\([^)]*=>\s*<\w+\s+(?!.*key=)/,  // Missing key in map
      ]],
      ['state_mutation', [
        /state\.\w+\s*=\s*/,  // Direct state mutation
        /props\.\w+\s*=\s*/,  // Props mutation
      ]],
    ])
  }

  private loadFirebasePatterns(): Map<string, RegExp[]> {
    return new Map([
      ['firestore_security', [
        /collection\([^)]*\)\.doc\([^)]*\)\.set\(/,  // Direct set without auth check
        /collection\([^)]*\)\.add\(/,  // Direct add without validation
      ]],
      ['auth_checks', [
        /useAuth\(\)(?!.*\.user)/,  // useAuth without checking user
        /userData(?!\s*\?\.|&&)/,  // userData without null check
      ]],
      ['query_optimization', [
        /where\([^)]*\)\.where\([^)]*\)\.where\(/,  // Multiple where without index
        /collection\([^)]*\)\.get\(\)/,  // Get without limits
      ]],
    ])
  }

  async analyzeProject(): Promise<void> {
    console.log('🔍 Starting Code Guardian analysis...\n')

    const files = await glob('src/**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    })

    let totalIssues = 0
    let criticalIssues = 0
    let autoFixed = 0

    for (const file of files) {
      const fullPath = path.join(this.projectRoot, file)
      const context = await this.analyzeFile(fullPath)

      if (context.issues.length > 0) {
        totalIssues += context.issues.length
        criticalIssues += context.issues.filter(i => i.severity === 'critical').length

        console.log(`📄 ${file}`)
        console.log(`   Issues: ${context.issues.length}`)

        // Auto-fix if possible
        const fixableIssues = context.issues.filter(i => i.autoFixable)
        if (fixableIssues.length > 0) {
          const fixed = await this.autoFixIssues(context)
          autoFixed += fixed
          console.log(`   ✅ Auto-fixed: ${fixed}`)
        }

        // Show critical issues
        const critical = context.issues.filter(i => i.severity === 'critical')
        if (critical.length > 0) {
          critical.forEach(issue => {
            console.log(`   🔴 [${issue.type}] Line ${issue.line}: ${issue.message}`)
            console.log(`      💡 ${issue.suggestion}`)
          })
        }

        console.log('')
      }
    }

    console.log('━'.repeat(60))
    console.log(`📊 Analysis Complete`)
    console.log(`   Total files: ${files.length}`)
    console.log(`   Total issues: ${totalIssues}`)
    console.log(`   Critical issues: ${criticalIssues}`)
    console.log(`   Auto-fixed: ${autoFixed}`)
    console.log('━'.repeat(60))

    // Generate report
    await this.generateReport()
  }

  private async analyzeFile(filePath: string): Promise<FileContext> {
    const content = fs.readFileSync(filePath, 'utf-8')
    const context: FileContext = {
      filePath,
      content,
      imports: [],
      components: new Map(),
      hooks: new Map(),
      functions: new Map(),
      issues: [],
      dependencies: [],
      lastModified: fs.statSync(filePath).mtime,
      checksum: this.calculateChecksum(content),
    }

    // Parse TypeScript
    context.sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    )

    // Extract code elements
    this.extractCodeElements(context)

    // Detect issues
    this.detectCriticalIssues(context)
    this.detectReactIssues(context)
    this.detectFirebaseIssues(context)
    this.detectTypeScriptIssues(context)

    this.contextMap.set(filePath, context)
    return context
  }

  private extractCodeElements(context: FileContext): void {
    if (!context.sourceFile) return

    const visit = (node: ts.Node) => {
      // Extract imports
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier
        if (ts.isStringLiteral(moduleSpecifier)) {
          context.imports.push(moduleSpecifier.text)
        }
      }

      // Extract React components
      if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
        const componentInfo = this.extractComponentInfo(node)
        if (componentInfo) {
          context.components.set(componentInfo.name, componentInfo)
        }
      }

      // Extract custom hooks
      if (ts.isFunctionDeclaration(node)) {
        const name = node.name?.text
        if (name && name.startsWith('use')) {
          const hookInfo = this.extractHookInfo(node)
          if (hookInfo) {
            context.hooks.set(hookInfo.name, hookInfo)
          }
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(context.sourceFile)
  }

  private extractComponentInfo(node: ts.Node): ComponentInfo | null {
    // Simplified component extraction
    // In real implementation, this would be more sophisticated
    return null
  }

  private extractHookInfo(node: ts.FunctionDeclaration): HookInfo | null {
    const name = node.name?.text
    if (!name) return null

    return {
      name,
      dependencies: [],
      line: node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1,
    }
  }

  private detectCriticalIssues(context: FileContext): void {
    const lines = context.content.split('\n')

    this.criticalPatterns.forEach((patterns, category) => {
      patterns.forEach(pattern => {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            context.issues.push({
              severity: category === 'security' ? 'critical' : 'high',
              type: category,
              file: context.filePath,
              line: index + 1,
              column: 0,
              message: `Potential ${category} issue detected`,
              suggestion: this.getSuggestion(category, line),
              autoFixable: this.isAutoFixable(category),
            })
          }
        })
      })
    })
  }

  private detectReactIssues(context: FileContext): void {
    const lines = context.content.split('\n')

    this.reactPatterns.forEach((patterns, category) => {
      patterns.forEach(pattern => {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            context.issues.push({
              severity: 'high',
              type: `react_${category}`,
              file: context.filePath,
              line: index + 1,
              column: 0,
              message: `React violation: ${category}`,
              suggestion: this.getSuggestion(`react_${category}`, line),
              autoFixable: category === 'key_prop',
            })
          }
        })
      })
    })
  }

  private detectFirebaseIssues(context: FileContext): void {
    const lines = context.content.split('\n')

    this.firebasePatterns.forEach((patterns, category) => {
      patterns.forEach(pattern => {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            context.issues.push({
              severity: 'high',
              type: `firebase_${category}`,
              file: context.filePath,
              line: index + 1,
              column: 0,
              message: `Firebase issue: ${category}`,
              suggestion: this.getSuggestion(`firebase_${category}`, line),
              autoFixable: false,
            })
          }
        })
      })
    })
  }

  private detectTypeScriptIssues(context: FileContext): void {
    if (!context.sourceFile) return

    // Use TypeScript compiler to detect type errors
    const program = ts.createProgram([context.filePath], {
      noEmit: true,
      target: ts.ScriptTarget.Latest,
    })

    const diagnostics = ts.getPreEmitDiagnostics(program)

    diagnostics.forEach(diagnostic => {
      if (diagnostic.file && diagnostic.start) {
        const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')

        context.issues.push({
          severity: 'medium',
          type: 'typescript',
          file: context.filePath,
          line: line + 1,
          column: 0,
          message: message,
          suggestion: 'Fix TypeScript type error',
          autoFixable: false,
        })
      }
    })
  }

  private async autoFixIssues(context: FileContext): Promise<number> {
    // ⚠️ AUTO-FIX DISABLED FOR SAFETY
    // Auto-fixing at text level is too risky and can break working code
    // TODO: Reimplement using AST NodeTransformer for safe transformations

    console.warn('⚠️  Auto-fix is currently disabled for safety reasons')
    console.warn('   Issues detected but not automatically fixed')
    console.warn('   Review the report and fix manually')

    return 0

    /* DISABLED CODE - DO NOT ENABLE WITHOUT AST-BASED REWRITES
    let fixedCount = 0
    let content = context.content

    // Sort issues by line (reverse) to fix from bottom to top
    const fixableIssues = context.issues
      .filter(i => i.autoFixable)
      .sort((a, b) => b.line - a.line)

    for (const issue of fixableIssues) {
      const fixed = this.applyFix(content, issue)
      if (fixed) {
        content = fixed
        fixedCount++
      }
    }

    if (fixedCount > 0) {
      fs.writeFileSync(context.filePath, content, 'utf-8')
      context.content = content
    }

    return fixedCount
    */
  }

  private applyFix(content: string, issue: CodeIssue): string | null {
    const lines = content.split('\n')
    const lineIndex = issue.line - 1

    if (lineIndex >= lines.length) return null

    let line = lines[lineIndex]

    // Apply specific fixes based on issue type
    switch (issue.type) {
      case 'key_prop':
        // Add key prop to elements in map
        if (line.includes('.map(') && line.includes('=>')) {
          line = line.replace(/(<\w+)(\s)/g, '$1 key={index}$2')
          lines[lineIndex] = line
          return lines.join('\n')
        }
        break

      case 'null_safety':
        // Add optional chaining
        line = line.replace(/(\w+)\.(\w+)/g, '$1?.$2')
        lines[lineIndex] = line
        return lines.join('\n')

      case 'memory_leaks':
        // Add cleanup for useEffect
        if (line.includes('useEffect')) {
          // Find the closing brace and add return cleanup
          // This is simplified - real implementation would be more complex
          return content
        }
        break
    }

    return null
  }

  private getSuggestion(category: string, line: string): string {
    const suggestions: Record<string, string> = {
      'security': 'Remove dangerous code or use safe alternatives',
      'performance': 'Optimize performance - move heavy operations outside render',
      'memory_leaks': 'Add cleanup function to prevent memory leaks',
      'null_safety': 'Add null checks or use optional chaining (?.)',
      'react_hooks_rules': 'Move hooks to top level - cannot be in conditions/loops',
      'react_key_prop': 'Add unique key prop to list items',
      'react_state_mutation': 'Use setState instead of direct mutation',
      'firebase_security': 'Add authentication checks before database operations',
      'firebase_auth_checks': 'Check if user is authenticated before accessing userData',
      'firebase_query_optimization': 'Add Firestore composite index or limit queries',
    }

    return suggestions[category] || 'Review and fix the issue'
  }

  private isAutoFixable(category: string): boolean {
    const autoFixableCategories = [
      'null_safety',
      'react_key_prop',
    ]
    return autoFixableCategories.includes(category)
  }

  private calculateChecksum(content: string): string {
    // Simple checksum calculation
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  private async generateReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      files: Array.from(this.contextMap.values()).map(ctx => ({
        file: ctx.filePath,
        issues: ctx.issues.length,
        critical: ctx.issues.filter(i => i.severity === 'critical').length,
        components: ctx.components.size,
        hooks: ctx.hooks.size,
        imports: ctx.imports.length,
      })),
      summary: {
        totalFiles: this.contextMap.size,
        totalIssues: Array.from(this.contextMap.values()).reduce((sum, ctx) => sum + ctx.issues.length, 0),
        criticalIssues: Array.from(this.contextMap.values()).reduce(
          (sum, ctx) => sum + ctx.issues.filter(i => i.severity === 'critical').length,
          0
        ),
      },
    }

    const reportPath = path.join(this.projectRoot, 'code-guardian-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
    console.log(`\n📋 Report saved to: code-guardian-report.json`)
  }
}

// CLI interface
async function main() {
  const projectRoot = process.argv[2] || process.cwd()

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  CODE GUARDIAN AGENT                      ║
║            TypeScript/React Edition v1.0                  ║
╚═══════════════════════════════════════════════════════════╝
`)

  const agent = new CodeGuardianAgent(projectRoot)
  await agent.analyzeProject()
}

main().catch(console.error)
