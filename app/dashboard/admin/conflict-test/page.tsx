"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Play, RotateCcw } from "lucide-react"
import { runCrossLocationConflictTests, TestResult } from "@/lib/tests/cross-location-conflict-test"

export default function ConflictTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    try {
      const results = await runCrossLocationConflictTests()
      setTestResults(results)
      setHasRun(true)
    } catch (error) {
      console.error('Error running tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const resetTests = () => {
    setTestResults([])
    setHasRun(false)
  }

  const getTestSummary = () => {
    const total = testResults.length
    const passed = testResults.filter(r => r.passed).length
    const failed = total - passed
    const passRate = total > 0 ? (passed / total) * 100 : 0

    return { total, passed, failed, passRate }
  }

  const summary = getTestSummary()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cross-Location Conflict Prevention Tests</h1>
          <p className="text-muted-foreground mt-2">
            Test suite to verify that staff members cannot be double-booked across different location types.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetTests}
            disabled={isRunning || !hasRun}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={runTests}
            disabled={isRunning}
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? "Running Tests..." : "Run Tests"}
          </Button>
        </div>
      </div>

      {isRunning && (
        <Alert>
          <AlertDescription>
            Running cross-location conflict prevention tests... This may take a few moments.
          </AlertDescription>
        </Alert>
      )}

      {hasRun && !isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Test Results Summary
              {summary.passRate === 100 ? (
                <Badge className="bg-green-500">All Passed</Badge>
              ) : summary.passRate >= 80 ? (
                <Badge className="bg-yellow-500">Mostly Passed</Badge>
              ) : (
                <Badge variant="destructive">Issues Found</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Overall test execution results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.passRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Pass Rate</div>
              </div>
            </div>
            
            <Progress value={summary.passRate} className="w-full" />
            
            {summary.passRate === 100 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  🎉 All tests passed! The cross-location conflict prevention system is working correctly.
                </AlertDescription>
              </Alert>
            )}
            
            {summary.failed > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {summary.failed} test(s) failed. Please review the detailed results below and address any issues.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Detailed Test Results</h2>
          
          {testResults.map((result, index) => (
            <Card key={index} className={`border-l-4 ${
              result.passed 
                ? 'border-l-green-500 bg-green-50/50' 
                : 'border-l-red-500 bg-red-50/50'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {result.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  {result.testName}
                  <Badge variant={result.passed ? "default" : "destructive"}>
                    {result.passed ? "PASSED" : "FAILED"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm ${
                  result.passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                
                {result.details && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!hasRun && !isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Test Coverage</CardTitle>
            <CardDescription>
              This test suite covers the following scenarios:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Basic conflict prevention between physical and home service locations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Home service to physical location conflict detection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Physical location to home service conflict detection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Multiple location conflict handling
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Buffer time conflict prevention
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Appointment update conflict detection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Concurrent booking attempt handling
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Different staff members at same time (should not conflict)
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
