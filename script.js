function escapeRegExp(string){
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}


function chars2cps ( chars ) { 
	// this is needed because of javascript's handling of supplementary characters
	// char: a string of unicode characters
	// returns an array of decimal code point values
	var haut = 0
	var out = []
	for (var i = 0; i < chars.length; i++) {
		var b = chars.charCodeAt(i)
		if (b < 0 || b > 0xFFFF) {
			alert( 'Error in chars2cps: byte out of range ' + b.toString(16) + '!' )
			}
		if (haut != 0) {
			if (0xDC00 <= b && b <= 0xDFFF) {
				out.push(0x10000 + ((haut - 0xD800) << 10) + (b - 0xDC00))
				haut = 0
				continue
				}
			else {
				alert( 'Error in chars2cps: surrogate out of range ' + haut.toString(16) + '!' )
				haut = 0
				}
			}
		if (0xD800 <= b && b <= 0xDBFF) {
			haut = b
			}
		else {
			out.push( b )
			}
		}
	return out
	}


function gatherAll () {
	// get all the characters shown and put in th element so they can be picked up
	
	var all = ''
	var tds = document.querySelectorAll('.chars')
	for (let i=0;i<tds.length;i++)  all += tds[i].textContent
	//document.getElementById('gatheringPlace').textContent = all
    return all
	}

function getAll () { 
	// copies characters to clipboard when you click on the stats
	var all = ''
	var tds = document.querySelectorAll('.chars')
	for (let i=0;i<tds.length;i++)  all += tds[i].textContent
	document.getElementById('preCopy').value = all
		
	document.getElementById('preCopy').focus()
	document.getElementById('preCopy').select()
	document.execCommand('copy')
	}




function makeList (stream) {
	stream = stream.replace(/ /g,'')
	stream = stream.replace(/\x0A/g,'')
	var cps = chars2cps(stream)
	
	// make a scriptGroups object that contains one entry per script detected
	// each entry is an object named after the script group, eg. "Supplemental Punctuation"
	// which has 2 subentries: .all and .unique, lists of characters found
	var scriptGroups = {}
	for (var i=0;i<cps.length;i++) {
		var scriptGroup = findScriptGroup(cps[i])
		if (scriptGroups[scriptGroup] == null) {
			scriptGroups[scriptGroup] = {}
			scriptGroups[scriptGroup].all = String.fromCodePoint(cps[i])
			scriptGroups[scriptGroup].unique = String.fromCodePoint(cps[i])
			}
		else {
			var char = String.fromCodePoint(cps[i])
			scriptGroups[scriptGroup].all += char
			var re = new RegExp(escapeRegExp(char));
			if (! scriptGroups[scriptGroup].unique.match(re)) scriptGroups[scriptGroup].unique += char
			}
		}

	// output the list 
	var out = '<table>\n'
	var keys = Object.keys(scriptGroups)
	keys.sort()

	// check whether a unique column is needed
	var uniqueNeeded = false
	for (var x=0;x<keys.length;x++) {
		if (scriptGroups[keys[x]].all.length != scriptGroups[keys[x]].unique.length) {
			uniqueNeeded = true
			break
			}
		}
	
    out += '<tbody>\n'
	
	// construct a table
	var uniqueTotal = 0
	for (x=0;x<keys.length;x++) {
		out += '<tr>'
		out += '<th class="sg">'+keys[x]+'</th>'
		var count = [...scriptGroups[keys[x]].unique].length
		uniqueTotal += count
		out += '<td class="count">'+count+'</td>'
		if (uniqueNeeded && scriptGroups[keys[x]].unique.length != scriptGroups[keys[x]].all.length){
			count = [...scriptGroups[keys[x]].all].length
			out += '<td class="count">'+count+'</td>'
			}
		else if (uniqueNeeded) out += '<td class="count"></td>'
		let uniqueArray = [...scriptGroups[keys[x]].unique]
		//uniquelist = uniqueArray.sort().join('')
		//out += '<td class="chars">'+uniquelist+'</td>'
        uniquelist = uniqueArray.sort()
		out += '<td class="chars">'
        for (i=0;i<uniquelist.length;i++) out += '<bdi>'+uniquelist[i]+'</bdi>'
		out += '</td>'
		out += '<td class="select" title="Copy to clipboard" onclick="copyToClipboard(this.previousSibling)"><img src="copy.png" alt="Copy to clipboard" title="Copy to clipboard">'
        out += ' <a title="Show a list with details." href="../../../app-analysestring/?chars='+encodeURI(scriptGroups[keys[x]].unique)+'" target="_blank"><img src="share.png"></a></td>'
        //out += ' <a title="Show a list with details." href="../../../app-analysestring/?chars='+encodeURI(scriptGroups[keys[x]])+'" target="_blank"><img src="share.png"></a></td>'
		out += '</tr>\n'
		}
	out += '</tbody></table>'
	
	out += '<p class="total">Total characters: '+cps.length+"</p>"
	out += '<p class="total">Total unique characters: '+uniqueTotal+'<img title="Copy ALL to clipboard" onclick="getAll()" alt="Copy to clipboard" style="margin-left:3em; width: 18px;" src="copy.png">'+"</p>"
	out += '<p class="total">Total blocks: '+keys.length+"</p>"
	
	document.getElementById('out').innerHTML = out
	}


function copyToClipboard (node) {
	//var oldContent = node.textContent
	//node.textContent=node.textContent.replace(/\u200B/g,'')
	node.contentEditable=true
	node.focus()
	document.execCommand('selectAll')
	document.execCommand('copy')
	node.contentEditable=false
	//node.textContent=oldContent
	}



function compareLists () {
    var left = document.getElementById('leftList').value
    var right = document.getElementById('rightList').value
    
    var leftArray = [...left]
    var rightArray = [...right]
    
    var leftResult = ''
    var rightResult = ''
    var bothResult = ''
    
    for (let i=0;i<leftArray.length;i++) {
        var found = false
        for (let j=0;j<rightArray.length;j++) {
            if (leftArray[i] === rightArray[j]) { 
				found = true
				if (! bothResult.includes(leftArray[i])) bothResult += leftArray[i]
				break
				}
            }
        if (! found && ! leftResult.includes(leftArray[i])) leftResult += leftArray[i]+' '
        }
    document.getElementById('leftOut').textContent = leftResult
    document.getElementById('leftOutLink').href = "../app-analysestring/?chars="+leftResult

    for (let i=0;i<rightArray.length;i++) {
        var found = false
        for (let j=0;j<leftArray.length;j++) {
            if (rightArray[i] === leftArray[j]) { found = true; break }
            }
        if (! found && ! rightResult.includes(rightArray[i])) rightResult += rightArray[i]+' '
        }
    document.getElementById('rightOut').textContent = rightResult
    document.getElementById('rightOutLink').href = "../app-analysestring/?chars="+rightResult
	
	var bothArray = [...bothResult]
	bothArray = bothArray.filter((x, i, a) => a.indexOf(x) == i)
    document.getElementById('bothOut').textContent = bothArray.join(' ')
    document.getElementById('bothOutLink').href = "../app-analysestring/?chars="+bothResult

    }






