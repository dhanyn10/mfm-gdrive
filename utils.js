var rename = document.getElementById('rename')
var index = document.getElementById('index')
var padstart = document.getElementById('padstart')

document.getElementById('select-function').addEventListener('change', function () {
    var val = this.value
    if(val == 1)
    {
        rename.style.display = "block"
        index.style.display = "none"
        padstart.style.display = "none"
    }
    else if(val == 2)
    {
        rename.style.display = "none"
        index.style.display = "block"
        padstart.style.display = "none"
    }
    else if(val == 3)
    {
        
        rename.style.display = "none"
        index.style.display = "none"
        padstart.style.display = "block"
    }
    else
    {
        
        rename.style.display =
        index.style.display =
        padstart.style.display = "none"
    }
})