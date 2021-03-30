const fs = require('fs')
const {google} = require('googleapis')
const shell = require('electron').shell
const bottleneck = require('bottleneck')
const limiter = new bottleneck({minTime: 110})
var drive = null
var oAuth2Client = null
var arrparents = []
var selectcond = false
var filenames
var listAllFiles = []

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './apps/token.json'

function loggerData(datalog)
{
    if(typeof datalog == 'object')
        datalog = JSON.stringify(datalog)
    document.getElementById('console-log').innerHTML += datalog + "<br/>"
}

document.getElementById('authorize').addEventListener('click', function (){
    arrparents = []
    // Load client secrets from a local file.
    fs.readFile('./apps/credentials.json', (err, content) => {
        if (err)
            loggerData(err)
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), listFiles)
    });
})

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err)
            return getAccessToken(oAuth2Client, callback)
        oAuth2Client.setCredentials(JSON.parse(token))
        callback(oAuth2Client)
    });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    shell.openExternal(authUrl)
    document.getElementById('key').style.display = "block"
    document.getElementById('key').addEventListener('keypress', function (e) {
        if(e.keyCode == 13)
        {
            var code = this.value
            oAuth2Client.getToken(code, (err, token) => {
                if (err)
                    loggerData(err)
                oAuth2Client.setCredentials(token)
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err)
                        loggerData(err)
                    loggerData(`Token stored to : ${TOKEN_PATH}`)
                })
                callback(oAuth2Client)
            })
        }
    })
}

function listFiles(auth) {
    drive = google.drive({version: 'v3', auth})
    arrparents.push('root')
    drive.files.list({
        q: "'root' in parents and mimeType='application/vnd.google-apps.folder'",
        spaces: 'drive',
        fields: 'nextPageToken, files(id, name)',
        orderBy: 'name'
    }, (err, res) => {
        if (err)
            loggerData(`The API returned an error : ${err}`)
        const files = res.data.files;
        if (files.length) {
            var opthtml = ""
            files.map((file) => {
                opthtml += `<option value='${file.id}'>` + file.name + "</option>"
            })
            document.getElementById('folders').innerHTML = opthtml
        } else {
            loggerData('No files found')
        }
    })
    //shows files and folder
    drive.files.list({
        q: `'root' in parents`,
        spaces: 'drive',
        fields: 'nextPageToken, files(id, name)',
        orderBy: 'name'
    }, (err, res) => {
        if(err)
        {
            loggerData(`error : ${err}`)
        }
        else
        {
            const files = res.data.files
            if (files.length) {
                OptHtml(files)
            } else {
                loggerData('No more folders inside here')
                arrparents.pop()
            }
        }
    })    
}
function OptHtml (files)
{
    var opthtml = ""
    listAllFiles = []
    var dataIndex = 0
    files.map((file) => {
        var htmlIndex = ""
        for(var ao = 0; ao < file.name.length; ao++)
        {
            htmlIndex += `<span title='${ao}'>${file.name.substr(ao, 1)}</span>`
        }
        opthtml += `<li class='list-group-item'><input type='checkbox' class='gdrive-filenames' value='${dataIndex}'/> ` + htmlIndex + "</li>"
        listAllFiles.push({
            id: file.id,
            name: file.name,
            checked: false
        })
        dataIndex++
    })
    document.getElementById('gdrive-files').innerHTML = opthtml
}
document.getElementById('folders').addEventListener('change', function () {
    folderID = this.value
    var prevfolder
    if(folderID == 'upfolder')
    {
        prevfolder = (arrparents.length)-2
        folderID = arrparents[prevfolder]
        arrparents.pop()
    }
    drive.files.list({
        q: `'${folderID}' in parents and mimeType='application/vnd.google-apps.folder'`,
        spaces: 'drive',
        fileId: folderID,
        fields: 'nextPageToken, files(id, name)',
        orderBy: 'name'
    }, (err, res) => {
        if (err)
            loggerData(`error : ${err}`)
        const files = res.data.files
        var displayupfolder = false
        if(folderID != "root")
        {
            displayupfolder = true
            if(folderID != arrparents[prevfolder])
                arrparents.push(folderID)
        }
        if (files.length) {
            var opthtml = ""
            files.map((file) => {
                if(displayupfolder == true)
                {
                    opthtml = `<option value='upfolder'>...</option>`
                    displayupfolder = false
                }
                opthtml += `<option value='${file.id}'>` + file.name + "</option>"
            })
            document.getElementById('folders').innerHTML = opthtml
        } else {
            loggerData('No more folders inside here')
            arrparents.pop()
        }
    })

    //shows files and folder
    drive.files.list({
        q: `'${folderID}' in parents`,
        spaces: 'drive',
        fileId: folderID,
        fields: 'nextPageToken, files(id, name)',
        orderBy: 'name'
    }, (err, res) => {
        if(err)
        {
            loggerData(`error : ${err}`)
        }
        else
        {
            const files = res.data.files
            if (files.length) {
                OptHtml(files)
            } else {
                loggerData('folder is empty')
            }
        }
    })
})

