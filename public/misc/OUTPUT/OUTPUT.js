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

function OUTPUT_hideError() {
    if (!document.getElementById("OUTPUT")) return;

    document.getElementById("OUTPUT").hidden = true;
}
function OUTPUT_create() {
    if (!document.getElementById("OUTPUT")) return;
    OUTPUT_hideError();
    document.getElementById("OUTPUT").className = "OUTPUT";
    document.getElementById("OUTPUT").innerHTML = '<div onclick="OUTPUT_hideError()">x</div><center></center>';
}
function OUTPUT_showInfo(text) {
    if (!document.getElementById("OUTPUT")) return;

    document.getElementById("OUTPUT").className = "OUTPUT INFO_OUTPUT";

    if (document.getElementById("OUTPUT").childNodes.length == 4) {
        document.getElementById("OUTPUT").childNodes[2].innerHTML = text;
    }

    if (document.getElementById("OUTPUT").childNodes.length == 2) {
        document.getElementById("OUTPUT").childNodes[1].innerHTML = text;
    }

    document.getElementById("OUTPUT").hidden = false;
}
function OUTPUT_showWarning(text) {
    if (!document.getElementById("OUTPUT")) return;

    document.getElementById("OUTPUT").className = "OUTPUT WARN_OUTPUT";

    if (document.getElementById("OUTPUT").childNodes.length == 4) {
        document.getElementById("OUTPUT").childNodes[2].innerHTML = text;
    }

    if (document.getElementById("OUTPUT").childNodes.length == 2) {
        document.getElementById("OUTPUT").childNodes[1].innerHTML = text;
    }

    document.getElementById("OUTPUT").hidden = false;
}
function OUTPUT_showError(text) {
    if (!document.getElementById("OUTPUT")) return;

    document.getElementById("OUTPUT").className = "OUTPUT ERROR_OUTPUT";

    if (document.getElementById("OUTPUT").childNodes.length == 4) {
        document.getElementById("OUTPUT").childNodes[3].innerHTML = text;
    }

    if (document.getElementById("OUTPUT").childNodes.length == 2) {
        document.getElementById("OUTPUT").childNodes[1].innerHTML = text;
    }

    document.getElementById("OUTPUT").hidden = false;
}