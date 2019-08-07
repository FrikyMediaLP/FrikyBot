function buttons(x) {
    switch (parseInt(x.id.substring(6))) {
        case 1: window.location.href = "Bot.html";
            break;
        case 2: window.location.href = "commands.html";
            break;
        case 3: window.location.href = "stats.html";
            break;
        case 4: window.location.href = "TBD.html";
            break;
        case 5: window.location.href = "options.html";
            break;
        case 6: window.location.href = "stop.html";
            break;
        default:
            console.log(x.id);
            break;
    }
}