//feature: select multiple with shiftkey + click, like gmail
var fromIndex = null
var toIndex = null
document.getElementById('gdrive-files').addEventListener('click', (evt) => {
    var checkboxes = document.querySelectorAll('.gdrive-filenames')
    for(k = 0; k < checkboxes.length; k++)
    {
        if(checkboxes[k].checked && evt.shiftKey == false)
            fromIndex = k
            
        checkboxes[k].addEventListener('keydown', function(e) {
            if(e.shiftKey)
            {
                toIndex = this.value
                
            var low = fromIndex
            var high = toIndex
            if(low > high)
            {
                low = toIndex
                high = fromIndex
            }
            for(idx = low; idx <= high; idx++)
                checkboxes[idx].checked = true
            }
        })
    }
})
document.getElementById('select-all').addEventListener('click', function() {
    filenames = document.getElementsByClassName('gdrive-filenames')
    if(selectcond == false)
    {
        for(fl = 0; fl < filenames.length; fl++)
        {
            filenames[fl].checked = true
        }
        this.innerHTML = "Select None"
        selectcond = true
    }
    else
    {
        for(fl = 0; fl < filenames.length; fl++)
        {
            filenames[fl].checked = false
        }
        this.innerHTML = "Select All"
        selectcond = false
    }
})

function renameFile(fileId, newTitle) {
    var body = {'name': newTitle}
    limiter.schedule(() => {
        drive.files.update({
            'fileId': fileId,
            'resource': body
        }, (err, res) => {
            if(err)
                loggerData(`error : ${err}`)
            else
            loggerData(`renamed : ${res.data.name}`)
        })
    })
}

document.getElementById('go').addEventListener('click', function(){
    document.getElementById('console-log').innerHTML = ""
    var selectfunc = document.getElementById('select-function').value
    filenames = document.getElementsByClassName('gdrive-filenames')
    for(fl = 0; fl < filenames.length; fl++)
    {
        if(filenames[fl].checked == true)
        {
            listAllFiles[fl].checked = true
        }
        else
        {
            listAllFiles[fl].checked = false
        }
    }
    if(selectfunc == 1)
    {
        var renameFrom = document.getElementById('rename-from').value
        var renameTo = document.getElementById('rename-to').value
        for(r = 0; r < listAllFiles.length; r++)
        {
            if(listAllFiles[r].checked == true)
            {
                newfilename = listAllFiles[r].name.replace(renameFrom, renameTo)
                renameFile(listAllFiles[r].id, newfilename)
            }
        }
    }
    if(selectfunc == 2)
    {
        var indexFrom = document.getElementById('index-from').value
        var indexTo = document.getElementById('index-to').value
        indexFrom = parseInt(indexFrom)
        indexTo = parseInt(indexTo)
        indexTo =  indexTo + 1
        for(r = 0; r < listAllFiles.length; r++)
        {
            if(listAllFiles[r].checked == true)
            {
                var oldname = listAllFiles[r].name
                var todelete = oldname.slice(indexFrom, indexTo)
                newfilename = oldname.replace(todelete, "")
                renameFile(listAllFiles[r].id, newfilename)
            }
        }
    }
    if(selectfunc == 3)
    {
        var psFrom = document.getElementById('ps-from').value
        var psTo = document.getElementById('ps-to').value
        var psWith = document.getElementById('ps-with').value
        var psLength = document.getElementById('ps-length').value
        psFrom = parseInt(psFrom)
        psTo = parseInt(psTo)
        psTo = psTo + 1
        psLength = parseInt(psLength)
        for(r = 0; r < listAllFiles.length; r++)
        {
            if(listAllFiles[r].checked == true)
            {
                var oldname = listAllFiles[r].name
                var tmp = oldname.slice(psFrom, psTo)
                var tmpnum = ""
                for(var num = 0; num < tmp.length; num++)
                {
                    var c = tmp.charAt(num)
                    if(parseInt(c) >= 0 && parseInt(c) <= 9)
                        tmpnum += c
                }
                tmp = tmpnum.toString()
                var maskednumber = tmp.padStart(psLength, psWith)
                var newfilename = oldname.replace(tmp, maskednumber)
                renameFile(listAllFiles[r].id, newfilename)
            }
        }
    }
})