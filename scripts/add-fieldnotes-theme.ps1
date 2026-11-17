<#
.SYNOPSIS
  Adds the Fieldnotes colour theme to the tenant so any site can pick it under Change the look > Theme.

.DESCRIPTION
  Uses the SharePoint Online Management Shell (Windows PowerShell 5.1).
  Install it once:  Install-Module Microsoft.Online.SharePoint.PowerShell -Scope CurrentUser
  You need to be a SharePoint administrator.

  Section backgrounds on pages then follow the brand:
    Neutral = cream (#f7f4ec), Soft = pale green, Strong = Fieldnotes green.

.EXAMPLE
  .\add-fieldnotes-theme.ps1 -Tenant contoso
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Tenant,

  [string]$ThemeName = 'Fieldnotes'
)

$ErrorActionPreference = 'Stop'

$palettePath = Join-Path $PSScriptRoot 'fieldnotes-theme.json'
$json = Get-Content $palettePath -Raw | ConvertFrom-Json

# Add-SPOTheme wants a hashtable, not the object ConvertFrom-Json returns.
$palette = @{}
$json.PSObject.Properties | ForEach-Object { $palette[$_.Name] = $_.Value }

Connect-SPOService -Url "https://$Tenant-admin.sharepoint.com"

# -Overwrite lets you re-run the script after changing a colour.
Add-SPOTheme -Identity $ThemeName -Palette $palette -IsInverted $false -Overwrite

Write-Host "Theme '$ThemeName' added. On your site: Settings (gear) > Change the look > Theme > $ThemeName." -ForegroundColor Green
