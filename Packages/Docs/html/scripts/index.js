async function init() {
    OUTPUT_create();
    
    //GET DOCS DATA
    let DOCS_DATA = null;
    try {
        if (window.location.pathname.split('/').length == 2) {
            DOCS_DATA = await fetchNav();
        } else {
            DOCS_DATA = await fetchDocsData();
        }
    } catch (err) {
        console.log(err);
        OUTPUT_showError(err.message);
    }
    
    //Docs Navigation
    changeDocsURLHeader();
    changeTitle();
    setDocsNavigation(await fetchNav());

    //Docs Mode
    let Docs_Page = "";
    switch (window.location.pathname.split('/').length) {
        case 2:
            //Main
            try {
                Docs_Page = await createOverviewPage(DOCS_DATA);
            } catch (err) {
                console.log(err);
                OUTPUT_showError(err.message);
            }
            break;
        case 3:
            //Module
            if (HasURLParam("ext")) {
                //EXTENDED
                try {
                    Docs_Page = await createModuleExpanded(DOCS_DATA);
                } catch (err) {
                    console.log(err);
                    OUTPUT_showError(err.message);
                }
            } else {
                //OVERVIEW
                try {
                    Docs_Page = await createModuleOverview(DOCS_DATA);
                } catch (err) {
                    console.log(err);
                    OUTPUT_showError(err.message);
                }
            }
            break;
        case 4:
            //Class
            try {
                Docs_Page = await createClass(DOCS_DATA);
            } catch (err) {
                console.log(err);
                OUTPUT_showError(err.message);
            }
            break;
        default:
            //Error
            window.location.href = "asdasd";
            break;
    }
    
    if(Docs_Page)
        document.getElementById("DOCS_DATA").innerHTML = Docs_Page;

    //General Opti
    checkAllTables();

    //Move to selected
    if (HasURLParam("ext") && document.getElementById(GetURLParamContent('ext')))
        document.getElementById(GetURLParamContent('ext')).scrollIntoView();
}