'use strict'
import Prism from 'prismjs'
import 'prismjs/components/prism-powershell'
// customization: identify all cmdlets named with standard verbs from Get-Verb
Prism.languages.powershell.function.unshift(/\b(?:(?:A(?:dd|pprove|ssert)|B(?:ackup|lock)|C(?:heckpoint|l(?:ear|ose)|o(?:mp(?:are|lete|ress)|n(?:firm|nect|vert(?:From|To)?)|py))|D(?:e(?:bug|ny)|is(?:able|(?:connec|moun)t))|E(?:dit|n(?:able|ter)|x(?:it|p(?:and|ort)))|F(?:ind|ormat)|G(?:et|r(?:ant|oup))|Hide|I(?:mport|n(?:itialize|stall|voke))|Join|L(?:imit|ock)|M(?:e(?:(?:asur|rg)e)|o(?:unt|ve))|New|O(?:p(?:en|timize)|ut)|P(?:ing|op|rotect|u(?:(?:bli)?sh))|Re(?:ad|ceive|do|gister|move|name|pair|quest|s(?:et|ize|olve|t(?:art|ore)|ume)|voke)|S(?:ave|e(?:arch|lect|nd|t)|how|kip|plit|t(?:art|[eo]p)|u(?:bmit|spend)|witch|ync)|T(?:est|race)|U(?:n(?:block|do|install|lock|p(?:rotect|ublish)|register)|(?:pdat|s)e)|W(?:a(?:it|tch)|rite))-\w+)\b/i)
