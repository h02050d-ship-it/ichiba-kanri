param(
  [Parameter(Mandatory=$true)][string]$Pdf,
  [Parameter(Mandatory=$true)][string]$OutDir,
  [int]$Width = 1700,
  [string]$Prefix = ""
)
# WinRT Windows.Data.Pdf でPDF→PNG化（poppler不要）。
# PS5.1では [System.WindowsRuntimeSystemExtensions] アクセラレータが解決不能 → reflection で型取得。
$asm = [System.Reflection.Assembly]::LoadFrom("C:\WINDOWS\Microsoft.NET\assembly\GAC_MSIL\System.Runtime.WindowsRuntime\v4.0_4.0.0.0__b77a5c561934e089\System.Runtime.WindowsRuntime.dll")
$ext = $asm.GetType("System.WindowsRuntimeSystemExtensions")
[void][Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
[void][Windows.Data.Pdf.PdfDocument,Windows.Data.Pdf,ContentType=WindowsRuntime]

$asTaskOp = ($ext.GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]
$asTaskAct = ($ext.GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction'
})[0]

function Await($op, $resultType) {
  $g = $asTaskOp.MakeGenericMethod($resultType)
  $t = $g.Invoke($null, @($op))
  $t.Wait(-1) | Out-Null
  $t.Result
}
function AwaitAction($act) {
  $t = $asTaskAct.Invoke($null, @($act))
  $t.Wait(-1) | Out-Null
}

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
if ($Prefix -eq "") { $Prefix = [System.IO.Path]::GetFileNameWithoutExtension($Pdf) }

$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Pdf)) ([Windows.Storage.StorageFile])
$doc  = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
$n = $doc.PageCount
Write-Output "PAGES: $n"
for ($i = 0; $i -lt $n; $i++) {
  $page = $doc.GetPage($i)
  $outPath = Join-Path $OutDir ("{0}_p{1:D2}.png" -f $Prefix, ($i+1))
  $nf = (New-Item -ItemType File -Path $outPath -Force).FullName
  $sf = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($nf)) ([Windows.Storage.StorageFile])
  $stream = Await ($sf.OpenAsync([Windows.Storage.FileAccessMode]::ReadWrite)) ([Windows.Storage.Streams.IRandomAccessStream])
  $opts = New-Object Windows.Data.Pdf.PdfPageRenderOptions
  $opts.DestinationWidth = [uint32]$Width
  AwaitAction ($page.RenderToStreamAsync($stream, $opts))
  $stream.Flush() | Out-Null
  $stream.Dispose()
  try { $page.Close() } catch {}
  Write-Output "WROTE: $outPath"
}
