<#
.SYNOPSIS
  Creates the "Shipments" list used by the Shipment Tracker web part and loads the fictional demo data.

.DESCRIPTION
  Requires PnP.PowerShell 2.x+ and an Entra ID app registration for PnP (PnP no longer ships a shared app).
  One-time setup:  Install-Module PnP.PowerShell -Scope CurrentUser
                   Register-PnPEntraIDAppForInteractiveLogin -ApplicationName "PnP PowerShell" -Tenant <tenant>.onmicrosoft.com

.EXAMPLE
  ./scripts/provision-shipments-list.ps1 -SiteUrl https://contoso.sharepoint.com/sites/logistics -ClientId <app-id>
#>
param(
  [Parameter(Mandatory)] [string] $SiteUrl,
  [Parameter(Mandatory)] [string] $ClientId,
  [string] $ListTitle = 'Shipments',
  [string] $DataFile = (Join-Path $PSScriptRoot '..\demo-data\shipments.csv'),
  [switch] $SkipDemoData
)

$ErrorActionPreference = 'Stop'
Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive

if (-not (Get-PnPList -Identity $ListTitle -ErrorAction SilentlyContinue)) {
  New-PnPList -Title $ListTitle -Template GenericList -OnQuickLaunch | Out-Null
  Write-Host "Created list '$ListTitle'"
}

Set-PnPField -List $ListTitle -Identity Title -Values @{ Title = 'Reference' } | Out-Null

$fields = @(
  @{ Name = 'Customer';    Type = 'Text' },
  @{ Name = 'Origin';      Type = 'Text' },
  @{ Name = 'Destination'; Type = 'Text' },
  @{ Name = 'Carrier';     Type = 'Text' }
)
foreach ($f in $fields) {
  if (-not (Get-PnPField -List $ListTitle -Identity $f.Name -ErrorAction SilentlyContinue)) {
    Add-PnPField -List $ListTitle -DisplayName $f.Name -InternalName $f.Name -Type $f.Type -AddToDefaultView | Out-Null
  }
}
if (-not (Get-PnPField -List $ListTitle -Identity 'Status' -ErrorAction SilentlyContinue)) {
  Add-PnPField -List $ListTitle -DisplayName 'Status' -InternalName 'Status' -Type Choice `
    -Choices 'Booked', 'In transit', 'Delivered', 'Exception' -AddToDefaultView | Out-Null
}
if (-not (Get-PnPField -List $ListTitle -Identity 'ETA' -ErrorAction SilentlyContinue)) {
  Add-PnPFieldFromXml -List $ListTitle -FieldXml '<Field Type="DateTime" DisplayName="ETA" Name="ETA" Format="DateOnly" />' | Out-Null
  $view = Get-PnPView -List $ListTitle | Where-Object DefaultView
  Set-PnPView -List $ListTitle -Identity $view.Id -Fields ($view.ViewFields + 'ETA') | Out-Null
}
Write-Host 'Columns ready'

if (-not $SkipDemoData) {
  Import-Csv $DataFile | ForEach-Object {
    Add-PnPListItem -List $ListTitle -Values @{
      Title       = $_.Title
      Customer    = $_.Customer
      Origin      = $_.Origin
      Destination = $_.Destination
      Carrier     = $_.Carrier
      Status      = $_.Status
      ETA         = $_.ETA
    } | Out-Null
  }
  Write-Host "Loaded demo data from $DataFile"
}
