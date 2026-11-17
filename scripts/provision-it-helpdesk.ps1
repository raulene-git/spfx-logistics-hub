<#
.SYNOPSIS
  Creates the IT Tickets and IT Worklogs lists for the IT Help web part, and sets who can see what.

.DESCRIPTION
  Security is done by SharePoint, not the web part:
    - IT Tickets uses item-level permissions: everyone can raise tickets, but people only see and edit their own.
    - The "Fieldnotes IT Support" group gets Edit on the list. Edit includes Manage Lists, which bypasses
      item-level permissions, so IT sees every ticket. The web part checks that same permission to show the queue.
    - IT Worklogs is visible to IT and site owners only.

  Requires PnP.PowerShell 2.x+ and an Entra ID app registration for PnP (see provision-shipments-list.ps1).

.EXAMPLE
  ./scripts/provision-it-helpdesk.ps1 -SiteUrl https://contoso.sharepoint.com/sites/fieldnotes -ClientId <app-id> `
    -ItMembers priya@contoso.onmicrosoft.com -WithDemoTickets
#>
param(
  [Parameter(Mandatory)] [string] $SiteUrl,
  [Parameter(Mandatory)] [string] $ClientId,
  [string] $TicketList = 'IT Tickets',
  [string] $WorklogList = 'IT Worklogs',
  [string] $ItGroup = 'Fieldnotes IT Support',
  # People to add to the IT group (sign-in names / emails).
  [string[]] $ItMembers = @(),
  [switch] $WithDemoTickets
)

$ErrorActionPreference = 'Stop'
Connect-PnPOnline -Url $SiteUrl -ClientId $ClientId -Interactive

function Add-FieldIfMissing([string] $List, [string] $Name, [scriptblock] $Create) {
  if (-not (Get-PnPField -List $List -Identity $Name -ErrorAction SilentlyContinue)) {
    & $Create | Out-Null
  }
}

# ---------- IT group ----------
if (-not (Get-PnPGroup -Identity $ItGroup -ErrorAction SilentlyContinue)) {
  New-PnPGroup -Title $ItGroup -Description 'IT staff who work the IT Help queue' | Out-Null
  Write-Host "Created group '$ItGroup'"
}
# Read on the site so IT can open the IT Help page; their real rights are on the lists below.
Set-PnPGroupPermissions -Identity $ItGroup -AddRole 'Read' -ErrorAction SilentlyContinue | Out-Null
foreach ($member in $ItMembers) {
  Add-PnPGroupMember -Group $ItGroup -LoginName $member
  Write-Host "Added $member to '$ItGroup'"
}

$owners = Get-PnPGroup -AssociatedOwnerGroup
$members = Get-PnPGroup -AssociatedMemberGroup
$visitors = Get-PnPGroup -AssociatedVisitorGroup

# ---------- IT Tickets ----------
if (-not (Get-PnPList -Identity $TicketList -ErrorAction SilentlyContinue)) {
  New-PnPList -Title $TicketList -Template GenericList | Out-Null
  Write-Host "Created list '$TicketList'"
}
Set-PnPField -List $TicketList -Identity Title -Values @{ Title = 'Summary' } | Out-Null

Add-FieldIfMissing $TicketList 'TicketType' { Add-PnPField -List $TicketList -DisplayName 'Type' -InternalName 'TicketType' -Type Choice -Choices 'Incident', 'Service request' -AddToDefaultView }
Add-FieldIfMissing $TicketList 'TicketCategory' { Add-PnPField -List $TicketList -DisplayName 'Category' -InternalName 'TicketCategory' -Type Text -AddToDefaultView }
Add-FieldIfMissing $TicketList 'TicketPriority' { Add-PnPField -List $TicketList -DisplayName 'Priority' -InternalName 'TicketPriority' -Type Choice -Choices 'Critical', 'High', 'Medium', 'Low' -AddToDefaultView }
Add-FieldIfMissing $TicketList 'TicketStatus' { Add-PnPField -List $TicketList -DisplayName 'Status' -InternalName 'TicketStatus' -Type Choice -Choices 'Open', 'In progress', 'Resolved', 'Closed' -AddToDefaultView }
Add-FieldIfMissing $TicketList 'TicketDepot' { Add-PnPField -List $TicketList -DisplayName 'Depot' -InternalName 'TicketDepot' -Type Text -AddToDefaultView }
Add-FieldIfMissing $TicketList 'TicketDescription' { Add-PnPField -List $TicketList -DisplayName 'Description' -InternalName 'TicketDescription' -Type Note }
Add-FieldIfMissing $TicketList 'TicketDetails' { Add-PnPFieldFromXml -List $TicketList -FieldXml '<Field Type="Note" DisplayName="Template answers" Name="TicketDetails" StaticName="TicketDetails" NumLines="6" RichText="FALSE" />' }
Add-FieldIfMissing $TicketList 'TicketAssignee' { Add-PnPField -List $TicketList -DisplayName 'Assigned to' -InternalName 'TicketAssignee' -Type User -AddToDefaultView }

