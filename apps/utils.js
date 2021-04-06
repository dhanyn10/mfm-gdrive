var rename = document.getElementById('rename')
var index = document.getElementById('index')
var padstart = document.getElementById('padstart')

function featDisplay(rn, ix, ps)
{
    rename.style.display = rn
    index.style.display = ix
    padstart.style.display = ps
}

document.getElementById('select-function').addEventListener('change', function () {
    var val = this.value
    if(val == 1)
    {
        featDisplay("block", "none", "none")
    }
    else if(val == 2)
    {
        featDisplay("none", "block", "none")
    }
    else if(val == 3)
    {
        featDisplay("none", "none", "block")
    }
    else
    {
        featDisplay("none", "none", "none")
    }
})