# ASCII-only. PDF -> PNG via WinRT Windows.Data.Pdf.
$ErrorActionPreference = 'Stop'
$png = "C:\Users\hayaz\AppData\Local\Temp\claude\C--Users-hayaz\01721de6-ded6-458f-a4a3-0599f6e01177\scratchpad\ichiba_c\png"
$asm = [System.Reflection.Assembly]::LoadFrom("C:\WINDOWS\Microsoft.NET\assembly\GAC_MSIL\System.Runtime.WindowsRuntime\v4.0_4.0.0.0__b77a5c561934e089\System.Runtime.WindowsRuntime.dll")
$ext = $asm.GetType("System.WindowsRuntimeSystemExtensions")
[void][Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
[void][Windows.Data.Pdf.PdfDocument,Windows.Data.Pdf,ContentType=WindowsRuntime]
$asTaskOp = ($ext.GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$asTaskAct = ($ext.GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
function Await($op,$rt){ $g=$asTaskOp.MakeGenericMethod($rt); $t=$g.Invoke($null,@($op)); $t.Wait(-1)|Out-Null; $t.Result }
function AwaitAction($act){ $t=$asTaskAct.Invoke($null,@($act)); $t.Wait(-1)|Out-Null }
function Convert-Pdf($pdf,$prefix,$width){
  if(-not (Test-Path $pdf)){ Write-Output ("MISSING: "+$pdf); return }
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($pdf)) ([Windows.Storage.StorageFile])
  $doc  = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
  $n = $doc.PageCount
  for($i=0;$i -lt $n;$i++){
    $page=$doc.GetPage($i)
    $outPath=Join-Path $png ("{0}_p{1:D2}.png" -f $prefix,($i+1))
    $nf=(New-Item -ItemType File -Path $outPath -Force).FullName
    $sf=Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($nf)) ([Windows.Storage.StorageFile])
    $stream=Await ($sf.OpenAsync([Windows.Storage.FileAccessMode]::ReadWrite)) ([Windows.Storage.Streams.IRandomAccessStream])
    $opts=New-Object Windows.Data.Pdf.PdfPageRenderOptions
    $opts.DestinationWidth=[uint32]$width
    AwaitAction ($page.RenderToStreamAsync($stream,$opts))
    $stream.Dispose()
    try{$page.Close()}catch{}
  }
  Write-Output ("$prefix : $n pages")
}
$jobs = Get-Content "C:\Users\hayaz\AppData\Local\Temp\claude\C--Users-hayaz\01721de6-ded6-458f-a4a3-0599f6e01177\scratchpad\ichiba_c\pdf_list.txt" -Encoding UTF8
foreach($line in $jobs){
  if($line.Trim() -eq "" -or $line.StartsWith("#")){ continue }
  $parts = $line -split "\|"
  Convert-Pdf $parts[0].Trim() $parts[1].Trim() ([int]$parts[2].Trim())
}
Write-Output "DONE"
