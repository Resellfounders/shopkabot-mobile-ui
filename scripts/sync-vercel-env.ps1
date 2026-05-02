param(
  [string]$FilePath = ".env",
  [string[]]$Targets = @("production", "preview", "development")
)

$ErrorActionPreference = "Stop"

function Resolve-EnvFilePath {
  param([string]$PathValue)

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return $PathValue
  }

  return Join-Path (Get-Location) $PathValue
}

function Parse-EnvFile {
  param([string]$EnvFilePath)

  $result = [ordered]@{}

  foreach ($line in Get-Content -LiteralPath $EnvFilePath) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#")) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf("=")
    if ($separatorIndex -lt 1) {
      continue
    }

    $name = $trimmed.Substring(0, $separatorIndex).Trim()
    $value = $trimmed.Substring($separatorIndex + 1)

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $result[$name] = $value
  }

  return $result
}

$resolvedFilePath = Resolve-EnvFilePath -PathValue $FilePath

if (-not (Test-Path -LiteralPath $resolvedFilePath)) {
  throw "Env file not found: $resolvedFilePath"
}

$entries = Parse-EnvFile -EnvFilePath $resolvedFilePath

if ($entries.Count -eq 0) {
  throw "No environment variables found in $resolvedFilePath"
}

Write-Host "Syncing $($entries.Count) environment variables from $resolvedFilePath"

foreach ($target in $Targets) {
  Write-Host "Target environment: $target"

  foreach ($entry in $entries.GetEnumerator()) {
    $name = $entry.Key
    $value = [string]$entry.Value

    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
      [System.IO.File]::WriteAllText($tempFile, $value)
      Get-Content -LiteralPath $tempFile -Raw |
        npx vercel env add $name $target --force | Out-Host

      if ($LASTEXITCODE -ne 0) {
        throw "Failed to sync $name to $target"
      }
    } finally {
      Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "Vercel environment sync complete."
