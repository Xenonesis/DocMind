$beforeNodeIds = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessId)
$stdoutLog = '.\dev-3011-smoke.out.log'
$stderrLog = '.\dev-3011-smoke.err.log'
Remove-Item -LiteralPath $stdoutLog,$stderrLog -Force -ErrorAction SilentlyContinue

function Invoke-Endpoint {
  param([string]$Uri)
  try {
    $resp = Invoke-WebRequest -Uri $Uri -Method Get -TimeoutSec 15 -SkipHttpErrorCheck
    return [pscustomobject]@{ Uri = $Uri; StatusCode = [int]$resp.StatusCode; Body = [string]$resp.Content }
  } catch {
    $status = $null
    $body = $_.Exception.Message
    if ($_.Exception.Response) {
      try { $status = [int]$_.Exception.Response.StatusCode } catch {}
    }
    return [pscustomobject]@{ Uri = $Uri; StatusCode = $status; Body = [string]$body }
  }
}

function Get-DescendantProcessIds {
  param([int]$ParentId)
  $procs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Select-Object ProcessId, ParentProcessId
  $childrenMap = @{}
  foreach ($p in $procs) {
    if (-not $childrenMap.ContainsKey($p.ParentProcessId)) { $childrenMap[$p.ParentProcessId] = New-Object System.Collections.Generic.List[int] }
    $childrenMap[$p.ParentProcessId].Add([int]$p.ProcessId)
  }
  $result = New-Object System.Collections.Generic.List[int]
  $queue = New-Object System.Collections.Generic.Queue[int]
  $queue.Enqueue($ParentId)
  while ($queue.Count -gt 0) {
    $current = $queue.Dequeue()
    if ($childrenMap.ContainsKey($current)) {
      foreach ($child in $childrenMap[$current]) {
        $result.Add($child)
        $queue.Enqueue($child)
      }
    }
  }
  return @($result)
}

$proc = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','-p','3011') -WorkingDirectory (Get-Location).Path -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru

$ready = $false
for ($i = 0; $i -lt 45; $i++) {
  $probe = Invoke-Endpoint -Uri 'http://localhost:3011/api/health'
  if ($null -ne $probe.StatusCode) { $ready = $true; break }
  Start-Sleep -Seconds 2
}

$health = Invoke-Endpoint -Uri 'http://localhost:3011/api/health'
$root = Invoke-Endpoint -Uri 'http://localhost:3011/'

$healthKey = $null
if ($health.Body) {
  try {
    $json = $health.Body | ConvertFrom-Json -ErrorAction Stop
    if ($json.PSObject.Properties.Name -contains 'status') {
      $healthKey = "status=$($json.status)"
    } else {
      $firstProp = $json.PSObject.Properties | Select-Object -First 1
      if ($firstProp) { $healthKey = "$($firstProp.Name)=$($firstProp.Value)" }
    }
  } catch {
    $healthKey = ($health.Body -replace '\s+', ' ')
    if ($healthKey.Length -gt 180) { $healthKey = $healthKey.Substring(0,180) }
  }
}

$descendantIds = @(Get-DescendantProcessIds -ParentId $proc.Id)
$killIds = @($proc.Id) + $descendantIds | Sort-Object -Unique
if ($killIds.Count -gt 0) { Stop-Process -Id $killIds -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

$afterNode = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Select-Object ProcessId, CommandLine)
$extraNodeIds = @($afterNode | Where-Object { $_.ProcessId -notin $beforeNodeIds -and ($_.CommandLine -match '3011|next dev|docscan') } | Select-Object -ExpandProperty ProcessId -Unique)
if ($extraNodeIds.Count -gt 0) { Stop-Process -Id $extraNodeIds -Force -ErrorAction SilentlyContinue }

[pscustomobject]@{
  StartedPid = $proc.Id
  Ready = $ready
  HealthStatus = $health.StatusCode
  RootStatus = $root.StatusCode
  HealthBodyKey = $healthKey
  KilledProcessIds = ($killIds -join ',')
  ExtraNodeKilled = ($extraNodeIds -join ',')
} | ConvertTo-Json -Compress
