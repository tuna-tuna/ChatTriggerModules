/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import PogObject from "PogData";

const File = Java.type("java.io.File");

// pogdata things
let data = new PogObject("RareCropTracker", {
    X: 10,
    Y: 10,
    Cropie: 0,
    Squash: 0,
    Fermento: 0,
    enabled: true
}, "playerData.json");

const fileExists = (loc) => {
    const file = new File(loc);
    return file.exists();
}

if (!fileExists("./config/ChatTriggers/modules/RareCropTracker/playerData.json")) {
    data.save();
}

// global vars
const cropie_image = new Image('rct-cropie.png', 'https://wiki.hypixel.net/images/9/93/SkyBlock_items_cropie.png');
const squash_image = new Image('rct-squash.png', 'https://wiki.hypixel.net/images/9/91/SkyBlock_items_squash.png');
const fermento_image = new Image('rct-fermento.png', 'https://wiki.hypixel.net/images/5/5d/SkyBlock_items_fermento.png');

const cropie_text = new Text(`Cropie: ${data?.Cropie}`).setColor(Renderer.BLUE);
const squash_text = new Text(`Squash: ${data?.Squash}`).setColor(Renderer.DARK_PURPLE);
const fermento_text = new Text(`Fermento: ${data?.Fermento}`).setColor(Renderer.GOLD);

const background_rect = new Rectangle(Renderer.color(75, 75, 75, 170), 10, 10, 10, 10);

const gui = new Gui();
const gui_string = 'Drag to move RareCropTracker';
const gui_text = new Text(gui_string, Renderer.screen.getWidth() / 2 - Renderer.getStringWidth(gui_string) * 2, Renderer.screen.getHeight() / 2 - 50).setColor(Renderer.color(255, 55, 55)).setScale(4);

register('chat', (crop) => {
    incrementCropCount(crop);
}).setCriteria('RARE CROP! ${crop} (Armor Set Bonus)');

const incrementCropCount = (crop) => {
    if (crop === 'Cropie') {
        const current_amount = data.Cropie;
        data.Cropie = current_amount + 1;
    } else if (crop === 'Squash') {
        const current_amount = data.Squash;
        data.Squash = current_amount + 1;
    } else if (crop === 'Fermento') {
        const current_amount = data.Fermento;
        data.Fermento = current_amount + 1;
    } else {
        ChatLib.chat('§cError while incrementing the amount of crops!');
    }
    data.save();
    return;
}

register('renderOverlay', () => {
    const [render_x, render_y] = getRenderCoords();
    background_rect.setX(render_x - 5).setY(render_y - 5).setWidth(85).setHeight(50).draw();
    cropie_image.draw(render_x, render_y, 10, 10);
    squash_image.draw(render_x, render_y + 15, 10, 10);
    fermento_image.draw(render_x, render_y + 30, 10, 10);
    cropie_text.setString(`Cropie: ${data?.Cropie}`).setX(render_x + 15).setY(render_y + 2).draw();
    squash_text.setString(`Squash: ${data?.Squash}`).setX(render_x + 15).setY(render_y + 17).draw();
    fermento_text.setString(`Fermento: ${data?.Fermento}`).setX(render_x + 15).setY(render_y + 32).draw();
});

const getRenderCoords = () => {
    const x = data.X;
    const y = data.Y;
    return [x, y];
}

const setRenderCoords = (x, y) => {
    data.X = x;
    data.Y = y;
    data.save();
    return;
}

// move gui ref: https://github.com/vSparkyy/KuudraCounter/blob/main/index.js
register('command', () => {
    gui.open();
}).setCommandName('rctmove');

register('command', () => {
    data.enabled = !data.enabled;
    if (data.enabled) {
        ChatLib.chat('RareCropTracker Enabled!');
    } else {
        ChatLib.chat('RareCropTracker Disabled!');
    }
    data.save();
}).setCommandName('rcttoggle');

gui.registerDraw(() => {
    gui_text.draw();
});

register('dragged', (dx, dy) => {
    if (!gui.isOpen()) {
        return;
    }

    const [current_x, current_y] = getRenderCoords();
    setRenderCoords(current_x + dx, current_y + dy);
});