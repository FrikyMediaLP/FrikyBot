/* ///////////////////////////////////////////////////////////
 *                    HTML REQUIREMENTS
 * ///////////////////////////////////////////////////////////
 *
 *      <div id="OUTPUT"></div>
 *      
 *  - or auto init by calling OUTPUT_create() to fill in css
 *      <div id="OUTPUT" onload="OUTPUT_create()"></div>
 * 
 * //////////////////////////////////////////////////////////
 *                          USAGE
 * //////////////////////////////////////////////////////////
 * 
 * Place HTML in the desired spot. Call the function showError(text)
 * the given text will be displayed. Click on the X to hide the Error or
 * call the function hideError().
 * 
 */

function OUTPUT_create(elt) {
    let elts = document.getElementsByTagName("OUTPUT");
    if (elt) elts = [elts];

    for (let target of elts) {
        if (target.innerHTML !== "") continue;
        target.innerHTML = '<div onclick="OUTPUT_hideError(this.parentElement)">x</div><center></center>';
    }
}
function OUTPUT_hideError(elt) {
    OUTPUT_hide(elt);
}
function OUTPUT_hide(elt) {
    if (!elt) elt = document.getElementsByTagName("OUTPUT")[0];
    if (!elt) return;
    elt.setAttribute('show', 'hidden');
}
function OUTPUT_showInfo(text, elt) {
    if (!elt) elt = document.getElementsByTagName("OUTPUT")[0];
    if (!elt) return;

    elt.dataset.type = "INFO";

    if (elt.childNodes.length == 4) {
        elt.childNodes[3].innerHTML = text;
    }

    if (elt.childNodes.length == 2) {
        elt.childNodes[1].innerHTML = text;
    }

    elt.setAttribute('show', 'visible');
}
function OUTPUT_showWarning(text, elt) {
    if (!elt) elt = document.getElementsByTagName("OUTPUT")[0];
    if (!elt) return;

    elt.dataset.type = "WARN";

    if (elt.childNodes.length == 4) {
        elt.childNodes[3].innerHTML = text;
    }

    if (elt.childNodes.length == 2) {
        elt.childNodes[1].innerHTML = text;
    }

    elt.setAttribute('show', 'visible');
}
function OUTPUT_showError(text, elt) {
    if (!elt) elt = document.getElementsByTagName("OUTPUT")[0];
    if (!elt) return;
    
    elt.dataset.type = "ERROR";

    if (elt.childNodes.length == 4) {
        elt.childNodes[3].innerHTML = text;
    }

    if (elt.childNodes.length == 2) {
        elt.childNodes[1].innerHTML = text;
    }

    elt.setAttribute('show', 'visible');
}