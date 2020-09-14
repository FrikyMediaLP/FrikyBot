/* -------------------------------------
 *          NEEDED HTML CODE
 * -------------------------------------
 *
 *  NONE, just call ICON_SELECTION_create() and 
 *  place the html string in another Element on the page
 * 
 * -------------------------------------
 *          JAVASCRIPT NOTES
 * -------------------------------------
 *  options = [ { value: "", src: "", title: "" }, { value: "", src: "", title: "" }, ... ]
 *  defaultOption = { value: "", src: "", title: "" }
 */

function ICON_SELECTION_create(options, defaultOption, id, onChange) {
    return '<div class="SELECTION" ' + (id != null ? 'id="' + id + '"': "") + '>' + ICON_SELECTION_fill(options, defaultOption, id, onChange) + '</div>';
}
function ICON_SELECTION_fill(options, defaultOption, id, onChange){
    let s = '<img class="SELECTION_OPTION SELECTION_SELECTOR"';
    s += (id != null ? 'id="SELECTION_SELECTOR_' + id + '"' : "") + ' data-selectorvalue="' + (defaultOption ? defaultOption.value : options[0].value) + '"';
    s += ' title= "' + (defaultOption ? defaultOption.title : options[0].title) + '"';
    s += ' src= "' + (defaultOption ? defaultOption.src : options[0].src) + '"';
    s += ' onclick="ICON_SELECTION_showToggle(event, this);"';
    s += '/> ';
    s += ICON_SELECTION_fillSelection(options, defaultOption.value, onChange);

    return s;
}
function ICON_SELECTION_showToggle(event, elt) {
    if (event.altKey || event.ctrlKey || event.shiftKey || event.shiftKey) {
        return;
    }

    elt.parentElement.dataset.expanded = (elt.parentElement.dataset.expanded == 'false' || elt.parentElement.dataset.expanded == undefined);
    elt.dataset.selected = elt.parentElement.dataset.expanded;
}
function ICON_SELECTION_fillSelection(options = [], selectedValue, onChange) {
    let s = '<div class="SELECTION_SELECTON">';

    for (let option of options) {
        s += '<img class="SELECTION_OPTION" data-optionvalue="' + option.value + '" ' + (selectedValue == option.value ? 'data-selected="true"' : "") + ' src="' + option.src + '" title="' + option.title + '" onclick="ICON_SELECTION_Select(this); ' + (onChange ? onChange + "(this);" : "") + '"/>';
    }

    s += '</div>';

    return s;
}
function ICON_SELECTION_Select(option) {
    let selector = option.parentElement.parentElement.childNodes[0];
    
    for (let other of option.parentElement.childNodes) {
        if (other.dataset.selected == "true") {
            other.dataset.selected = "false";
            break;
        }
    }

    selector.dataset.selectorvalue = option.dataset.optionvalue;
    selector.title = option.title;
    selector.src = option.src;

    option.dataset.selected = "true";
    selector.dataset.selected = "false";

    option.parentElement.parentElement.dataset.expanded = "false";
}