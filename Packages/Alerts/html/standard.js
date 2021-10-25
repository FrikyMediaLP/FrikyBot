const FONTS_LIST = ['Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier', 'Courier New', 'Palatino', 'Garamond', 'Bookman', 'Avant Garde', 'Verdana', 'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact', 'Roboto'];
const TRIGGER_EFFECTS = ['Fade', 'Move', 'Move Inv'];

let ALERT_FILE_END_INDICATOR = 0;

async function text2speech(text, volume = 1, pitch = 1, voice) {
    let msg = new SpeechSynthesisUtterance();
    
    msg.text = text;
    msg.volume = volume;
    msg.pitch = pitch;
    if (voice) msg.voice = voice;
    if (voice) msg.lang = voice.lang;
    
    window.speechSynthesis.speak(msg);

    return new Promise((resolve, reject) => {
        msg.onend = (e) => resolve();
    });
}

//Alert
function createAlertHTML(type, cfg, id, onEnd) {
    let sources = 1;
    if (cfg.layout !== 6 && SUPPORTED_VIDEO_FILES.find(elt => elt === (cfg.image || '').split('.').pop())) sources++;
    if (cfg.sound) sources++;
    if (cfg.tts) sources++;

    //Create CSS
    let style = '';
    style += " font-size: " + cfg.size + "px;";
    style += " font-family: '" + cfg.font + "';";
    style += " color: " + cfg.color + ";";
    
    //Create Elements
    let s = '<div class="ALERT" id="ALERT_' + id + '" style="' + style + '" data-layout="' + cfg.layout + '" data-effect="' + cfg.effect + '">';
    s += '<div class="ALERT_GRID">';
    if(cfg.layout !== 5) s += '<text>' + cfg.message + '</text>';

    if (cfg.sound) {
        s += '<audio id="ALERT_AUDIO_' + id + '" onended="Standard_OnSoundEnd(' + "'" + id + "'" + ', ' + "'audio'" + ', ' + sources + ', ' + onEnd.name + ')">';
        s += '<source src="/Alerts/custom/' + cfg.sound + '" type="audio/' + cfg.sound.split('.').pop() + '">';
        s += '</audio>';
    }

    if (cfg.tts) {
        text2speech(cfg.tts, cfg.tts_volume, cfg.tts_pitch, cfg.tts_voice)
            .then(() => Standard_OnSoundEnd(id, 'tts', sources, onEnd))
            .catch(err => Alert_hide(document.getElementById('ALERT_' + id)));
    }

    if (cfg.image && cfg.layout !== 6) {
        if (SUPPORTED_VIDEO_FILES.find(elt => elt === cfg.image.split('.').pop())) {
            s += '<video id="ALERT_VIDEO_' + id + '" ' + (cfg.sound ? 'muted' : '') + ' onended="Standard_OnSoundEnd(' + "'" + id + "'" + ', ' + "'video'" + ', ' + sources + ', ' + onEnd.name + ')">';
            s += '<source src="/Alerts/custom/' + cfg.image + '" type="video/' + cfg.image.split('.').pop() + '">';
            s += '</video>';
        }
        else s += '<img src="/Alerts/custom/' + cfg.image + '" />';
    }

    s += '</div>';
    if (cfg.css) s += '<style>' + cfg.css + '</style>';
    s += '</div>';
    return s;
}
function triggerAlert(id, cfg, onEnd) {
    let sources = 1;
    if (cfg.layout !== 6 && SUPPORTED_VIDEO_FILES.find(elt => elt === (cfg.image || '').split('.').pop())) sources++;
    if (cfg.sound) sources++;
    if (cfg.tts) sources++;

    //Delay
    setTimeout(() => {
        //Trigger Entry Effect
        Alert_show(document.getElementById('ALERT_' + id));

        //On Time
        setTimeout(() => {
            Standard_OnSoundEnd(id, 'on_time', sources, onEnd);
        }, cfg.on_time * 1000);

        //Trigger Sounds / Vids
        for (let child of document.getElementById('ALERT_' + id).childNodes[0].childNodes) {
            if (child instanceof Element && (child.tagName === 'VIDEO' || child.tagName === 'AUDIO')) {
                child.volume = cfg.file_volume / 100;
                child.play();
            }
        }
    }, cfg.delay * 1000);
}
function Standard_OnSoundEnd(id, method, sources = 0, callback) {
    ALERT_FILE_END_INDICATOR++;

    if (ALERT_FILE_END_INDICATOR < sources) return;

    Alert_hide(document.getElementById('ALERT_' + id));
    ALERT_FILE_END_INDICATOR = 0;
    if(callback instanceof Function) setTimeout(() => callback(id), 1000);
}

function Alert_show(elt) {
    elt.classList.remove("hide");
    elt.classList.add("show");
}
function Alert_hide(elt) {
    elt.classList.remove("show");
    elt.classList.add("hide");
}