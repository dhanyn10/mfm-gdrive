var rename = document.getElementById('rename')
var substr = document.getElementById('substr')
var padstart = document.getElementById('padstart')

document.getElementById('select-function').addEventListener('change', function () {
    var val = this.value
    if(val == 1)
    {
        rename.style.display = "block"
        substr.style.display = "none"
        padstart.style.display = "none"
    }
    else if(val == 2)
    {
        rename.style.display = "none"
        substr.style.display = "block"
        padstart.style.display = "none"
    }
    else if(val == 3)
    {
        
        rename.style.display = "none"
        substr.style.display = "none"
        padstart.style.display = "block"
    }
    else
    {
        
        rename.style.display =
        substr.style.display =
        padstart.style.display = "none"
    }
})