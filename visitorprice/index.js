/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import { request } from "axios";
import PogObject from "PogData";

import { Visitors } from './constants';

const File = Java.type("java.io.File");

// global vars
let guiOpened = false;
let connected = false;
const visitor_item_re = /\s([a-zA-Z0-9\s]+)\sx([0-9]+)/;
const copper_re = /\s\+([0-9]+)\sCopper/;
let item_data;

const display = new Display();
display.setRenderLoc(600, 160);
display.setRegisterType('post gui render');
display.setBackground(DisplayHandler.Background.FULL);

// api key things
let data = new PogObject("visitorprice", {
    api_key: null
}, "playerData.json");

const fileExists = (loc) => {
    const file = new File(loc);
    return file.exists();
}

if (!fileExists("./config/ChatTriggers/modules/visitorprice/playerData.json")) {
    data.save();
}

// get constant item data
register('gameLoad', () => {
    request({
        url: `https://api.hypixel.net/resources/skyblock/items?api=${data.api_key}`,
        method: 'GET',
        headers: {
            "User-Agent": "Mozilla/5.0 (ChatTriggers)",
            "Content-Type": "application/json"
        }
    }).then(res => {
        item_data = res.data;
        ChatLib.chat('Successfully fetched item list.');
        connected = true;
    });
});

register('serverConnect', () => {
    connected = true;
});

register('serverDisconnect', () => {
    connected = false;
})

register("command", (key) => {
    if (!key) {
        ChatLib.chat("§cCannot find API KEY!");
        return;
    }
    data.api_key = key;
    data.save();
    ChatLib.chat("§aAPI KEY Set!");
}).setCommandName("vpsetkey");

register('postGuiRender', () => {
    const inventory = Player.getContainer();
    if (!guiOpened && connected && checkVisitorName(inventory?.getName())) {
        guiOpened = true;
        let guiLoaded = register('tick', () => {
            if (inventory.getStackInSlot(inventory.getSize() - 37) == null) return;
            guiLoaded.unregister();
            const item_list = [];
            let copper = 1;
            inventory.getItems().map((item) => {
                if (item !== null && item.getName().includes('Accept Offer')) {
                    const lores = item.getLore();
                    let end_line = 0;
                    lores.map((lore, index) => {
                        if (lore.removeFormatting().includes('Rewards:')) {
                            end_line = index - 2;
                        }
                    });
                    for (let i = 2; i <= end_line; i++) {
                        const item_info = lores[i].removeFormatting().replace(visitor_item_re, '$1.$2').split('.');
                        const data = {
                            name: item_info[0],
                            amount: item_info[1].replace(',', '')
                        };
                        item_list.push(data);
                    }
                    const copper_line = end_line + 5;
                    copper = parseInt(lores[copper_line].removeFormatting().replace(copper_re, '$1'));
                }
            });
            // get id of item
            item_list.map((item) => {
                item_data.items.map((item_metadata) => {
                    if (item.name === item_metadata.name) {
                        item.id = item_metadata.id;
                    }
                });
            });
            // get bazaar data and render
            request({
                url: `https://api.hypixel.net/skyblock/bazaar?api=${data.api_key}`,
                method: 'GET',
                headers: {
                    "User-Agent": "Mozilla/5.0 (ChatTriggers)",
                    "Content-Type": "application/json"
                }
            }).then(res => {
                let instant_buy_all = 0;
                let highest_buy_all = 0;
                item_list.map((item, index) => {
                    const instant_buy = res.data.products[item.id]['buy_summary'][0]['pricePerUnit'];
                    const highest_buy = res.data.products[item.id]['sell_summary'][0]['pricePerUnit'];
                    const instant_buy_total = formatNumToCoin(instant_buy * parseInt(item.amount));
                    const highest_buy_total = formatNumToCoin(highest_buy * parseInt(item.amount));
                    instant_buy_all += parseInt(instant_buy * parseInt(item.amount));
                    highest_buy_all += parseInt(highest_buy * parseInt(item.amount));
                    display.addLine(new DisplayLine(`${item.name}`).setTextColor(Renderer.WHITE));
                    display.addLine(new DisplayLine(` Insta-Buy: ${formatNumToCoin(instant_buy)} x ${item.amount} = ${instant_buy_total}`).setTextColor(Renderer.YELLOW));
                    display.addLine(new DisplayLine(` Buy Order: ${formatNumToCoin(highest_buy)} x ${item.amount} = ${highest_buy_total}`).setTextColor(Renderer.GREEN));
                    if (index === item_list.length - 1) {
                        display.addLine('');
                        display.addLine(new DisplayLine('Total Price').setTextColor(Renderer.AQUA));
                        display.addLine(new DisplayLine(` Insta-Buy: ${formatNumToCoin(instant_buy_all)}`).setTextColor(Renderer.YELLOW));
                        display.addLine(new DisplayLine(` Buy Order: ${formatNumToCoin(highest_buy_all)}`).setTextColor(Renderer.GREEN));
                        display.addLine(new DisplayLine('Coins per Copper').setTextColor(Renderer.RED));
                        display.addLine(new DisplayLine(` Insta-Buy: ${(instant_buy_all / copper).toFixed(2)}`).setTextColor(Renderer.YELLOW));
                        display.addLine(new DisplayLine(` Buy Order: ${(highest_buy_all / copper).toFixed(2)}`).setTextColor(Renderer.GREEN));
                    }
                })
            });
        });
    }
});

register('guiClosed', () => {
    guiOpened = false;
    display?.clearLines();
});

const checkVisitorName = (name) => {
    let exist = false;
    Visitors.map((visitor) => {
        if (visitor === name) {
            exist = true;
        }
    });
    return exist;
}

const formatNumToCoin = (n) => {
    const integer_n = n.toFixed();
    return integer_n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}