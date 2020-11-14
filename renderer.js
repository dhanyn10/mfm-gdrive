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
const TOKEN_PATH = 'token.json'

document.getElementById('authorize').addEventListener('click', function (){
    arrparents = []
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err)
            return console.log('Error loading client secret file:', err)
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
                    return console.error('Error retrieving access token', err)
                oAuth2Client.setCredentials(token)
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err)
                        return console.error(err)
                    console.log('Token stored to', TOKEN_PATH)
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
    }, (err, res) => {
        if (err)
            return console.log('The API returned an error: ' + err)
        const files = res.data.files;
        if (files.length) {
            var opthtml = ""
            files.map((file) => {
                opthtml += `<option value='${file.id}'>` + file.name + "</option>"
            })
            document.getElementById('folders').innerHTML = opthtml
        } else {
            console.log('No files found.')
        }
    })
    //shows files and folder
    drive.files.list({
        q: `'root' in parents`,
        spaces: 'drive',
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if(err)
        {
            console.log("error: ",err)
        }
        else
        {
            const files = res.data.files
            if (files.length) {
                var opthtml = ""
                listAllFiles = []
                files.map((file) => {
                    var htmlIndex = ""
                    for(var ao = 0; ao < file.name.length; ao++)
                    {
                        htmlIndex += `<span title='${ao}'>${file.name.substr(ao, 1)}</span>`
                    }
                    opthtml += `<li class='list-group-item'><input type='checkbox' class='gdrive-filenames' value='${file.id}'/> ` + htmlIndex + "</li>"
                    listAllFiles.push({
                        id: file.id,
                        name: file.name,
                        checked: false
                    })
                })
                document.getElementById('gdrive-files').innerHTML = opthtml
            } else {
                console.log('No more folders inside here')
                arrparents.pop()
            }
        }
    })    
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
    }, (err, res) => {
        if (err)
            return console.log('The API returned an error: ' + err)
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
            console.log('No more folders inside here')
            arrparents.pop()
        }
    })

    //shows files and folder
    drive.files.list({
        q: `'${folderID}' in parents`,
        spaces: 'drive',
        fileId: folderID,
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if(err)
        {
            console.log("error: ",err)
        }
        else
        {
            const files = res.data.files
            if (files.length) {
                var opthtml = ""
                listAllFiles = []
                files.map((file) => {
                    var htmlIndex = ""
                    for(var ao = 0; ao < file.name.length; ao++)
                    {
                        htmlIndex += `<span title='${ao}'>${file.name.substr(ao, 1)}</span>`
                    }
                    opthtml += `<li class='list-group-item'><input type='checkbox' class='gdrive-filenames' value='${file.id}'/> ` + htmlIndex + "</li>"
                    listAllFiles.push({
                        id: file.id,
                        name: file.name,
                        checked: false
                    })
                })
                document.getElementById('gdrive-files').innerHTML = opthtml
            } else {
                console.log('folder is empty')
            }
        }
    })
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
                return console.log("error", err)
            else
                return console.log("renamed to: ",res.data.name)
        })
    })
}

document.getElementById('go').addEventListener('click', function(){
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
    var _from = document.getElementById('from').value
    var _to = document.getElementById('to').value
    if(selectfunc == 1)
    {
        for(r = 0; r < listAllFiles.length; r++)
        {
            if(listAllFiles[r].checked == true)
            {
                newfilename = listAllFiles[r].name.replace(_from, _to)
                renameFile(listAllFiles[r].id, newfilename)
            }
        }
    }
    if(selectfunc == 2)
    {
        _from = parseInt(_from)
        _to = parseInt(_to)
        for(r = 0; r < listAllFiles.length; r++)
        {
            if(listAllFiles[r].checked == true)
            {
                var oldname = listAllFiles[r].name
                newfilename = oldname.slice(0,_from) + oldname.slice(_to)
                renameFile(listAllFiles[r].id, newfilename)
            }
        }
    }
})