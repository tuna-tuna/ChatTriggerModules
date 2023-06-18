/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import { request } from "axios";
import { Promise } from "../PromiseV2";
import PogObject from "PogData";

const File = Java.type("java.io.File");

// global vars
let guiOpened = false;
let connected = false;
let item_data;

const display = new Display();
display.setRenderLoc(600, 160);
display.setRegisterType('post gui render');
display.setBackground(DisplayHandler.Background.FULL);

// api key things
let data = new PogObject("KuudraProfitDisplay", {
    api_key: null
}, "playerData.json");

const fileExists = (loc) => {
    const file = new File(loc);
    return file.exists();
}

if (!fileExists("./config/ChatTriggers/modules/KuudraProfitDisplay/playerData.json")) {
    data.save();
}

register("command", (key) => {
    if (!key) {
        ChatLib.chat("§cCannot find API KEY!");
        return;
    }
    data.api_key = key;
    data.save();
    ChatLib.chat("§aAPI KEY Set!");
}).setCommandName("kpsetkey");

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
});

register('postGuiRender', () => {
    const inventory = Player.getContainer();
    if (!guiOpened && connected && inventory?.getName() === 'Paid Chest') {
        guiOpened = true;
        let guiLoaded = register('tick', () => {
            if (inventory.getStackInSlot(inventory.getSize() - 37) == null) return;
            guiLoaded.unregister();
            const item_list = [];
            let count = 0;
            let reward_item_attributes, attribute1, attribute2;
            inventory.getItems().map((item) => {
                if (item !== null && isRewardItem(item.getLore()) && count < 2) {
                    count++;
                    const reward_item_name = item.getName().removeFormatting();
                    let isAttributeItem = true;
                    let isShard = false;
                    try {
                        reward_item_attributes = item.getNBT().getTag('tag').getTag('ExtraAttributes').getTag('attributes').toString().replace('{', '').replace('}', '').split(',');
                        attribute1 = reward_item_attributes[0].split(':');
                        try {
                            attribute2 = reward_item_attributes[1].split(':');
                        } catch (error) {
                            isShard = true
                        }
                    } catch (error) {
                        isAttributeItem = false;
                    }
                    if (isAttributeItem && !isShard) {
                        const reward_item_data = {
                            name: reward_item_name,
                            id: '',
                            isAttribute: isAttributeItem,
                            attributes: [
                                {
                                    name: attribute1[0],
                                    value: attribute1[1]
                                },
                                {
                                    name: attribute2[0],
                                    value: attribute2[1]
                                }
                            ]
                        };
                        item_list.push(reward_item_data);
                    } else if (isAttributeItem && isShard) {
                        const reward_item_data = {
                            name: reward_item_name,
                            id: '',
                            isAttribute: isAttributeItem,
                            attributes: [
                                {
                                    name: attribute1[0],
                                    value: attribute1[1]
                                }
                            ]
                        };
                        item_list.push(reward_item_data);
                    } else {
                        const reward_item_data = {
                            name: reward_item_name,
                            id: '',
                            isAttribute: isAttributeItem,
                            attributes: [

                            ]
                        };
                        item_list.push(reward_item_data);
                    }
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

            // Primary Loot
            let primary_exist = false;
            const primary_item = item_list[0];
            const primary_urls = generateUrlFromItemData(primary_item);
            if (primary_urls.urls.length > 0) primary_exist = true;

            // Secondary Loot
            let secondary_exist = false;
            const secondary_item = item_list[1];
            const secondary_urls = generateUrlFromItemData(secondary_item);
            if (secondary_urls.urls.length > 0) secondary_exist = true;

            Promise.all(
                primary_exist && primary_urls.map((url) => {
                    request({
                        url: url,
                        method: "GET",
                        headers: {
                            "User-Agent": "Mozilla/5.0 (ChatTriggers)",
                            "Content-Type": "application/json"
                        }
                    });
                }),
                secondary_exist && secondary_urls.map((url) => {
                    request({
                        url: url,
                        method: "GET",
                        headers: {
                            "User-Agent": "Mozilla/5.0 (ChatTriggers)",
                            "Content-Type": "application/json"
                        }
                    });
                }),
            ).then((responses) => {
                // Primary
                if (primary_exist) {
                    display.addLine(new DisplayLine(`${primary_item.name}`)).setTextColor(Renderer.YELLOW);
                    if (primary_urls.urls.length === 3) {
                        const attr1str = ` ${primary_item.attributes[0].name} ${primary_item.attributes[0].value}+ Only: ${responses[0].data.data[0].price} coins`;
                        display.addLine(new DisplayLine(attr1str));
                        const attr2str = ` ${primary_item.attributes[1].name} ${primary_item.attributes[1].value}+ Only: ${responses[1].data.data[0].price} coins`;
                        display.addLine(new DisplayLine(attr2str));
                        const attrcombistr = ` ${primary_item.attributes[0].name} 1+ & ${primary_item.attributes[1].name} 1+: ${responses[2].data.data[0].price} coins`;
                        display.addLine(new DisplayLine(attrcombistr));
                    } else if (primary_urls.urls.length === 1) {

                    }
                }

                // Secondary
                if (secondary_exist) {
                    display.addLine('');
                    display.addLine(new DisplayLine(`${secondary_item.name}`)).setTextColor(Renderer.YELLOW);
                    // render without if cuz of the loot table
                }
            })

            let instant_buy_all = 0;
            let highest_buy_all = 0;
            item_list.map((item, index) => {
                // Primary Loot
                if (index === 0) {
                    // Mandraa (only bazaar item)
                    if (item.name === 'Mandraa') {
                        primary_sell_price = res.data.products['MANDRAA']['buy_summary'][0]['pricePerUnit'];
                    } else {

                    }
                }


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

            });
        });
    }
});

register('guiClosed', () => {
    guiOpened = false;
    display?.clearLines();
});

const isRewardItem = (lores) => {
    let isItem = false;
    lores.map((lore) => {
        if (lore.includes('Click the chest below to')) {
            isItem = true;
        }
    });
    return isItem;
}

const generateUrlFromItemData = (item) => {
    const base_url = 'https://hypixelattributeauction-production.up.railway.app/api/auction/item_id';
    if (item.attributes.length === 2) {
        // Attribute Items
        const attribute1_url = base_url + `/${item.id}?attribute1=${item.attributes[0].name}&attrlevel1=${item.attributes[0].value}`;
        const attribute2_url = base_url + `/${item.id}?attribute1=${item.attributes[1].name}&attrlevel1=${item.attributes[1].value}`;
        const attribute_combination_url = base_url + `/${item.id}?attribute1=${item.attributes[0].name}&attribute2=${item.attributes[1].name}`;
        return { urls: [attribute1_url, attribute2_url, attribute_combination_url] };
    } else if (item.attributes.length === 1) {
        // Attribute Shards
        if (parseInt(item.attributes[0].value) >= 4) return { urls: [] };
        const lowest_bin_url = base_url + `/ATTRIBUTE_SHARD?attribute1=${item.attributes[0].name}&attrlevel1=${item.attributes[0].value}`;
        return { urls: [lowest_bin_url] };
    } else {
        return { urls: [] };
    }
}