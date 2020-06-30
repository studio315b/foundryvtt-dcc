/**
 * DCC
 * Software License: GNU GPLv3
 */

// Import Modules
import {DCCActor} from "./actor.js";
import {DCCItemSheet} from "./item-sheet.js";
import {DCCActorSheet} from "./actor-sheet.js";
import {DCC} from './config.js';

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
    console.log(`DCC | Initializing Dungeon Crawl Classics System\n${DCC.ASCII}`);

    CONFIG.DCC = DCC;

    game.dcc = {
        DCCActor,
        rollDCCWeaponMacro
    };

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d20",
        decimals: 2
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = DCCActor;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("dcc", DCCActorSheet, {makeDefault: true});
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("dcc", DCCItemSheet, {makeDefault: true});

    Hooks.on("hotbarDrop", (bar, data, slot) => createDCCWeaponMacro(data, slot));

    // Register system settings
    game.settings.register("dcc", "macroShorthand", {
        name: "Shortened Macro Syntax",
        hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */

/* -------------------------------------------- */

/**
 * Create a Macro from an weapon drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDCCWeaponMacro(data, slot) {
    console.log(data);
    if (data.type !== "Item") return;
    if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
    const item = data.data;

    // Create the macro command
    const command = `game.dcc.rollDCCWeaponMacro("${item.id}");`;
    let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: "script",
            img: item.img,
            command: command,
            flags: {"dcc.itemMacro": true}
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemId
 * @return {Promise}
 */
function rollDCCWeaponMacro(itemId) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);

    // Trigger the item roll
    return actor.rollWeaponAttack(itemId);
}