# People read and edit only their own tickets.
$list = Get-PnPList -Identity $TicketList
$list.ReadSecurity = 2
$list.WriteSecurity = 2
$list.Update()
Invoke-PnPQuery

# Everyone can add tickets (Contribute has no Manage Lists, so item-level security applies); IT gets Edit.
Set-PnPList -Identity $TicketList -BreakRoleInheritance -CopyRoleAssignments | Out-Null
if ($members) { Set-PnPListPermission -Identity $TicketList -Group $members -RemoveRole 'Edit' -AddRole 'Contribute' -ErrorAction SilentlyContinue }
if ($visitors) { Set-PnPListPermission -Identity $TicketList -Group $visitors -RemoveRole 'Read' -AddRole 'Contribute' -ErrorAction SilentlyContinue }
Set-PnPListPermission -Identity $TicketList -Group $ItGroup -AddRole 'Edit'
Write-Host "'$TicketList' ready: people see their own tickets, '$ItGroup' sees all"

# ---------- IT Worklogs ----------
if (-not (Get-PnPList -Identity $WorklogList -ErrorAction SilentlyContinue)) {
  New-PnPList -Title $WorklogList -Template GenericList | Out-Null
  Write-Host "Created list '$WorklogList'"
}
Add-FieldIfMissing $WorklogList 'TicketId' { Add-PnPField -List $WorklogList -DisplayName 'Ticket ID' -InternalName 'TicketId' -Type Number -AddToDefaultView }
Add-FieldIfMissing $WorklogList 'LogMessage' { Add-PnPField -List $WorklogList -DisplayName 'Message' -InternalName 'LogMessage' -Type Note -AddToDefaultView }

# Only IT and owners can see worklogs.
Set-PnPList -Identity $WorklogList -BreakRoleInheritance | Out-Null
if ($owners) { Set-PnPListPermission -Identity $WorklogList -Group $owners -AddRole 'Full Control' }
Set-PnPListPermission -Identity $WorklogList -Group $ItGroup -AddRole 'Edit'
Write-Host "'$WorklogList' ready: visible to '$ItGroup' and owners only"

# ---------- Demo tickets ----------
if ($WithDemoTickets) {
  $demo = @(
    @{ Title = 'Label printer on Bay 2 won''t print'; TicketType = 'Incident'; TicketCategory = 'Label printer'; TicketPriority = 'Critical'; TicketDepot = 'Bristol Hub'
       TicketDescription = 'Red light on the printer and labels come out blank. Outbound pallets are waiting.' },
    @{ Title = 'Handheld scanner won''t connect to Wi-Fi'; TicketType = 'Incident'; TicketCategory = 'Handheld scanner'; TicketPriority = 'High'; TicketDepot = 'Glasgow Hub'
       TicketDescription = 'Scanner 14 drops off the network in the chiller.' },
    @{ Title = 'Second monitor for the planning desk'; TicketType = 'Service request'; TicketCategory = 'New equipment'; TicketPriority = 'Low'; TicketDepot = 'Southampton Port'
       TicketDescription = 'Planning would like a second screen for the route map.' }
  )
  foreach ($t in $demo) {
    $t.TicketStatus = 'Open'
    $t.TicketDetails = '[]'
    Add-PnPListItem -List $TicketList -Values $t | Out-Null
  }
  Write-Host "Added $($demo.Count) demo tickets"
}

Write-Host ''
Write-Host 'Done. In the IT Help web part settings choose "SharePoint lists". Site owners and the IT group see the queue; everyone else sees the request form.'
