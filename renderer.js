const fs = require('fs');
const {google} = require('googleapis');
const { file } = require('googleapis/build/src/apis/file');
const shell = require('electron').shell
var drive = null
var oAuth2Client = null
var arrparents = []

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

document.getElementById('authorize').addEventListener('click', function (){
    arrparents = []
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), listFiles);
    });
})

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    shell.openExternal(authUrl)
    document.getElementById('key').addEventListener('keypress', function (e) {
        if(e.keyCode == 13)
        {
            var code = this.value
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log('Token stored to', TOKEN_PATH);
                });
                callback(oAuth2Client);
            });
        }
    })
}

function listFiles(auth) {
    drive = google.drive({version: 'v3', auth});
    arrparents.push('root')
    drive.files.list({
        q: "'root' in parents and mimeType='application/vnd.google-apps.folder'",
        spaces: 'drive',
        fields: 'nextPageToken, files(id, name)',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        if (files.length) {
            document.getElementById('result').innerHTML = ""
            files.map((file) => {
                document.getElementById('result').innerHTML += `<option value='${file.id}'>` + file.name + "</option>"
            });
        } else {
            console.log('No files found.');
        }
    });
}
document.getElementById('result').addEventListener('change', function () {
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
        if (err) return console.log('The API returned an error: ' + err);
        const files = res.data.files;
        var displayupfolder = false
        if(folderID != "root")
        {
            displayupfolder = true
            if(folderID != arrparents[prevfolder])
                arrparents.push(folderID)
        }
        if (files.length) {
            document.getElementById('result').innerHTML = ""
            files.map((file) => {
                if(displayupfolder == true)
                {
                    document.getElementById('result').innerHTML = `<option value='upfolder'>...</option>`
                    displayupfolder = false
                }
                document.getElementById('result').innerHTML += `<option value='${file.id}'>` + file.name + "</option>"
            });
        } else {
            console.log('No more folders inside here');
            arrparents.pop()
        }
    });
})
