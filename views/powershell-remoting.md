# Table of Contents

1.  [Introduction](#orga89fff9)
2.  [Requirements](#org2f523ac)
3.  [Overview](#org2f89c40)
4.  [Setup](#orgfbeb3b4)
	1.  [Public Key Infrastructure](#org04f06be)
		1.  [About Certificates](#orgf5fabd8)
		2.  [Objectives](#orgcec9069)
		3.  [Preparation](#orgaadb6bf)
		4.  [Certificate Creation](#orgda6fdd6)
		5.  [Inspection](#inspect-cert)
		6.  [Storage & Distribution](#org8caa03a)
	2.  [Servers](#orge2c64ef)
		1.  [Certificate Installation](#orgae97397)
		2.  [Service Configuration](#service-config)
	3.  [Clients](#org931f2aa)
		1.  [Certificate Installation](#org904057a)
		2.  [Usage & Optimization](#orgede1e5b)
5.  [Troubleshooting](#org2f692e4)
	1.  [Certificates](#orgf5ccd84)
	2.  [Services](#org275f40b)
		1.  [Server](#orgc829245)
		2.  [Client](#org9f50b4a)


# Introduction

Secure Shell has long offered the Unix community secure, encrypted remote shell sessions with passwordless authentication.
PowerShell Remoting offers this, too, though securely achieving it without an Active Directory domain has been elusive due to execrable documentation.
This article addresses that.

# Requirements

The following is known to work on Windows 10 non-Home editions (Pro, Enterprise, Education) and Windows Server.
It will probably work on earlier versions.
Not required

-   Windows Server
-   Active Directory domains
-   Active Directory Certificate Services

Computers not joined to domains are fine.
Everything needed to generate your own certificates is built-in.

# Overview

Since 1995, the Unix community has been using public-key cryptography to securely access remote shells across the internet.
Public-key cryptography consists of generating key pairs

-   a public key
-   a private key.

Public-key pairs exhibit these properties

-   computing a complete key pair with either key missing is computationally prohibitive
-   generating a new pair is practical
-   messages encrypted by one key are decrypted by the other.

As corollaries, in practice

1.  messages encrypted by the public key can be decrypted exclusively by whomever possesses a private key
2.  possession of a private key may be proven by encryption challenges passed by employing the private key.

Thus, as long as the private key is kept secret, public key pairs provide

1.  encryption: secret, 1-way communication from the public to the private key owner
2.  authentication: reasonable proof of private key possession without revealing the private key.

SSH has long used these features to establish secure, passwordless, remote shell sessions.
Typically, the only setup needed is for the user to

1.  generate a client key pair
2.  install the client public key on a server to which they will remotely connect.

Servers are already setup with host key pairs, allowing the user to save the public key.
When the user connects from their client to the remote server, the systems

1.  perform mutual authentication
	1.  the server uses its host keys to authenticate to the client
	2.  the client uses the user’s client keys to authenticate to the server.
2.  negotiate an encrypted session.

If the user enters a password at all, they do so only to decrypt their client keys.
Otherwise, no password is needed.
Alternatively, key decryption can be unified with logon (ie, single sign-on) or managed with a key agent that reduces password reentry.

Achieving secure and passwordless authentication based on public cryptography is possible for PowerShell Remoting through [Client Certificate-based Authentication](https://msdn.microsoft.com/en-us/library/aa384295.aspx#Client_Certificate-based_Authentication), though complicated, error-prone, and poorly documented.
It requires

-   X.509 certificates for both the host and client
-   firewall rules permitting remoting over TLS
-   security group changes
-   service activation.

X.509 certificates can be produced free with tools built into Windows.

# Setup

## Public Key Infrastructure

### About Certificates

Setup employs [X.509](https://en.wikipedia.org/wiki/X.509) public key certificates, so understanding them is vital for remediation and success.
Systems dependant on certificates require *verifiable* certificates that are *trusted*, *valid*, and *operable*.

X.509 binds assertions about a public key pair to a public key through a cryptographically signed certificate bearing the assertions and the public key.
Assertions include

-   names for the subject (key owner) and issuer (certificate signer)
-   usage qualifiers
-   validity period

These assertions are trusted only if signatures trace back to a trusted source.
Trust typically follows a heirarchy.
Each certificate bears a signature of an authority, whose certificate also bears a signature.
This recursion produces a chain of signatures terminating with a self-signed certificate of a root authority.
Ultimately, the verifier either trusts the root or it does not: acceptance descends accordingly.
Specifically,

-   a self-signed certificate is trusted when trust is preset
-   any other certificate is trusted when the signer hasn’t revoked it, and the signer’s certificate is trusted.

Moreover, if all certificates in the trusted chain have active validity periods, then they are valid.

Finally, if a valid certificate’s usage qualifiers permit all operations a system needs to commit with it, then the certificate is operable.

### Objectives

Our certificates will achieve requisites as follows.

-   **verifiability:** on every computer, install all authority certificates of our signature chains; this will be our single root authority certificate.
-   **trust:** preset each computer to trust our root authority certificate; we won’t revoke any certificates.
-   **validity:** assign our certificates active validity periods.
-   **operability:** assign our certificates correct usage qualifiers.

For our public key infrastructure, we will create

-   **as root authority:** 1 self-signed certificate
-   **for each computer:** 1 web host certificate
-   **for each user:** 1 web client certificate

The root authority signs all certificates.
As sensible security, private keys, especially the root authority’s, should be guarded.

Windows manages certificates by scattering them in registry keys presented as Certificate Stores to management consoles (`certlm.msc` & `certmgr.msc`) and PowerShell drives (`Cert:`).
These certificate stores preset trust and control certificate operations.
To each server’s *machine* certificate stores, we’ll install operatively appropriate certificates.

-   **root:** the self-signed certificate
-   **trusted people:** every user’s web client certificate
-   **machine’s personal:** the computer’s own web host certificate with private key

Each user’s web client certificate with private key may be stored in their profile’s personal user certificate store or on a more secure medium such as a smart card.
The root authority’s certificate with private key may be stored in any secure location; its use should be infrequent.

### Preparation

To facilitate setup and reduce typing, I’ve prepared a [script](https://gist.github.com/lmmarsano/30bdbf6a6e91bf4d0488f65edc531af1) and [module](https://www.powershellgallery.com/packages/CustomPKI/): the module extends `New-SelfSignedCertificate` with friendlier parameters to add subject alternative names and extended key usage extensions to certificates.
From PowerShell, you’ll need to download the script and run it inline (dot-source it).

```powershell
Start-BitsTransfer -Source https://gist.githubusercontent.com/lmmarsano/30bdbf6a6e91bf4d0488f65edc531af1/raw/certutil.ps1
. .\certutil.ps1
```

If the module is missing, the script will offer to install it: please accept and rerun the script inline.
Alternatively, you may install the module

```powershell
Install-Module -Name CustomPKI -Scope CurrentUser -AllowClobber
```

then run the script inline

```powershell
. .\certutil.ps1
```

### Certificate Creation

Choose a valid period for our certificates.
We’ll need 2 dates to provide [New-SelfSignedCertificate](https://docs.microsoft.com/en-us/powershell/module/pkiclient/new-selfsignedcertificate)

-   **NotBefore:** date & time validity begins
-   **NotAfter:** date & time validity ends

The provided `New-ValidityInterval` function returns these dates as a reusable hash object computed from `-Start` (optional: defaults to today) and `-YearsDuration`.

```powershell
$commonArgs = New-ValidityInterval -YearsDuration 10
```

1.  Root Certificate Authority

	Choose a name, organization, your [2-letter country code](https://www.iso.org/obp/ui/#search/code/), and run the commands

	```powershell
	$rootca = New-RootCACertificate -CommonName CustomRoot -Organization CustomOrg -Country US @commonArgs
	Export-PrivateCertificate -Cert $rootca
	$commonArgs.RootCA = $rootca
	```

	We set `RootCA` in `$commonArgs` to sign all remaining certificates.

2.  Server Certificates

	For each server, create a certificate bearing its hostname and all its domain names.

	```powershell
	(-split @'
	host-0
	host-1
	⋮
	host-n
	'@) | % { Export-PrivateCertificate -Remove -Cert (New-ServerCertificate -HostName $_,('{0}.suffix' -f $_),localhost @commonArgs) }
	```

	For each server `host-i`, the above creates a certificate listing its domain names

	-   host-i
	-   host-i.suffix
	-   localhost

	in the Subject Alternative Name extension, and exports this certificate and private key to the file `host-i.p12`.
	Adapt the above to suite your needs.

	1.  Hostname Lookup

		```powershell
		[System.Net.Dns]::GetHostName()
		```

	2.  Domain Name Lookup

		If your network has a fully functioning domain name system, some domain names can be queried by the server’s IP addresses.

		```powershell
		PS C:\> Get-NetAdapter

		Name                      InterfaceDescription                    ifIndex Status       LinkSpeed
		----                      --------------------                    ------- ------       ---------
		Ethernet                  Realtek PCIe GBE Family Controller           10 Disconnected     0 bps
		Wi-Fi                     Ralink RT5390R 802.11bgn Wi-Fi Adapter       14 Up             72 Mbps

		PS C:\> Get-NetIPAddress -InterfaceIndex 14 | % { Resolve-DnsName -Name $_.IPAddress } | Select-Object -ExpandProperty NameHost | Sort-Object
		-Unique
		hostname.suffix
		```

3.  Client Certificates

	For each user, create a certificate bearing all their local usernames on all servers: each username appears as a Subject Alternative Name UPN field consisting of *username* `@localhost`.

	```powershell
	$client = (-split @'
	user-0
	user-1
	⋮
	user-n
	'@) | % { New-ClientCertificate -User $_ @commonArgs }
	Export-Certificate -Cert $client -Type P7B -FilePath client.p7b
	$client | % { Export-PrivateCertificate -Cert $_ -Remove }
	```

	`New-ClientCertificate` adds the suffix and attaches the appropriate field.
	For users with multiple names, the `-User` parameter accepts a list.
	The above bundles all public certificates into a bundle file `client.p7b`.
	For each user `user-i`, it exports their certificate with private key to `user-i.pk12`.
	Adapt the above to suit your needs.

	1.  Username Lookup

	```powershell
	[System.Environment]::UserName
	```

### Inspection

1.  Files

	Public certificates

	```powershell
	certutil -dump file
	```

	Public certificates with private keys (`*.p12`)

	```powershell
	certutil -v -dump file
	```

2.  Stores

	PowerShell has the [Certificate drive](https://docs.microsoft.com/powershell/module/microsoft.powershell.security/providers/certificate-provider) `Cert:`.
	Browse with usual cmdlets such as `Get-ChildItem`.
	Alternatively, open the consoles `certlm.msc`, `certmgr.msc`.
	Unless you specified otherwise, all certificates were created in your personal store `Cert:\CurrentUser\My\`.

	```powershell
	PS C:\> Get-ChildItem -Path Cert:\CurrentUser\My\

		 PSParentPath: Microsoft.PowerShell.Security\Certificate::CurrentUser\My

	Thumbprint                                Subject
	----------                                -------
	1ABB2AD73583007E9DE803291960146D94AD9A52  CN=CustomRoot, O=CustomOrg, C=US
	```

	Unfortunately, PowerShell won’t easily show much more information.

	```powershell
	PS C:\> Get-Item -Path Cert:\CurrentUser\My\1ABB2AD73583007E9DE803291960146D94AD9A52 | Format-List

	Subject      : CN=CustomRoot, O=CustomOrg, C=US
	Issuer       : CN=CustomRoot, O=CustomOrg, C=US
	Thumbprint   : 1ABB2AD73583007E9DE803291960146D94AD9A52
	FriendlyName : CustomRoot
	NotBefore    : 3/16/2018 12:00:00 AM
	NotAfter     : 3/16/2028 12:00:00 AM
	Extensions   : {System.Security.Cryptography.Oid, System.Security.Cryptography.Oid, System.Security.Cryptography.Oid}
	```

	The best command for the task is `certutil`.

	```powershell
	PS C:\> certutil.exe -v -user -store my CustomRoot
	my "Personal"
	================ Certificate 3 ================
	X509 Certificate:
	Version: 3
	Serial Number: 4110b8f5b9f11d834c76b4b45db9c714
	Signature Algorithm:
			Algorithm ObjectId: 1.2.840.113549.1.1.11 sha256RSA
			Algorithm Parameters:
			05 00
	Issuer:
			CN=CustomRoot
			O=CustomOrg
			C=US
		Name Hash(sha1): a327ec9763457666fa47eef9e958cbcd04c3e5c7
		Name Hash(md5): edb277917ff4c0363da633ae5b3e0c65

	 NotBefore: 3/16/2018 12:00 AM
	 NotAfter: 3/16/2028 12:00 AM

	Subject:
			CN=CustomRoot
			O=CustomOrg
			C=US
		Name Hash(sha1): a327ec9763457666fa47eef9e958cbcd04c3e5c7
		Name Hash(md5): edb277917ff4c0363da633ae5b3e0c65

	Public Key Algorithm:
			Algorithm ObjectId: 1.2.840.113549.1.1.1 RSA
			Algorithm Parameters:
			05 00
	Public Key Length: 2048 bits
	Public Key: UnusedBits = 0
			0000  30 82 01 0a 02 82 01 01  00 ce 12 c8 a4 26 00 71
			0010  68 1d f7 69 31 27 f4 dc  f4 85 40 56 d8 66 d6 9c
			0020  48 a9 79 5b ee ab 1d 2b  91 fd 62 37 6f c3 f2 a4
			0030  fe 8d e1 2d 4e 2f b8 15  eb 1c 94 e3 30 e8 a0 a4
			0040  66 24 22 0c 1e 76 f0 d4  86 3f 86 c0 fa 3b d4 bd
			0050  76 87 14 23 46 0c 09 aa  81 84 0a d8 e0 82 09 88
			0060  74 67 b5 a6 72 bf 9d b5  c1 6b 5f 2e 1b 03 fa 7e
			0070  47 2d eb c6 99 ef e8 a1  98 3e ff 7e 56 c3 4e 9d
			0080  98 26 c3 8b 53 e3 f9 91  16 11 95 f7 48 bb dd 98
			0090  ad 39 db 99 c0 88 f4 88  1d 76 36 29 99 b0 72 25
			00a0  67 78 0e b6 6e 75 ae 9a  4c 0b ec 5d 6a 6f ca 18
			00b0  01 52 76 05 02 fc 5f b5  e9 1e 96 03 16 5e 78 1c
			00c0  67 b9 a9 7e f9 4a d7 b4  38 e2 0b 01 0f 42 ed c9
			00d0  44 a5 3e 40 55 b5 6f 7f  ec b9 69 f8 12 01 6e 61
			00e0  1e 77 31 f6 2e 5d 72 10  98 c1 91 b2 bf 34 65 b1
			00f0  de 79 b4 2f 8b 50 70 d2  a1 4f d3 81 65 1c 51 a8
			0100  5a 9b b7 a2 c9 47 78 33  59 02 03 01 00 01
	Certificate Extensions: 3
			2.5.29.15: Flags = 1(Critical), Length = 4
			Key Usage
					Certificate Signing, Off-line CRL Signing, CRL Signing (06)

			2.5.29.19: Flags = 1(Critical), Length = 5
			Basic Constraints
					Subject Type=CA
					Path Length Constraint=None

			2.5.29.14: Flags = 0, Length = 16
			Subject Key Identifier
					c2f300d811eba073aeb33a36f882363a3f8ddbf3

	Signature Algorithm:
			Algorithm ObjectId: 1.2.840.113549.1.1.11 sha256RSA
			Algorithm Parameters:
			05 00
	Signature: UnusedBits=0
			0000  ba de 4c 1d 83 12 a6 12  c5 39 a2 ad a5 6d 1a 75
			0010  55 6a 80 9e c0 75 f6 0e  d7 02 f1 26 c1 56 22 94
			0020  ed 5f 66 de ae d5 6b 90  a2 14 3c c1 ae e7 34 d2
			0030  40 f2 39 0f 0e 20 fd 9a  a8 ea 16 e4 c2 c8 3b d7
			0040  58 79 1a bc eb e8 18 14  77 92 35 30 18 11 a6 1f
			0050  6a c5 42 91 f8 22 30 5e  de 4f 18 c0 7a a6 05 fa
			0060  77 d0 db 0a a4 6d d5 95  47 73 de 8b 9a f7 f0 32
			0070  ef 00 3f 44 02 c6 19 43  36 f5 47 22 f7 25 7c 64
			0080  d6 a2 54 d8 d8 f4 16 42  dc 62 7b fd 5a 76 0f fb
			0090  3d 15 74 9b b6 fe 9a 4a  1e 40 9b 19 77 75 57 5c
			00a0  49 9b 8d 2b 29 75 73 e0  19 da e6 39 c0 57 19 9f
			00b0  fa bf c7 74 0a 09 86 d4  07 d3 57 2b 43 21 d8 49
			00c0  e4 19 e9 cb b5 65 00 70  36 d1 3d 6d c2 cc 9f 9d
			00d0  9c e9 45 bf ed a9 15 33  3f 63 38 50 11 05 88 aa
			00e0  02 08 5a 17 f1 c8 54 17  5c d1 ef 65 13 26 a1 70
			00f0  a9 22 46 1b 7f c3 4f 9a  ba 54 bc ad 4c a7 fc 4c
	Signature matches Public Key
	Root Certificate: Subject matches Issuer
	Key Id Hash(rfc-sha1): c2f300d811eba073aeb33a36f882363a3f8ddbf3
	Key Id Hash(sha1): a168d886679e9449a5c7d8aa6f88c3353bd17a4a
	Key Id Hash(bcrypt-sha1): d6ffce5bc269db040f4f438833154a80ef32ddb7
	Key Id Hash(bcrypt-sha256): f014194c5688b3c3221199eb63f9c2cab05142cf909ee7aa3e68a278daa963b3
	Key Id Hash(md5): 918cb8c487e616a3432db7c210c9022f
	Key Id Hash(sha256): 3a08dbdf741fa0c7821b450a2fc555ef034a8bed1890ce5a86571eef373b4fbd
	Key Id Hash(pin-sha256): /eVMx3Nh1QnsPkH6SSFOA7xFI2QhOhpRGo1bRAP1a6E=
	Key Id Hash(pin-sha256-hex): fde54cc77361d509ec3e41fa49214e03bc452364213a1a511a8d5b4403f56ba1
	Cert Hash(md5): 866c58775c60d815d9d65aaeb99dc125
	Cert Hash(sha1): 1abb2ad73583007e9de803291960146d94ad9a52
	Cert Hash(sha256): 7c38d1ae3768637a7a165765bd2cda8f1a1cfa6a7ba8013cfb9263a86d4b6380
	Signature Hash: d79e5b4acddaef149679fcfb7a6093a8213a192a278347b7e6e669215338505c

		CERT_MD5_HASH_PROP_ID(4):
			866c58775c60d815d9d65aaeb99dc125

		CERT_KEY_IDENTIFIER_PROP_ID(20):
			c2f300d811eba073aeb33a36f882363a3f8ddbf3

		CERT_KEY_PROV_INFO_PROP_ID(2):
			Key Container = te-0125d557-d02e-41dc-8476-36f189060ce9
		Unique container name: b59b1bf435f36edf92e0609b0f6826a0_a1b49e9a-fc4c-4d42-a1f8-12bc38b17eb7
			Provider = Microsoft Software Key Storage Provider
			ProviderType = 0
		Flags = 0
			KeySpec = 0 -- XCN_AT_NONE

		CERT_REQUEST_ORIGINATOR_PROP_ID(71):
			localhost

		CERT_FRIENDLY_NAME_PROP_ID(11):
			CustomRoot

		CERT_SHA1_HASH_PROP_ID(3):
			1abb2ad73583007e9de803291960146d94ad9a52

		CERT_SUBJECT_PUBLIC_KEY_MD5_HASH_PROP_ID(25):
			918cb8c487e616a3432db7c210c9022f

		CERT_ACCESS_STATE_PROP_ID(14):
		AccessState = 2
			CERT_ACCESS_STATE_SYSTEM_STORE_FLAG -- 2
	```

	Here, you can see all the certificate extensions, which is crucial.

3.  Correct Certificate Fields & Extensions

	These samples from `certutil` exemplify correct certificates.
	Ensure your certificates feature similar fields and extensions.

4.  All Certificates

	```powershell
	Issuer:
		CN=CustomRoot
		O=CustomOrg
		C=US
	```

5.  Root Certificate Authority

	```powershell
	Subject:
		CN=CustomRoot
		O=CustomOrg
		C=US

	Certificate Extensions: 3
		2.5.29.15: Flags = 1(Critical), Length = 4
		Key Usage
			Certificate Signing, Off-line CRL Signing, CRL Signing (06)

		2.5.29.19: Flags = 1(Critical), Length = 5
		Basic Constraints
			Subject Type=CA
			Path Length Constraint=None

		2.5.29.14: Flags = 0, Length = 16
		Subject Key Identifier
			c2f300d811eba073aeb33a36f882363a3f8ddbf3
	```

6.  Server

	```powershell
	Subject:
		EMPTY (DNS Name=hostname, DNS Name=hostname.suffix, DNS Name=localhost)

	Certificate Extensions: 5
		2.5.29.15: Flags = 1(Critical), Length = 4
		Key Usage
			Digital Signature, Key Encipherment, Key Agreement (a8)

		2.5.29.37: Flags = 0, Length = 16
		Enhanced Key Usage
			Client Authentication (1.3.6.1.5.5.7.3.2)
			Server Authentication (1.3.6.1.5.5.7.3.1)

		2.5.29.17: Flags = 1(Critical), Length = 2a
		Subject Alternative Name
			DNS Name=hostname
			DNS Name=hostname.suffix
			DNS Name=localhost

		2.5.29.35: Flags = 0, Length = 18
		Authority Key Identifier
			KeyID=c2f300d811eba073aeb33a36f882363a3f8ddbf3

		2.5.29.14: Flags = 0, Length = 16
		Subject Key Identifier
			5d0103b188ead67cce4c530655d97167335f8397
	```

7.  Client

	```powershell
	Subject:
		EMPTY (Other Name:Principal Name=username@localhost)

	Certificate Extensions: 5
		2.5.29.15: Flags = 1(Critical), Length = 4
		Key Usage
			Digital Signature, Key Encipherment, Key Agreement (a8)

		2.5.29.37: Flags = 0, Length = 12
		Enhanced Key Usage
			Any Purpose (2.5.29.37.0)
			Client Authentication (1.3.6.1.5.5.7.3.2)

		2.5.29.17: Flags = 1(Critical), Length = 23
		Subject Alternative Name
			Other Name:
				 Principal Name=username@localhost

		2.5.29.35: Flags = 0, Length = 18
		Authority Key Identifier
			KeyID=c2f300d811eba073aeb33a36f882363a3f8ddbf3

		2.5.29.14: Flags = 0, Length = 16
		Subject Key Identifier
			4f8142f5ebfe096b5dbcd5b561f1cb13f3953069
	```

### Storage & Distribution

Your directory should have a collection of certificate files with names derived from those you provided.
Filename suffixes indicate contents.

-   **.cert:** public certificate
-   **.p12:** private key
-   **.p7b:** public certificate bundle

Save the root’s private key somewhere secure and optionally delete it from your store.

```powershell
$rootca | Remove-Item
```

Give each user their private key and a copy of the root public certificate, which they’ll install.
Move the remaining files to a secure network share or portable media for installation:

-   root public certificate
-   server private keys
-   client public certificate bundle
-   certutil.ps1 (optional convenience script)

## Servers

### Certificate Installation

On each server, install it’s private key and the public certificates.
For server *host-i*, run a PowerShell console as an administrator, and do

```powershell
. .\certutil.ps1
$rootca = Import-RootCACertificate -FilePath .\root.cert
$server = Import-ServerCertificate -FilePath .\host-i.p12
Import-ClientCertificate -FilePath .\client.p7b
```

This installs certificates and keys to corresponding locations:

-   **root:** Cert:\LocalMachine\Root
-   **server:** Cert:\LocalMachine\My
-   **clients:** Cert:\LocalMachine\TrustedPeople

### Service Configuration

While you’re there, enable PowerShell Remoting.

```powershell
Enable-RemotingSSL -Certificate $server
```

For each user remotely connecting to this server, bind their username and (local or Microsoft Account) password with the authority that signed their certificate.

```powershell
Set-RemotingSSLUser -Issuer $rootca -User username
```

This command will prompt for their password.
Finally, authorize users to connect.
You may authorize all authenticated users

```powershell
Add-RemotingMember -Member 'NT AUTHORITY\Authenticated Users'
```

Alternatively, pass a more specific list of groups and users to the `-Member` parameter.
Some groups are preassigned access:

```powershell
Get-PSSessionConfiguration
```

## Clients

### Certificate Installation

On their client computer, the user installs the root authority certificate (from an administrator console)

```powershell
. .\certutil.ps1
Import-RootCACertificate -FilePath .\root.cert
```

The user *user-j* installs their private key to a smart card or onto their client computer (from their ordinary console)

```powershell
$client = Import-PfxCertificate -CertStoreLocation Cert:\CurrentUser\My\ -FilePath .\user-j.p12
```

### Usage & Optimization

Remote servers will accept user passwords and client certificates.
To authenticate with certificate, an authorized user connecting to server *host-i* would enter from their client console

```powershell
Enter-PSSession -ComputerName host-i -CertificateThumbprint $client.Thumbprint
```

To authenticate with password, the user enters

```powershell
Enter-PSSession -ComputerName host-i
```

A profile script can automate certificate retrieval and set default parameters.
I add the following to my profile at `$PROFILE.CurrentUserAllHosts`:

```powershell
$ClientCertificate = Get-ChildItem -Path Cert:\CurrentUser\My -Eku 'Client Authentication' `
									 | ? { $_.Verify() -and $_.GetNameInfo([System.Security.Cryptography.X509Certificates.X509NameType]::UpnName, $false) -eq ('{0}@localhost' -f [System.Environment]::UserName) } `
									 | Select-Object -First 1
if ($ClientCertificate) {
	(-split @'
Enter
Connect
New
'@) | % {
		$PSDefaultParameterValues['{0}-PSSession:CertificateThumbprint' -f $_] = $ClientCertificate.Thumbprint
	}
}
```

A user can then run

```powershell
Enter-PSSession -ComputerName host-i
```

without entering a password: their client certificate is implicitly passed.

# Troubleshooting

## Certificates

[Inspect certificates](#inspect-cert) to check

-   certificate fields and extensions
-   certificate store locations

Perform validation checks with `certutil -verifystore`: substituting names as appropriate

```powershell
certutil -verifystore root rootname
certutil -verifystore my hostname
certutil -verifystore trustedpeople username@localhost
```

Though [X509Certificate2.Verify Method](https://docs.microsoft.com/dotnet/api/system.security.cryptography.x509certificates.x509certificate2.verify) exists, it has reported `False` on my server certificates in a working setup, so treat it skeptically.

Finally, check that `Cert:\LocalMachine\Root` has only self-signed certificates: if

```powershell
($certs = Get-ChildItem -Path Cert:\LocalMachine\Root\ | ? { $_.Issuer -ne $_.Subject })
```

turns up any results, then move or delete them.

```powershell
$certs | Move-Item -Destination Cert:\LocalMachine\CA\
```

In the name of backward compatibility, [Windows’ client authentication protocols are convoluted or poorly explained](https://docs.microsoft.com/en-us/windows-server/security/tls/what-s-new-in-tls-ssl-schannel-ssp-overview), and uninformative logs and error messages won’t effectively alert you of issues like this last one.

## Services

### Server

[`Enable-RemotingSSL`](#service-config) configures a number of system areas: service startup, WS-Management, firewall, PowerShell sessions.
WinRM should be running and start automatically.

```powershell
PS C:\> Get-Service -Name WinRM | Format-List -Property Name,StartType,Status

Name      : WinRM
StartType : Automatic
Status    : Running
```

`Get-PSSessionConfiguration` should list these services and permissions.

```powershell
PS C:\> Get-PSSessionConfiguration | Format-List -Property Name,Permission

Name       : microsoft.powershell
Permission : NT AUTHORITY\INTERACTIVE AccessAllowed, BUILTIN\Administrators AccessAllowed, BUILTIN\Remote Management Users AccessAllowed

Name       : microsoft.powershell.workflow
Permission : BUILTIN\Administrators AccessAllowed, BUILTIN\Remote Management Users AccessAllowed

Name       : microsoft.powershell32
Permission : NT AUTHORITY\INTERACTIVE AccessAllowed, BUILTIN\Administrators AccessAllowed, BUILTIN\Remote Management Users AccessAllowed
```

Firewall should permit WinRM connections.

```powershell
PS C:\> Get-NetFirewallRule -DisplayGroup 'Windows Remote Management' | ? { $_.Enabled -eq 'True' } | Format-List -Property Name

Name : WINRM-HTTP-In-TCP-NoScope
Name : WINRM-HTTPS-In-TCP-NoScope
```

The [WSMan Provider](https://docs.microsoft.com/powershell/module/microsoft.wsman.management/provider/wsman-provider) exposes some settings.

```powershell
Get-ChildItem -Recurse -Path WSMan:\localhost\Service\,WSMan:\localhost\Shell\
```

Verify some key values

-   remote access enablement

	```powershell
	   WSManConfig: Microsoft.WSMan.Management\WSMan::localhost\Service

	Type            Name                           SourceOfValue   Value
	----            ----                           -------------   -----
	System.String   AllowRemoteAccess                              true
	```

-   certificate authentication

	```powershell
	   WSManConfig: Microsoft.WSMan.Management\WSMan::localhost\Service\Auth

	Type            Name                           SourceOfValue   Value
	----            ----                           -------------   -----
	System.String   Certificate                                    true
	```

-   remote shell enablement

	```powershell
	   WSManConfig: Microsoft.WSMan.Management\WSMan::localhost\Shell

	Type            Name                           SourceOfValue   Value
	----            ----                           -------------   -----
	System.String   AllowRemoteShellAccess                         true
	```

-   an HTTPS listener exists

	```powershell
	($listener = Get-ChildItem -Path WSMan:\localhost\Listener\ | ? { $_.Keys -contains 'Transport=HTTPS' })
	```

	the output of `$listener | Get-ChildItem` includes these values

	```powershell
	Type            Name                           SourceOfValue   Value
	----            ----                           -------------   -----
	System.String   Address                                        *
	System.String   Transport                                      HTTPS
	System.String   Port                                           5986
	System.String   Hostname
	System.String   Enabled                                        true
	System.String   URLPrefix                                      wsman
	```

	and a nonempty CertificateThumbprint

	```powershell
	System.String   CertificateThumbprint                          B10BF3132772C18EF34B71BEEF969E73CA2FC6E0
	```

	that matches the server’s own web server certificate

	```powershell
	$listener | Get-ChildItem | ? { $_.Name -eq 'CertificateThumbprint' } | % { certutil.exe -store my $_.Value }
	```

-   ClientCertificate entries exist

	```powershell
	($client = Get-ChildItem -Path WSMan:\localhost\ClientCertificate\)
	```

	Items output by `$client | Get-ChildItem` include values like these

	```powershell
	   WSManConfig: Microsoft.WSMan.Management\WSMan::localhost\ClientCertificate\ClientCertificate_1346055972

	Type            Name                           SourceOfValue   Value
	----            ----                           -------------   -----
	System.String   URI                                            *
	System.String   Subject                                        username@localhost
	System.String   Issuer                                         1ABB2AD73583007E9DE803291960146D94AD9A52
	System.String   UserName                                       username
	System.String   Enabled                                        true
	System.String   Password
	```

	where each Issuer matches a certificate that signs our client certificates.

	```powershell
	$client | Get-ChildItem | ? { $_.Name -eq 'Issuer' } | % { certutil.exe -store root $_.Value }
	```

Verify the server’s Remote Management Users security group includes all non-administrators accessing this server remotely.

```powershell
Get-LocalGroupMember -Name 'Remote Management Users'
```

### Client

`Get-ChildItem -Path WSMan:\localhost\Client\Auth\` should show the `Certificate` key set.

```powershell
Type            Name                           SourceOfValue   Value
----            ----                           -------------   -----
System.String   Certificate                                    true
```
